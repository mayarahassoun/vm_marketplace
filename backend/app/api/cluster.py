import asyncio
import io
import json
import os
import threading
import uuid

import paramiko
import resend
import stripe
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import SessionLocal, get_db
from app.models.cluster import Cluster
from app.models.user import User

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

router = APIRouter(prefix="/api/clusters", tags=["Clusters"])

# In-memory progress store (same pattern as payment.py)
cluster_progress: dict = {}


class ClusterPayRequest(BaseModel):
    payment_method_id: str
    email: str
    amount: int
    cluster_data: dict


# ─── Pay + create ─────────────────────────────────────────────────────────────

@router.post("/pay-and-create")
def pay_and_create_cluster(
    payload: ClusterPayRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        intent = stripe.PaymentIntent.create(
            amount=payload.amount,
            currency="usd",
            payment_method=payload.payment_method_id,
            confirm=True,
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
        )
    except stripe.error.CardError as exc:
        raise HTTPException(status_code=400, detail=str(exc.user_message))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail="Payment failed")

    session_id = str(uuid.uuid4())
    cluster_progress[session_id] = {
        "steps": [
            {"id": 1, "label": "Payment Verified",              "status": "complete"},
            {"id": 2, "label": "Provisioning Infrastructure",   "status": "pending"},
            {"id": 3, "label": "Installing Container Runtime",  "status": "pending"},
            {"id": 4, "label": "Initializing Kubernetes Master","status": "pending"},
            {"id": 5, "label": "Joining Worker Nodes",          "status": "pending"},
            {"id": 6, "label": "Finalizing Cluster",            "status": "pending"},
        ],
        "progress": 15,
        "done": False,
        "error": None,
        "cluster_id": None,
    }

    threading.Thread(
        target=_create_cluster_background,
        args=(session_id, payload, current_user.id),
        daemon=True,
    ).start()

    return {"session_id": session_id}


def _update(store: dict, step_id: int, status: str, progress: int):
    for step in store["steps"]:
        if step["id"] == step_id:
            step["status"] = status
    store["progress"] = progress


