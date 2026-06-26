from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api import auth
from app.api.vm import router as vm_router
from app.db.session import Base, engine
from app.models import user, virtual_machine
from app.api.ssh import router as ssh_router
from app.api.payment import router as payment_router
from app.api.monitoring import router as monitoring_router
from app.api.cluster import router as cluster_router
from app.api.sync import router as sync_router
from app.models import cluster  # noqa: F401 – ensures Cluster table is created


Base.metadata.create_all(bind=engine)

# Add terraform_state_dir column if it was missing from an older DB schema
with engine.connect() as _conn:
    try:
        _conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE clusters ADD COLUMN terraform_state_dir VARCHAR(255)"
            )
        )
        _conn.commit()
    except Exception:
        pass  # Column already exists — safe to ignore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(vm_router)
app.include_router(ssh_router)
app.include_router(payment_router)
app.include_router(monitoring_router)
app.include_router(cluster_router)
app.include_router(sync_router)


@app.get("/")
def root():
    return {"message": "VM Marketplace API is running"}


@app.post("/api/ai/recommend")
async def ai_recommend(request: dict):
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                "http://localhost:8001/recommend-vm-from-text",
                json=request,
            )
        if res.status_code >= 400:
            raise HTTPException(
                status_code=503,
                detail=f"AI engine error: {res.text[:500]}",
            )
        try:
            return res.json()
        except ValueError:
            raise HTTPException(
                status_code=503,
                detail=f"AI engine returned non-JSON response: {res.text[:500]}",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI engine unavailable: {str(e)}"
        )


@app.get("/api/ai/health")
async def ai_health():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get("http://localhost:8001/health")
        if res.status_code >= 400:
            return {"status": "unavailable", "detail": res.text[:500]}
        try:
            return res.json()
        except ValueError:
            return {"status": "unavailable", "detail": "AI engine returned non-JSON response"}
    except Exception:
        return {"status": "unavailable"}
