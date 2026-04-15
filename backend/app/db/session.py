from app.core.config import SessionLocal

# fonction utilitaire pour dependency FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()