import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

TERRAFORM_SOURCE_DIR = Path(
    os.getenv("TERRAFORM_DIR", str(Path(__file__).resolve().parents[3] / "terraform_test"))
)


def run_terraform(vm_data: dict) -> dict:
    if not TERRAFORM_SOURCE_DIR.exists():
        raise FileNotFoundError(f"Terraform directory not found: {TERRAFORM_SOURCE_DIR}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        working_dir = tmp_path / "terraform_run"

        shutil.copytree(TERRAFORM_SOURCE_DIR, working_dir)

        tf_files = list(working_dir.glob("*.tf"))
        if not tf_files:
            raise FileNotFoundError(f"No Terraform .tf files found in working directory: {working_dir}")

        tfvars_path = working_dir / "terraform.auto.tfvars.json"

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
            raise ValueError(f"Missing required Terraform variables: {missing}")

        tfvars_path.write_text(json.dumps(terraform_vars, indent=2), encoding="utf-8")

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

        return {
            "message": "VM created successfully",
            "cloud_vm_id": cloud_vm_id,
            "terraform_outputs": outputs,
        }