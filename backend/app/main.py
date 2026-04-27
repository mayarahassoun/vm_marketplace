from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.api.vm import router as vm_router
from app.db.session import Base, engine
from app.models import user, virtual_machine  # ensure models are registered
from app.api.ssh import router as ssh_router
from app.api.payment import router as payment_router
from app.api.monitoring import router as monitoring_router


# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(vm_router)

@app.get("/")
def root():
    return {"message": "VM Marketplace API is running"}


# Avec les autres routers
app.include_router(ssh_router)
app.include_router(payment_router)
app.include_router(monitoring_router)