def _create_cluster_background(session_id: str, payload: ClusterPayRequest, user_id: int):
    store = cluster_progress[session_id]
    db = SessionLocal()

    try:
        from app.services.cluster_service import (
            destroy_terraform_cluster,
            install_kubernetes,
            run_terraform_cluster,
        )

        # ── Step 2 : Terraform ─────────────────────────────────────────────
        _update(store, 2, "in_progress", 20)
        tf_result = run_terraform_cluster(payload.cluster_data)
        _update(store, 2, "complete", 40)

        master_public_ip   = tf_result["master_public_ip"]
        master_private_ip  = tf_result["master_private_ip"]
        worker_private_ips = tf_result["worker_private_ips"]
        ssh_key            = tf_result["ssh_key"]
        state_dir_name     = tf_result["state_dir_name"]
        password           = payload.cluster_data["administrator_password"]

        # Serialize the RSA key to PEM so we can store it and reuse it for SSH
        _pem_buf = io.StringIO()
        ssh_key.write_private_key(_pem_buf)
        ssh_private_key_pem = _pem_buf.getvalue()

        # ── Save cluster record (status=creating) ──────────────────────────
        cluster = Cluster(
            user_id=user_id,
            name=payload.cluster_data["cluster_name"],
            status="creating",
            worker_count=payload.cluster_data["worker_count"],
            master_flavor_id=payload.cluster_data["master_flavor_id"],
            worker_flavor_id=payload.cluster_data["worker_flavor_id"],
            image_id=payload.cluster_data["image_id"].strip(),
            availability_zone=payload.cluster_data["availability_zone"],
            security_group_id=payload.cluster_data["security_group_id"],
            subnet_id=payload.cluster_data["subnet_id"],
            system_disk_size=payload.cluster_data["system_disk_size"],
            master_public_ip=master_public_ip,
            master_private_ip=master_private_ip,
            worker_public_ips=json.dumps(worker_private_ips),
            ssh_private_key=ssh_private_key_pem,
            terraform_state_dir=state_dir_name,
        )
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
        store["cluster_id"] = cluster.id

        # ── Steps 3-5 : K8s bootstrap ──────────────────────────────────────
        _update(store, 3, "in_progress", 50)

        kubeconfig = install_kubernetes(
            master_public_ip=master_public_ip,
            master_private_ip=master_private_ip,
            worker_private_ips=worker_private_ips,
            password=password,
            ssh_key=ssh_key,
        )

        _update(store, 3, "complete", 60)
        _update(store, 4, "complete", 75)
        _update(store, 5, "complete", 90)

        # ── Step 6 : Finalise ──────────────────────────────────────────────
        _update(store, 6, "in_progress", 92)

        cluster.status = "running"
        cluster.kubeconfig = kubeconfig
        db.commit()

        # Send confirmation email
        try:
            resend.Emails.send({
                "from": os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
                "to": payload.email,
                "subject": "✅ Your Kubernetes Cluster is Ready!",
                "html": f"""
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                        <h1 style="color:#0f172a;">Your K8s Cluster is Ready! 🚀</h1>
                        <p>Cluster <strong>{cluster.name}</strong> has been successfully provisioned.</p>
                        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
                            <h2 style="color:#0f172a;margin-top:0;">Cluster Details</h2>
                            <p><strong>Name:</strong> {cluster.name}</p>
                            <p><strong>Master IP:</strong> {master_public_ip}</p>
                            <p><strong>Workers:</strong> {cluster.worker_count} node(s)</p>
                            <p><strong>Worker Private IPs:</strong> {', '.join(worker_private_ips)}</p>
                        </div>
                        <p style="color:#64748b;font-size:14px;">
                            API Server:<br/>
                            <code style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;display:inline-block;margin-top:8px;">
                                https://{master_public_ip}:6443
                            </code>
                        </p>
                        <p style="color:#64748b;font-size:13px;">Download your kubeconfig from the dashboard to use kubectl.</p>
                    </div>
                """,
            })
        except Exception as exc:
            print(f"⚠️ Email failed: {exc}")

        _update(store, 6, "complete", 100)
        store["done"] = True

    except Exception as exc:
        print(f"❌ Cluster creation error: {exc}")
        store["error"] = str(exc)
        store["done"] = True

        # Mark cluster as error in DB if it was created
        if store.get("cluster_id"):
            try:
                c = db.query(Cluster).filter(Cluster.id == store["cluster_id"]).first()
                if c:
                    c.status = "error"
                    db.commit()
            except Exception:
                pass

    finally:
        db.close()


# ─── Progress SSE ─────────────────────────────────────────────────────────────

@router.get("/progress/{session_id}")
async def cluster_progress_stream(session_id: str):
    async def event_stream():
        while True:
            if session_id not in cluster_progress:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break
            store = cluster_progress[session_id]
            yield f"data: {json.dumps(store)}\n\n"
            if store["done"]:
                break
            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── List clusters ────────────────────────────────────────────────────────────

@router.get("/")
def list_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clusters = (
        db.query(Cluster)
        .filter(Cluster.user_id == current_user.id)
        .order_by(Cluster.created_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "worker_count": c.worker_count,
            "master_public_ip": c.master_public_ip,
            "worker_private_ips": json.loads(c.worker_public_ips) if c.worker_public_ips else [],
            "master_flavor_id": c.master_flavor_id,
            "worker_flavor_id": c.worker_flavor_id,
            "image_id": c.image_id,
            "system_disk_size": c.system_disk_size,
            "has_kubeconfig": bool(c.kubeconfig),
            "has_ssh_key": bool(c.ssh_private_key),
            "created_at": str(c.created_at),
        }
        for c in clusters
    ]


# ─── Get kubeconfig ───────────────────────────────────────────────────────────

@router.get("/{cluster_id}/kubeconfig")
def get_kubeconfig(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cluster = (
        db.query(Cluster)
        .filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id)
        .first()
    )
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if not cluster.kubeconfig:
        raise HTTPException(status_code=404, detail="Kubeconfig not yet available")
    return {"kubeconfig": cluster.kubeconfig}


