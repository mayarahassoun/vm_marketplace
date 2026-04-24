import os
import uuid
import json
import asyncio
import threading
import time
import stripe
import resend

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db, SessionLocal

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

router = APIRouter(prefix="/api/payment", tags=["Payment"])

progress_store: dict = {}


class PaymentRequest(BaseModel):
    payment_method_id: str
    email: str
    amount: int
    vm_data: dict


@router.post("/pay-and-create")
def pay_and_create_vm(payload: PaymentRequest):
    # 1 — Stripe payment
    try:
        intent = stripe.PaymentIntent.create(
            amount=payload.amount,
            currency="usd",
            payment_method=payload.payment_method_id,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never",
            },
        )
    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=str(e.user_message))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if intent.status != "succeeded":
        raise HTTPException(status_code=400, detail="Payment failed")

    # 2 — Génère session_id et initialise le store
    session_id = str(uuid.uuid4())
    progress_store[session_id] = {
        "steps": [
            {"id": 1, "label": "Verifying Payment", "status": "complete"},
            {"id": 2, "label": "Initializing VM Environment", "status": "pending"},
            {"id": 3, "label": "Configuring Security Settings", "status": "pending"},
            {"id": 4, "label": "Generating Access Credentials", "status": "pending"},
            {"id": 5, "label": "Finalizing Deployment", "status": "pending"},
        ],
        "progress": 20,
        "done": False,
        "error": None,
    }

    # 3 — Lance Terraform en background
    threading.Thread(
        target=create_vm_background,
        args=(session_id, payload),
        daemon=True
    ).start()

    # 4 — Retourne immédiatement le session_id
    return {"session_id": session_id}


def create_vm_background(session_id: str, payload: PaymentRequest):
    store = progress_store[session_id]

    def update(step_id: int, status: str, progress: int):
        for step in store["steps"]:
            if step["id"] == step_id:
                step["status"] = status
        store["progress"] = progress

    # DB session séparée pour le thread
    db = SessionLocal()

    try:
        # Step 2
        update(2, "in_progress", 30)
        time.sleep(1)
        update(2, "complete", 40)

        # Step 3 — Terraform
        update(3, "in_progress", 50)
        from app.services.terraform_service import run_terraform
        result = run_terraform(payload.vm_data)
        update(3, "complete", 60)

        # Step 4
        update(4, "in_progress", 75)
        time.sleep(1)
        update(4, "complete", 85)

        # Step 5 — Save to DB
        update(5, "in_progress", 90)
        from app.models.virtual_machine import VirtualMachine
        vm = VirtualMachine(
            instance_name=payload.vm_data["instance_name"],
            cloud_vm_id=result.get("cloud_vm_id"),
            status="running",
            availability_zone=payload.vm_data["availability_zone"],
            flavor_id=payload.vm_data["instance_flavor_id"],
            image_id=payload.vm_data["instance_image_id"],
            security_group_id=payload.vm_data["security_group_id"],
            subnet_cidr=payload.vm_data["subnet_id"],
            system_disk_type=payload.vm_data["system_disk_type"],
            system_disk_size=payload.vm_data["system_disk_size"],
            public_ip=result.get("public_ip"),
        )
        db.add(vm)
        db.commit()
        db.refresh(vm)

        # Send email
        try:
            resend.Emails.send({
                "from": os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
                "to": payload.email,
                "subject": "✅ Your VM has been created!",
                "html": f"""
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #0f172a;">Your VM is ready! 🚀</h1>
                        <p>Your virtual machine <strong>{payload.vm_data['instance_name']}</strong> has been successfully created.</p>
                        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                            <h2 style="color: #0f172a; margin-top: 0;">VM Details</h2>
                            <p><strong>Name:</strong> {payload.vm_data['instance_name']}</p>
                            <p><strong>Public IP:</strong> {result.get('public_ip', 'N/A')}</p>
                            <p><strong>Region:</strong> {payload.vm_data['availability_zone']}</p>
                            <p><strong>Disk:</strong> {payload.vm_data['system_disk_size']} GB {payload.vm_data['system_disk_type']}</p>
                        </div>
                        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                            <h2 style="color: #15803d; margin-top: 0;">Payment Confirmed 💳</h2>
                            <p><strong>Amount:</strong> ${payload.amount / 100:.2f}/month</p>
                            <p><strong>Status:</strong> ✅ Succeeded</p>
                        </div>
                        <p style="color: #64748b; font-size: 14px;">
                            Connect via SSH:<br/>
                            <code style="background: #0f172a; color: #e2e8f0; padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 8px;">
                                ssh root@{result.get('public_ip', 'YOUR_IP')}
                            </code>
                        </p>
                    </div>
                """,
            })
        except Exception as e:
            print(f"⚠️ Email failed: {e}")

        update(5, "complete", 100)
        store["done"] = True

    except Exception as e:
        store["error"] = str(e)
        store["done"] = True

    finally:
        db.close()


@router.get("/progress/{session_id}")
async def get_progress(session_id: str):
    async def event_stream():
        while True:
            if session_id not in progress_store:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break

            store = progress_store[session_id]
            yield f"data: {json.dumps(store)}\n\n"

            if store["done"]:
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )