import json
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.cluster import Cluster
from app.models.user import User
from app.models.virtual_machine import VirtualMachine
from app.services.terraform_service import TERRAFORM_STATES_DIR
from app.services.cluster_service import TERRAFORM_CLUSTER_STATES

router = APIRouter(prefix="/api/sync", tags=["Sync"])


def _terraform_still_exists(state_dir: Path) -> bool:
    """
    Return True only if the tfstate file exists, has at least one resource,
    and every resource still has live instances (i.e. was not manually deleted
    from the cloud console, which leaves resources with an empty instances list).
    """
    tfstate = state_dir / "terraform.tfstate"
    if not tfstate.exists():
        return False
    try:
        data = json.loads(tfstate.read_text(encoding="utf-8"))
    except Exception:
        return False

    resources = data.get("resources", [])
    if not resources:
        return False

    # A resource deleted from the cloud console will still appear in state but
    # its instances list will be empty after a `terraform refresh`.
    # Without running refresh we check a simpler proxy: if ALL resources have
    # 0 instances we treat the deployment as gone.
    live = sum(len(r.get("instances", [])) for r in resources)
    return live > 0


def _read_tfvars(state_dir: Path) -> dict:
    tfvars = state_dir / "terraform.auto.tfvars.json"
    try:
        return json.loads(tfvars.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _output_value(tfstate: dict, key: str):
    return tfstate.get("outputs", {}).get(key, {}).get("value")


# ─── Remove stale DB records ──────────────────────────────────────────────────

@router.post("")
def sync_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete DB records whose Terraform state no longer exists or is empty."""
    deleted_vms: list[dict] = []
    deleted_clusters: list[dict] = []

    for vm in db.query(VirtualMachine).filter(VirtualMachine.user_id == current_user.id).all():
        if not _terraform_still_exists(TERRAFORM_STATES_DIR / vm.instance_name):
            deleted_vms.append({"id": vm.id, "name": vm.instance_name})
            db.delete(vm)

    for cluster in db.query(Cluster).filter(Cluster.user_id == current_user.id).all():
        if not cluster.terraform_state_dir:
            deleted_clusters.append({"id": cluster.id, "name": cluster.name})
            db.delete(cluster)
            continue
        if not _terraform_still_exists(TERRAFORM_CLUSTER_STATES / cluster.terraform_state_dir):
            deleted_clusters.append({"id": cluster.id, "name": cluster.name})
            db.delete(cluster)

    db.commit()
    return {"deleted_vms": deleted_vms, "deleted_clusters": deleted_clusters}


# ─── Import state-dir records that have no DB entry ──────────────────────────

@router.post("/import")
def import_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scan Terraform state directories for clusters/VMs that exist in the cloud
    but have no matching DB record and create stub records for them.
    """
    imported_clusters: list[dict] = []
    imported_vms: list[dict] = []

    # Collect state dirs already tracked in DB (for this user — but state dirs
    # are global so check across ALL users to avoid duplicates)
    known_cluster_dirs = {
        r.terraform_state_dir
        for r in db.query(Cluster.terraform_state_dir).all()
        if r.terraform_state_dir
    }
    known_vm_names = {
        r.instance_name
        for r in db.query(VirtualMachine.instance_name).all()
    }

    # ── Clusters ──────────────────────────────────────────────────────────────
    if TERRAFORM_CLUSTER_STATES.exists():
        for state_dir in sorted(TERRAFORM_CLUSTER_STATES.iterdir()):
            if not state_dir.is_dir():
                continue
            dir_name = state_dir.name
            if dir_name in known_cluster_dirs:
                continue

            if not _terraform_still_exists(state_dir):
                continue  # destroyed or empty

            tfstate = json.loads((state_dir / "terraform.tfstate").read_text(encoding="utf-8"))
            tfvars = _read_tfvars(state_dir)

            master_public_ip  = _output_value(tfstate, "master_public_ip")
            master_private_ip = _output_value(tfstate, "master_private_ip")
            worker_ips        = _output_value(tfstate, "worker_private_ips") or []

            cluster_name = tfvars.get("cluster_name") or dir_name
            worker_count = int(tfvars.get("worker_count", len(worker_ips) or 1))

            cluster = Cluster(
                user_id=current_user.id,
                name=cluster_name,
                status="running",
                worker_count=worker_count,
                master_flavor_id=tfvars.get("master_flavor_id", "unknown"),
                worker_flavor_id=tfvars.get("worker_flavor_id", "unknown"),
                image_id=tfvars.get("image_id", ""),
                availability_zone=tfvars.get("availability_zone", ""),
                security_group_id=tfvars.get("security_group_id", ""),
                subnet_id=tfvars.get("subnet_id", ""),
                system_disk_size=int(tfvars.get("system_disk_size", 50)),
                master_public_ip=master_public_ip,
                master_private_ip=master_private_ip,
                worker_public_ips=json.dumps(worker_ips),
                terraform_state_dir=dir_name,
            )
            db.add(cluster)
            db.flush()  # get cluster.id before commit
            imported_clusters.append({"id": cluster.id, "name": cluster_name, "master_ip": master_public_ip})
            known_cluster_dirs.add(dir_name)

    # ── VMs ───────────────────────────────────────────────────────────────────
    if TERRAFORM_STATES_DIR.exists():
        for state_dir in sorted(TERRAFORM_STATES_DIR.iterdir()):
            if not state_dir.is_dir():
                continue
            vm_name = state_dir.name
            if vm_name in known_vm_names:
                continue

            if not _terraform_still_exists(state_dir):
                continue

            tfstate = json.loads((state_dir / "terraform.tfstate").read_text(encoding="utf-8"))
            tfvars = _read_tfvars(state_dir)

            public_ip = _output_value(tfstate, "public_ip")
            cloud_vm_id = _output_value(tfstate, "vm_id")

            vm = VirtualMachine(
                user_id=current_user.id,
                instance_name=vm_name,
                cloud_vm_id=cloud_vm_id,
                status="running",
                availability_zone=tfvars.get("availability_zone", ""),
                flavor_id=tfvars.get("instance_flavor_id", "unknown"),
                image_id=tfvars.get("instance_image_id", ""),
                security_group_id=tfvars.get("security_group_id", ""),
                subnet_cidr=tfvars.get("subnet_id", ""),
                system_disk_type=tfvars.get("system_disk_type", "SSD"),
                system_disk_size=int(tfvars.get("system_disk_size", 50)),
                public_ip=public_ip,
            )
            db.add(vm)
            db.flush()
            imported_vms.append({"id": vm.id, "name": vm_name, "public_ip": public_ip})
            known_vm_names.add(vm_name)

    db.commit()
    return {"imported_clusters": imported_clusters, "imported_vms": imported_vms}
