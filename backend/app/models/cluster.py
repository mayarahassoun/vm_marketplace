from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    # creating | running | error | deleting
    status = Column(String(100), nullable=False, default="creating")

    worker_count = Column(Integer, nullable=False, default=2)

    master_flavor_id = Column(String(255), nullable=False)
    worker_flavor_id = Column(String(255), nullable=False)
    image_id = Column(String(255), nullable=False)
    availability_zone = Column(String(100), nullable=False)
    security_group_id = Column(String(255), nullable=False)
    subnet_id = Column(String(255), nullable=False)
    system_disk_size = Column(Integer, nullable=False, default=50)

    master_public_ip = Column(String(100), nullable=True)
    master_private_ip = Column(String(100), nullable=True)
    # JSON-encoded list of public IPs for worker nodes
    worker_public_ips = Column(Text, nullable=True)

    # Full kubeconfig YAML to give to the user
    kubeconfig = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    owner = relationship("User", backref="clusters")
