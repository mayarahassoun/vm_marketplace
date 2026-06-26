import io
import json
import os
import shutil
import subprocess
import time
import uuid
from pathlib import Path

import paramiko

TERRAFORM_CLUSTER_SOURCE = Path(
    os.getenv(
        "TERRAFORM_CLUSTER_DIR",
        str(Path(__file__).resolve().parents[3] / "terraform_cluster"),
    )
)

TERRAFORM_CLUSTER_STATES = Path(
    os.getenv(
        "TERRAFORM_CLUSTER_STATES_DIR",
        str(Path(__file__).resolve().parents[3] / "terraform_cluster_states"),
    )
)



def _generate_ssh_keypair() -> tuple[paramiko.RSAKey, str]:
    """Generate a fresh RSA key pair. Returns (private_key, public_key_line)."""
    key = paramiko.RSAKey.generate(2048)
    public_key_line = f"ssh-rsa {key.get_base64()} k8s-cluster"
    return key, public_key_line


def _ssh_connect(ip: str, pkey: paramiko.RSAKey, max_retries: int = 20, delay: int = 20) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    for attempt in range(max_retries):
        try:
            client.connect(
                hostname=ip,
                username="root",
                pkey=pkey,
                timeout=20,
                allow_agent=False,
                look_for_keys=False,
            )
            return client
        except Exception as exc:
            print(f"  SSH {ip}: attempt {attempt + 1}/{max_retries} — {exc}")
            if attempt < max_retries - 1:
                time.sleep(delay)
    raise RuntimeError(f"Cannot SSH into {ip} after {max_retries} attempts")


def _ssh_connect_via_jump(
    jump_client: paramiko.SSHClient,
    target_ip: str,
    pkey: paramiko.RSAKey,
    max_retries: int = 15,
    delay: int = 20,
) -> paramiko.SSHClient:
    """Connect to a private-network node through the master as a jump host."""
    for attempt in range(max_retries):
        try:
            transport = jump_client.get_transport()
            channel = transport.open_channel(
                "direct-tcpip", (target_ip, 22), ("127.0.0.1", 0)
            )
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(
                hostname=target_ip,
                username="root",
                pkey=pkey,
                sock=channel,
                timeout=20,
                allow_agent=False,
                look_for_keys=False,
            )
            return client
        except Exception as exc:
            print(f"  SSH jump {target_ip}: attempt {attempt + 1}/{max_retries} — {exc}")
            if attempt < max_retries - 1:
                time.sleep(delay)
    raise RuntimeError(f"Cannot SSH into {target_ip} via jump host after {max_retries} attempts")


