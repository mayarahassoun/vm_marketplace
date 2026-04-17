from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from app.api.vm import router as vm_router
from app.db.session import Base, engine
from app.models.virtual_machine import VirtualMachine
from fastapi import FastAPI
from dotenv import load_dotenv
from app.api.vm import router as vm_router


load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(vm_router)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Ajouter CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ton frontend
    allow_credentials=True,
    allow_methods=["*"],  # autorise POST, GET, OPTIONS…
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "VM Marketplace API is running"}


app.include_router(vm_router)