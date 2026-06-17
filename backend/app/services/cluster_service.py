import json
import os
import shutil
import subprocess
import time
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

# ─── Kubernetes 1.29 installation commands (apt-based distros) ───────────────

_K8S_PREREQ = """
set -e
export DEBIAN_FRONTEND=noninteractive

# Disable swap permanently
swapoff -a
sed -i '/swap/d' /etc/fstab

# Kernel modules required by containerd/K8s
modprobe overlay
modprobe br_netfilter
cat > /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
EOF

# Sysctl params
cat > /etc/sysctl.d/k8s.conf <<EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# Install containerd
apt-get update -y
apt-get install -y containerd

mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

# Install kubeadm, kubelet, kubectl (K8s 1.29)
apt-get install -y apt-transport-https ca-certificates curl gpg
mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' \
  > /etc/apt/sources.list.d/kubernetes.list
apt-get update -y
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl
systemctl enable kubelet
"""


def _ssh_connect(ip: str, password: str, max_retries: int = 12, delay: int = 15) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    for attempt in range(max_retries):
        try:
            client.connect(hostname=ip, username="root", password=password, timeout=15)
            return client
        except Exception as exc:
            print(f"  SSH {ip}: attempt {attempt + 1}/{max_retries} — {exc}")
            if attempt < max_retries - 1:
                time.sleep(delay)
    raise RuntimeError(f"Cannot SSH into {ip} after {max_retries} attempts")


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
    working_dir = TERRAFORM_CLUSTER_STATES / cluster_name
    working_dir.mkdir(parents=True, exist_ok=True)

    for tf_file in TERRAFORM_CLUSTER_SOURCE.glob("*.tf"):
        shutil.copy2(tf_file, working_dir / tf_file.name)

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
    }

    missing = [k for k, v in tf_vars.items() if v in (None, "", [])]
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
        "worker_public_ips": _val("worker_public_ips") or [],
        "worker_private_ips": _val("worker_private_ips") or [],
    }


def destroy_terraform_cluster(cluster_name: str) -> None:
    working_dir = TERRAFORM_CLUSTER_STATES / cluster_name
    if not working_dir.exists():
        raise FileNotFoundError(f"Terraform cluster state not found: {cluster_name}")

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
    worker_public_ips: list[str],
    password: str,
) -> str:
    """
    Bootstrap a K8s cluster. Returns the kubeconfig (with public API server URL)
    that the end-user can use with kubectl.
    """
    all_ips = [master_public_ip] + worker_public_ips

    # ── 1. Wait for VMs to finish booting ────────────────────────────────────
    print("⏳ Waiting 90 s for VMs to finish booting...")
    time.sleep(90)

    # ── 2. Install containerd + kubeadm on every node ────────────────────────
    print("📦 Installing K8s prerequisites on all nodes...")
    connections: list[paramiko.SSHClient] = []
    for ip in all_ips:
        print(f"  Connecting to {ip}...")
        conn = _ssh_connect(ip, password)
        connections.append(conn)

    for ip, conn in zip(all_ips, connections):
        print(f"  Installing on {ip}...")
        _run_ssh(conn, _K8S_PREREQ, timeout=600)

    # ── 3. kubeadm init on master ─────────────────────────────────────────────
    master_conn = connections[0]
    print(f"🚀 Running kubeadm init on master ({master_public_ip})...")

    init_cmd = (
        f"kubeadm init "
        f"--pod-network-cidr=10.244.0.0/16 "
        f"--apiserver-advertise-address={master_private_ip} "
        f"--apiserver-cert-extra-sans={master_public_ip} "
        f"--ignore-preflight-errors=NumCPU"
    )
    _run_ssh(master_conn, init_cmd, timeout=300)

    # Setup kubeconfig for root on master
    kubeconfig_setup = (
        "mkdir -p $HOME/.kube && "
        "cp -f /etc/kubernetes/admin.conf $HOME/.kube/config && "
        "chown $(id -u):$(id -g) $HOME/.kube/config"
    )
    _run_ssh(master_conn, kubeconfig_setup)

    # ── 4. Deploy Flannel CNI ─────────────────────────────────────────────────
    print("🌐 Deploying Flannel CNI...")
    _run_ssh(
        master_conn,
        "kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml",
        timeout=120,
    )

    # ── 5. Get join command ───────────────────────────────────────────────────
    join_command = _run_ssh(
        master_conn,
        "kubeadm token create --print-join-command",
    ).strip()
    print(f"  Join command obtained.")

    # ── 6. Join workers ───────────────────────────────────────────────────────
    for ip, conn in zip(worker_public_ips, connections[1:]):
        print(f"  Worker {ip} joining cluster...")
        _run_ssh(conn, join_command, timeout=180)

    # ── 7. Retrieve kubeconfig and rewrite server URL to public IP ────────────
    raw_kubeconfig = _run_ssh(master_conn, "cat /etc/kubernetes/admin.conf")
    kubeconfig = raw_kubeconfig.replace(
        f"https://{master_private_ip}:6443",
        f"https://{master_public_ip}:6443",
    )

    # ── 8. Close all SSH connections ──────────────────────────────────────────
    for conn in connections:
        conn.close()

    print("✅ Kubernetes cluster is ready.")
    return kubeconfig
