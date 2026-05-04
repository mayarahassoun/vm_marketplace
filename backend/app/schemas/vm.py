from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re


class VMCreateRequest(BaseModel):
    instance_name: str = Field(..., min_length=2, max_length=50)
    availability_zone: str
    instance_flavor_id: str
    instance_image_id: str
    security_group_id: str
    subnet_id: str
    administrator_password: str = Field(..., min_length=8)
    system_disk_type: str
    system_disk_size: int = Field(..., ge=40)  # minimum 40 GB

    @field_validator("instance_name")
    @classmethod
    def validate_instance_name(cls, v):
        if " " in v:
            raise ValueError("VM name cannot contain spaces. Use hyphens instead (e.g. my-vm)")
        if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
            raise ValueError("VM name can only contain letters, numbers, hyphens and underscores")
        return v


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
    netdata_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True