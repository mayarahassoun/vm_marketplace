import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 🔹 URL de la base de données
# Par défaut SQLite pour démarrer rapidement
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vm_marketplace.db")

# 🔹 Configuration spécifique SQLite (obligatoire)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# 🔹 Création du moteur SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

# 🔹 Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 🔹 Base pour les modèles (ORM)
Base = declarative_base()


# 🔹 Dependency FastAPI (IMPORTANT)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()