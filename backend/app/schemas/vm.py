from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VMCreateRequest(BaseModel):
    instance_name: str = Field(..., min_length=2)
    availability_zone: str
    instance_flavor_id: str
    instance_image_id: str
    security_group_id: str
    target_subnet_cidr: str
    administrator_password: str = Field(..., min_length=8)
    system_disk_type: str
    system_disk_size: int = Field(..., ge=1)


class VMResponse(BaseModel):
    id: int
    instance_name: str
    cloud_vm_id: Optional[str] = None
    status: str
    availability_zone: str
    flavor_id: str
    image_id: str
    security_group_id: str
    subnet_cidr: str
    system_disk_type: str
    system_disk_size: int
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True