# ─── Delete cluster ───────────────────────────────────────────────────────────

@router.delete("/{cluster_id}")
def delete_cluster(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cluster = (
        db.query(Cluster)
        .filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id)
        .first()
    )
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = "deleting"
    db.commit()

    try:
        from app.services.cluster_service import destroy_terraform_cluster
        from pathlib import Path
        import os

        state_dir = cluster.terraform_state_dir or cluster.name
        states_root = Path(os.getenv(
            "TERRAFORM_CLUSTER_STATES_DIR",
            str(Path(__file__).resolve().parents[3] / "terraform_cluster_states"),
        ))
        if (states_root / state_dir).exists():
            destroy_terraform_cluster(state_dir)
        # If the state dir is gone, the cloud resources are already deleted —
        # just remove the DB record without running terraform destroy.
    except Exception as exc:
        cluster.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Terraform destroy failed: {exc}")

    db.delete(cluster)
    db.commit()
    return {"message": "Cluster deleted successfully"}


# ─── Download SSH private key ─────────────────────────────────────────────────

@router.get("/{cluster_id}/ssh-key")
def get_ssh_key(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi.responses import Response
    cluster = (
        db.query(Cluster)
        .filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id)
        .first()
    )
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if not cluster.ssh_private_key:
        raise HTTPException(status_code=404, detail="No SSH key stored for this cluster")
    return Response(
        content=cluster.ssh_private_key,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=id_rsa_{cluster.name}"},
    )


# ─── SSH terminal (WebSocket, key-based auth) ─────────────────────────────────

@router.websocket("/{cluster_id}/ssh-ws")
async def cluster_ssh_terminal(cluster_id: int, websocket: WebSocket):
    await websocket.accept()

    db = SessionLocal()
    try:
        cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
        if not cluster or not cluster.master_public_ip:
            await websocket.send_text("\r\n❌ Cluster not found or has no public IP.\r\n")
            await websocket.close()
            return

        host = cluster.master_public_ip
        pkey = None
        password = None

        if cluster.ssh_private_key:
            pkey = paramiko.RSAKey.from_private_key(io.StringIO(cluster.ssh_private_key))
        else:
            # No stored key — expect the first message to carry {"password": "..."}
            await websocket.send_text("\r\n🔑 No SSH key stored. Waiting for password...\r\n")
            try:
                first_msg = await asyncio.wait_for(websocket.receive_json(), timeout=30)
                password = first_msg.get("password")
                if not password:
                    await websocket.send_text("\r\n❌ No password provided.\r\n")
                    await websocket.close()
                    return
            except asyncio.TimeoutError:
                await websocket.send_text("\r\n❌ Timed out waiting for password.\r\n")
                await websocket.close()
                return
    finally:
        db.close()

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        if pkey:
            ssh.connect(hostname=host, username="root", pkey=pkey, timeout=15,
                        allow_agent=False, look_for_keys=False)
        else:
            ssh.connect(hostname=host, username="root", password=password, timeout=15)

        channel = ssh.invoke_shell(term="xterm", width=220, height=50)
        channel.setblocking(False)

        await websocket.send_text(f"\r\n✅ Connected to cluster master {host}\r\n\r\n")

        async def read_ssh():
            while True:
                await asyncio.sleep(0.05)
                try:
                    if channel.recv_ready():
                        data = channel.recv(4096).decode("utf-8", errors="replace")
                        await websocket.send_text(data)
                    if channel.exit_status_ready():
                        await websocket.send_text("\r\n🔌 Connection closed.\r\n")
                        break
                except Exception:
                    break

        async def read_ws():
            while True:
                try:
                    data = await websocket.receive_text()
                    channel.send(data)
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        await asyncio.gather(read_ssh(), read_ws())

    except Exception as e:
        await websocket.send_text(f"\r\n❌ SSH Error: {str(e)}\r\n")
    finally:
        ssh.close()
        try:
            await websocket.close()
        except Exception:
            pass
