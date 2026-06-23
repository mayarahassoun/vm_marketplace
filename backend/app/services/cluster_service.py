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

# ─── Kubernetes 1.29 installation commands (apt-based distros) ───────────────

_K8S_PREREQ = """
set -e
export DEBIAN_FRONTEND=noninteractive

# Override DNS — HCS VMs may have internal-only resolvers
printf 'nameserver 8.8.8.8\\nnameserver 1.1.1.1\\nnameserver 114.114.114.114\\n' > /etc/resolv.conf

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

# Sysctl params (ignore warnings for unsupported keys in HCS VMs)
cat > /etc/sysctl.d/k8s.conf <<EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system 2>/dev/null || true

# Install containerd
apt-get update -y
apt-get install -y --fix-missing containerd

mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

# Install kubeadm, kubelet, kubectl (K8s 1.29)
apt-get install -y --fix-missing apt-transport-https ca-certificates curl gpg
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
    Bootstrap a K8s cluster. Workers are reached via the master as a jump host
    (no public IP needed on worker nodes). Returns kubeconfig with public API URL.
    """
    # ── 1. Wait for VMs to finish booting ────────────────────────────────────
    print("⏳ Waiting 120 s for VMs to finish booting...")
    time.sleep(120)

    # ── 2. Connect to master ──────────────────────────────────────────────────
    print(f"📦 Connecting to master {master_public_ip}...")
    master_conn = _ssh_connect(master_public_ip, pkey=ssh_key)

    # ── 3. Install K8s prerequisites on master ────────────────────────────────
    print("  Installing K8s prerequisites on master...")
    _run_ssh(master_conn, _K8S_PREREQ, timeout=600)

    # ── 4. Enable NAT on master so workers can reach the internet ────────────
    # Workers have private IPs only; we route their traffic through the master.
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

    # ── 5. Connect to workers via master (jump host) and install prereqs ──────
    worker_conns: list[paramiko.SSHClient] = []
    for priv_ip in worker_private_ips:
        print(f"  Connecting to worker {priv_ip} via jump...")
        conn = _ssh_connect_via_jump(master_conn, priv_ip, pkey=ssh_key)
        worker_conns.append(conn)

        # Route worker internet traffic through master
        _run_ssh(
            conn,
            f"ip route replace default via {master_private_ip} ; "
            f"printf 'nameserver 8.8.8.8\\nnameserver 1.1.1.1\\n' > /etc/resolv.conf",
        )
        print(f"  Installing K8s prerequisites on worker {priv_ip}...")
        _run_ssh(conn, _K8S_PREREQ, timeout=600)

    # ── 5. kubeadm init on master ─────────────────────────────────────────────
    print(f"🚀 Running kubeadm init on master ({master_private_ip})...")
    init_cmd = (
        f"kubeadm init "
        f"--pod-network-cidr=10.244.0.0/16 "
        f"--apiserver-advertise-address={master_private_ip} "
        f"--apiserver-cert-extra-sans={master_public_ip} "
        f"--ignore-preflight-errors=NumCPU"
    )
    _run_ssh(master_conn, init_cmd, timeout=300)

    kubeconfig_setup = (
        "mkdir -p $HOME/.kube && "
        "cp -f /etc/kubernetes/admin.conf $HOME/.kube/config && "
        "chown $(id -u):$(id -g) $HOME/.kube/config"
    )
    _run_ssh(master_conn, kubeconfig_setup)

    # ── 6. Deploy Flannel CNI ─────────────────────────────────────────────────
    print("🌐 Deploying Flannel CNI...")
    _run_ssh(
        master_conn,
        "kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml",
        timeout=120,
    )

    # ── 7. Get join command and join workers ──────────────────────────────────
    join_command = _run_ssh(
        master_conn,
        "kubeadm token create --print-join-command",
    ).strip()

    for priv_ip, conn in zip(worker_private_ips, worker_conns):
        print(f"  Worker {priv_ip} joining cluster...")
        _run_ssh(conn, join_command, timeout=180)

    # ── 8. Retrieve kubeconfig and rewrite server URL to public IP ────────────
    raw_kubeconfig = _run_ssh(master_conn, "cat /etc/kubernetes/admin.conf")
    kubeconfig = raw_kubeconfig.replace(
        f"https://{master_private_ip}:6443",
        f"https://{master_public_ip}:6443",
    )

    # ── 9. Close all SSH connections ──────────────────────────────────────────
    for conn in worker_conns:
        conn.close()
    master_conn.close()

    print("✅ Kubernetes cluster is ready.")
    return kubeconfig
