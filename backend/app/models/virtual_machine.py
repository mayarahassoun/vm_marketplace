from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class VirtualMachine(Base):
    __tablename__ = "virtual_machines"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    instance_name = Column(String(255), nullable=False)
    cloud_vm_id = Column(String(255), nullable=True, index=True)
    status = Column(String(100), nullable=False, default="creating")

    availability_zone = Column(String(100), nullable=False)
    flavor_id = Column(String(255), nullable=False)
    image_id = Column(String(255), nullable=False)
    security_group_id = Column(String(255), nullable=False)
    subnet_cidr = Column(String(100), nullable=False)

    system_disk_type = Column(String(100), nullable=False)
    system_disk_size = Column(Integer, nullable=False)

    private_ip = Column(String(100), nullable=True)
    public_ip = Column(String(100), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    netdata_url = Column(String(255), nullable=True)

    owner = relationship("User", backref="virtual_machines")