def _run_ssh(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> str:
    """Run a command via SSH and return stdout. Raises on non-zero exit."""
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if exit_code != 0:
        raise RuntimeError(f"SSH command failed (exit {exit_code}):\n{err or out}")
    return out


# ─── Terraform ───────────────────────────────────────────────────────────────

def run_terraform_cluster(cluster_data: dict) -> dict:
    if not TERRAFORM_CLUSTER_SOURCE.exists():
        raise FileNotFoundError(f"Terraform cluster template not found: {TERRAFORM_CLUSTER_SOURCE}")

    cluster_name = cluster_data["cluster_name"]
    # Use a unique state directory so two clusters with the same user-visible
    # name never share Terraform state and accidentally destroy each other's nodes.
    state_dir_name = f"{cluster_name}-{uuid.uuid4().hex[:8]}"
    working_dir = TERRAFORM_CLUSTER_STATES / state_dir_name
    working_dir.mkdir(parents=True, exist_ok=True)

    for tf_file in TERRAFORM_CLUSTER_SOURCE.glob("*.tf"):
        shutil.copy2(tf_file, working_dir / tf_file.name)

    # Generate a fresh SSH key pair for this cluster
    ssh_key, public_key_line = _generate_ssh_keypair()

    tf_vars = {
        "access_key": os.getenv("HCS_ACCESS_KEY"),
        "secret_key": os.getenv("HCS_SECRET_KEY"),
        "cluster_name": cluster_name,
        "image_id": cluster_data["image_id"].strip(),
        "security_group_id": cluster_data["security_group_id"],
        "administrator_password": cluster_data["administrator_password"],
        "subnet_id": cluster_data["subnet_id"],
        "availability_zone": cluster_data["availability_zone"],
        "master_flavor_id": cluster_data["master_flavor_id"],
        "worker_flavor_id": cluster_data["worker_flavor_id"],
        "system_disk_type": cluster_data.get("system_disk_type", "SSD"),
        "system_disk_size": cluster_data["system_disk_size"],
        "worker_count": cluster_data["worker_count"],
        "ssh_public_key": public_key_line,
        "self_healing_hub_ip": os.getenv("SELF_HEALING_HUB_IP", ""),
    }

    missing = [k for k, v in tf_vars.items() if v in (None, "", []) and k != "self_healing_hub_ip"]
    if missing:
        raise ValueError(f"Missing Terraform variables: {missing}")

    (working_dir / "terraform.auto.tfvars.json").write_text(
        json.dumps(tf_vars, indent=2), encoding="utf-8"
    )

    for cmd in [
        ["terraform", "init"],
        ["terraform", "apply", "-auto-approve"],
    ]:
        result = subprocess.run(cmd, cwd=working_dir, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"Command failed: {' '.join(cmd)}\n{result.stdout}\n{result.stderr}"
            )

    outputs_result = subprocess.run(
        ["terraform", "output", "-json"],
        cwd=working_dir,
        capture_output=True,
        text=True,
    )
    if outputs_result.returncode != 0:
        raise RuntimeError(f"terraform output failed:\n{outputs_result.stderr}")

    outputs = json.loads(outputs_result.stdout) if outputs_result.stdout.strip() else {}

    def _val(key: str):
        entry = outputs.get(key, {})
        return entry.get("value") if isinstance(entry, dict) else None

    return {
        "master_public_ip": _val("master_public_ip"),
        "master_private_ip": _val("master_private_ip"),
        "worker_private_ips": _val("worker_private_ips") or [],
        "ssh_key": ssh_key,
        "state_dir_name": state_dir_name,
    }


def destroy_terraform_cluster(state_dir: str) -> None:
    working_dir = TERRAFORM_CLUSTER_STATES / state_dir
    if not working_dir.exists():
        raise FileNotFoundError(f"Terraform cluster state not found: {state_dir}")

    result = subprocess.run(
        ["terraform", "destroy", "-auto-approve"],
        cwd=working_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Terraform destroy failed:\n{result.stdout}\n{result.stderr}")

    shutil.rmtree(working_dir, ignore_errors=True)


# ─── Kubernetes bootstrap ─────────────────────────────────────────────────────

def install_kubernetes(
    master_public_ip: str,
    master_private_ip: str,
    worker_private_ips: list[str],
    password: str,
    ssh_key: paramiko.RSAKey = None,
) -> str:
    """
    Bootstrap a k3s cluster. Workers are reached via the master as a jump host
    (no public IP needed on worker nodes). Returns kubeconfig with public API URL.
    """
    # ── 1. Wait for VMs to finish booting ────────────────────────────────────
    print("⏳ Waiting 120 s for VMs to finish booting...")
    time.sleep(120)

    # ── 2. Connect to master ──────────────────────────────────────────────────
    print(f"📦 Connecting to master {master_public_ip}...")
    master_conn = _ssh_connect(master_public_ip, pkey=ssh_key)

    # ── 3. Fix DNS on master (HCS VMs may have internal-only resolvers) ───────
    _run_ssh(
        master_conn,
        "printf 'nameserver 8.8.8.8\\nnameserver 1.1.1.1\\nnameserver 114.114.114.114\\n' > /etc/resolv.conf",
    )

    # ── 4. Enable NAT so workers can reach the internet via master ────────────
    if worker_private_ips:
        print("  Enabling IP masquerading on master for worker internet access...")
        master_iface = _run_ssh(
            master_conn,
            "ip -o -4 route show to default | awk '{print $5}' | head -1",
        ).strip() or "eth0"
        _run_ssh(
            master_conn,
            f"echo 1 > /proc/sys/net/ipv4/ip_forward ; "
            f"iptables -t nat -A POSTROUTING -o {master_iface} -j MASQUERADE || true",
        )

    # ── 5. Install k3s server on master ──────────────────────────────────────
    print("🚀 Installing k3s server on master...")
    _run_ssh(
        master_conn,
        f"curl -sfL https://get.k3s.io | "
        f"INSTALL_K3S_EXEC='server --tls-san {master_public_ip} --node-external-ip {master_public_ip}' "
        f"sh -",
        timeout=300,
    )

    # ── 6. Wait for k3s node to be Ready ─────────────────────────────────────
    print("  Waiting for k3s to become ready...")
    _run_ssh(
        master_conn,
        "until k3s kubectl get nodes 2>/dev/null | grep -q ' Ready'; do sleep 5; done",
        timeout=120,
    )

    # ── 7. Read node token for worker joins ───────────────────────────────────
    node_token = _run_ssh(
        master_conn,
        "cat /var/lib/rancher/k3s/server/node-token",
    ).strip()

    # ── 8. Connect to each worker via jump host and install k3s agent ─────────
    for priv_ip in worker_private_ips:
        print(f"  Connecting to worker {priv_ip} via jump...")
        worker_conn = _ssh_connect_via_jump(master_conn, priv_ip, pkey=ssh_key)

        _run_ssh(
            worker_conn,
            f"ip route replace default via {master_private_ip} ; "
            f"printf 'nameserver 8.8.8.8\\nnameserver 1.1.1.1\\n' > /etc/resolv.conf",
        )

        print(f"  Installing k3s agent on worker {priv_ip}...")
        _run_ssh(
            worker_conn,
            f"curl -sfL https://get.k3s.io | "
            f"K3S_URL=https://{master_private_ip}:6443 "
            f"K3S_TOKEN={node_token} "
            f"sh -",
            timeout=300,
        )
        worker_conn.close()

    # ── 9. Retrieve kubeconfig and rewrite server URL to public IP ────────────
    raw_kubeconfig = _run_ssh(master_conn, "cat /etc/rancher/k3s/k3s.yaml")
    kubeconfig = raw_kubeconfig.replace(
        "https://127.0.0.1:6443",
        f"https://{master_public_ip}:6443",
    )

    master_conn.close()
    print("✅ k3s cluster is ready.")
    return kubeconfig
