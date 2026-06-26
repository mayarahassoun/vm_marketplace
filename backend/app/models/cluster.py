from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
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

    # PEM-encoded RSA private key used to SSH into the cluster nodes
    ssh_private_key = Column(Text, nullable=True)

    # Name of the terraform_cluster_states/<dir> used for this cluster.
    # Always unique — decoupled from the user-visible `name` field so two
    # clusters with the same name don't share a state directory.
    terraform_state_dir = Column(String(255), nullable=True)

    # ── Self-healing integration ─────────────────────────────────────────────
    enable_self_healing = Column(Boolean, nullable=False, default=False)
    # pending | registered | error
    self_healing_status = Column(String(50), nullable=True)
    self_healing_error = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    owner = relationship("User", backref="clusters")
