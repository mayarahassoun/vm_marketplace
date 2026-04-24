import json
import os
import shutil
import subprocess
from pathlib import Path

TERRAFORM_SOURCE_DIR = Path(
    os.getenv("TERRAFORM_DIR", str(Path(__file__).resolve().parents[3] / "terraform_test"))
)

TERRAFORM_STATES_DIR = Path(
    os.getenv("TERRAFORM_STATES_DIR", str(Path(__file__).resolve().parents[3] / "terraform_states"))
)


def run_terraform(vm_data: dict) -> dict:
    if not TERRAFORM_SOURCE_DIR.exists():
        raise FileNotFoundError(f"Terraform directory not found: {TERRAFORM_SOURCE_DIR}")

    # Dossier unique par VM basé sur le nom
    vm_name = vm_data["instance_name"]
    working_dir = TERRAFORM_STATES_DIR / vm_name
    working_dir.mkdir(parents=True, exist_ok=True)

    # Copie uniquement les fichiers .tf
    for tf_file in TERRAFORM_SOURCE_DIR.glob("*.tf"):
        shutil.copy2(tf_file, working_dir / tf_file.name)

    tf_files = list(working_dir.glob("*.tf"))
    if not tf_files:
        raise FileNotFoundError(f"No .tf files found in: {working_dir}")

    terraform_vars = {
        "access_key": os.getenv("HCS_ACCESS_KEY"),
        "secret_key": os.getenv("HCS_SECRET_KEY"),
        "instance_name": vm_data["instance_name"],
        "availability_zone": vm_data["availability_zone"],
        "instance_flavor_id": vm_data["instance_flavor_id"],
        "instance_image_id": vm_data["instance_image_id"],
        "security_group_id": vm_data["security_group_id"],
        "administrator_password": vm_data["administrator_password"],
        "subnet_id": vm_data["subnet_id"],
        "system_disk_type": vm_data["system_disk_type"],
        "system_disk_size": vm_data["system_disk_size"],
    }

    missing = [k for k, v in terraform_vars.items() if v in (None, "", [])]
    if missing:
        raise ValueError(f"Missing Terraform variables: {missing}")

    (working_dir / "terraform.auto.tfvars.json").write_text(
        json.dumps(terraform_vars, indent=2), encoding="utf-8"
    )

    commands = [
        ["terraform", "init"],
        ["terraform", "apply", "-auto-approve"],
        ["terraform", "output", "-json"],
    ]

    last_output = ""
    for cmd in commands:
        result = subprocess.run(
            cmd,
            cwd=working_dir,
            capture_output=True,
            text=True,
            shell=False,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"Command failed: {' '.join(cmd)}\n"
                f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"
            )
        last_output = result.stdout

    outputs = json.loads(last_output) if last_output.strip() else {}

    cloud_vm_id = None
    if "vm_id" in outputs and isinstance(outputs["vm_id"], dict):
        cloud_vm_id = outputs["vm_id"].get("value")

    public_ip = None
    if "public_ip" in outputs and isinstance(outputs["public_ip"], dict):
        public_ip = outputs["public_ip"].get("value")

    return {
        "message": "VM created successfully",
        "cloud_vm_id": cloud_vm_id,
        "public_ip": public_ip,
        "terraform_outputs": outputs,
    }


def destroy_terraform(vm_name: str) -> None:
    working_dir = TERRAFORM_STATES_DIR / vm_name

    if not working_dir.exists():
        raise FileNotFoundError(f"Terraform state not found for VM: {vm_name}")

    result = subprocess.run(
        ["terraform", "destroy", "-auto-approve"],
        cwd=working_dir,
        capture_output=True,
        text=True,
        shell=False,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"Terraform destroy failed:\n{result.stdout}\n{result.stderr}"
        )

    # Supprime le dossier après destroy
    shutil.rmtree(working_dir, ignore_errors=True)