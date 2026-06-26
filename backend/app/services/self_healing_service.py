"""
Self-healing hub registration helper.

This module is called automatically by cluster_service.py after a Kubernetes
cluster has been bootstrapped. It applies the scoped spoke RBAC, extracts the
service-account token, builds a kubeconfig, and pushes it to the self-healing
hub via an authenticated API call.
"""
import base64
import os
import time
from pathlib import Path

import paramiko
import requests
from sqlalchemy.orm import Session

from app.models.cluster import Cluster

SPOKE_RBAC_PATH = Path(
    os.getenv(
        "SELF_HEALING_SPOKE_RBAC",
        str(Path(__file__).resolve().parents[1] / "assets" / "spoke-rbac.yaml"),
    )
)
HUB_REGISTER_URL = os.getenv(
    "SELF_HEALING_HUB_URL",
    "http://127.0.0.1:9091/api/spokes/register",
)
HUB_API_TOKEN = os.getenv("SELF_HEALING_HUB_TOKEN", "")
HUB_NAMESPACE = os.getenv(
    "SELF_HEALING_HUB_NAMESPACE",
    "kubernetes-self-healing-controller-system",
)


def _run_ssh(client: paramiko.SSHClient, cmd: str, timeout: int = 300) -> str:
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if exit_code != 0:
        raise RuntimeError(f"SSH command failed (exit {exit_code}):\n{err or out}")
    return out


def register_spoke_with_hub(
    cluster: Cluster,
    ssh_key: paramiko.RSAKey,
    db: Session,
) -> None:
    """
    Register an existing Kubernetes cluster as a spoke in the self-healing hub.

    The function updates `cluster.self_healing_status` in the database:
      - "pending"  -> registration started
      - "registered" -> hub accepted the spoke
      - "error"    -> something failed (see `self_healing_error`)
    """
    if not cluster.enable_self_healing:
        return

    if not SPOKE_RBAC_PATH.exists():
        raise FileNotFoundError(f"Spoke RBAC manifest not found: {SPOKE_RBAC_PATH}")

    if not HUB_API_TOKEN:
        raise RuntimeError("SELF_HEALING_HUB_TOKEN is not configured")

    if not cluster.master_public_ip:
        raise RuntimeError("Cluster has no master public IP")

    master_public_ip = cluster.master_public_ip
    cluster_name = cluster.name

    cluster.self_healing_status = "pending"
    cluster.self_healing_error = None
    db.commit()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # ── 1. Connect to master ─────────────────────────────────────────────
        client.connect(
            hostname=master_public_ip,
            username="root",
            pkey=ssh_key,
            timeout=20,
            allow_agent=False,
            look_for_keys=False,
        )

        # k3s stores its kubeconfig here; set KUBECONFIG so kubectl finds it
        kubectl = "KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl"

        # ── 2. Apply spoke RBAC ──────────────────────────────────────────────
        rbac_yaml = SPOKE_RBAC_PATH.read_text()
        stdin, _, _ = client.exec_command(f"{kubectl} apply -f -", timeout=120)
        stdin.write(rbac_yaml)
        stdin.channel.shutdown_write()
        exit_code = stdin.channel.recv_exit_status()
        if exit_code != 0:
            raise RuntimeError(f"Failed to apply spoke RBAC (exit {exit_code})")

        # ── 3. Wait for token Secret ─────────────────────────────────────────
        token_b64 = ""
        for _ in range(30):
            token_b64 = _run_ssh(
                client,
                f"{kubectl} get secret self-healing-controller-token "
                "-n kubernetes-self-healing-controller-system "
                "-o jsonpath='{.data.token}'",
                timeout=30,
            ).strip()
            if token_b64:
                break
            time.sleep(2)
        if not token_b64:
            raise RuntimeError("self-healing-controller-token did not become ready")

        ca_b64 = _run_ssh(
            client,
            f"{kubectl} get secret self-healing-controller-token "
            "-n kubernetes-self-healing-controller-system "
            "-o jsonpath='{.data.ca\\.crt}'",
            timeout=30,
        ).strip()

        # ── 4. Build scoped kubeconfig ───────────────────────────────────────
        kubeconfig = f"""apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: {ca_b64}
    server: https://{master_public_ip}:6443
  name: {cluster_name}
contexts:
- context:
    cluster: {cluster_name}
    user: self-healing-controller
  name: {cluster_name}
current-context: {cluster_name}
users:
- name: self-healing-controller
  user:
    token: {base64.b64decode(token_b64).decode()}
"""

        # ── 5. Push kubeconfig + SSH details to hub ──────────────────────────
        payload = {
            "name": cluster_name,
            "displayName": f"Marketplace cluster {cluster_name}",
            "kubeconfig": base64.b64encode(kubeconfig.encode()).decode(),
            "namespace": HUB_NAMESPACE,
            "sshHost": master_public_ip,
            "sshUser": "root",
            "sshKey": base64.b64encode(cluster.ssh_private_key.encode()).decode(),
        }

        resp = requests.post(
            HUB_REGISTER_URL,
            json=payload,
            headers={"Authorization": f"Bearer {HUB_API_TOKEN}"},
            timeout=30,
        )
        resp.raise_for_status()

        cluster.self_healing_status = "registered"
        cluster.self_healing_error = None
        print(f"[OK] Spoke '{cluster_name}' registered with self-healing hub.")

    except Exception as exc:
        cluster.self_healing_status = "error"
        cluster.self_healing_error = str(exc)
        print(f"[ERROR] Self-healing registration failed for '{cluster_name}': {exc}")
        # Do not re-raise: the cluster itself is healthy; registration can be
        # retried later without reprovisioning the whole cluster.

    finally:
        client.close()
        db.commit()
