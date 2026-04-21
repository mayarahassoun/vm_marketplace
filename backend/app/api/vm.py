from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.vm import VMCreateRequest, VMResponse
from app.services.terraform_service import run_terraform
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
        )

        db.add(vm)
        db.commit()
        db.refresh(vm)

        return vm

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[VMResponse])
def list_vms(db: Session = Depends(get_db)):
    vms = db.query(VirtualMachine).order_by(VirtualMachine.created_at.desc()).all()
    return vms