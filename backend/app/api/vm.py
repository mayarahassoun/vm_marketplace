import threading
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.vm import VMCreateRequest, VMResponse
from app.services.terraform_service import run_terraform, destroy_terraform, install_netdata
from app.db.session import get_db
from app.models.virtual_machine import VirtualMachine

router = APIRouter(prefix="/api/vms", tags=["VMs"])


@router.post("/create", response_model=VMResponse)
def create_vm(payload: VMCreateRequest, db: Session = Depends(get_db)):
    try:
        result = run_terraform(payload.model_dump())

        vm = VirtualMachine(
            instance_name=payload.instance_name,
            cloud_vm_id=result.get("cloud_vm_id"),
            status="running",
            availability_zone=payload.availability_zone,
            flavor_id=payload.instance_flavor_id,
            image_id=payload.instance_image_id,
            security_group_id=payload.security_group_id,
            subnet_cidr=payload.subnet_id,
            system_disk_type=payload.system_disk_type,
            system_disk_size=payload.system_disk_size,
            public_ip=result.get("public_ip"),
            netdata_url=None,  # sera mis à jour après install Netdata
        )

        db.add(vm)
        db.commit()
        db.refresh(vm)

        # Lance Netdata install en background avec vm.id
        if result.get("public_ip"):
            threading.Thread(
                target=install_netdata,
                args=(result["public_ip"], payload.administrator_password, vm.id),
                daemon=True
            ).start()
            print(f"🚀 Netdata installation started for VM {vm.id}")

        return vm

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[VMResponse])
def list_vms(db: Session = Depends(get_db)):
    vms = db.query(VirtualMachine).order_by(VirtualMachine.created_at.desc()).all()
    return vms


@router.delete("/{vm_id}")
def delete_vm(vm_id: int, db: Session = Depends(get_db)):
    vm = db.query(VirtualMachine).filter(VirtualMachine.id == vm_id).first()
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")

    try:
        destroy_terraform(vm.instance_name)
    except FileNotFoundError:
        print(f"⚠️ No terraform state for {vm.instance_name} — skipping destroy")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terraform destroy failed: {str(e)}")

    db.delete(vm)
    db.commit()
    return {"message": "VM deleted successfully"}


@router.patch("/{vm_id}/netdata")
def update_netdata_url(vm_id: int, db: Session = Depends(get_db)):
    vm = db.query(VirtualMachine).filter(VirtualMachine.id == vm_id).first()
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")
    if vm.public_ip:
        vm.netdata_url = f"http://{vm.public_ip}:19999"
        db.commit()
        db.refresh(vm)
    return vm