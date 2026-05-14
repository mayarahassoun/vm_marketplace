import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .llm_parser import parse_user_need
from .ai_reasoner import reason_about_request
from .predict_vm import MODEL_PATH, recommend_vm, VM_PROFILES

BASE_DIR = Path(__file__).resolve().parent


# ── Auto-train model on startup if missing ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(MODEL_PATH):
        print("⚙️  Model not found — running train_model.py...")
        import subprocess
        result = subprocess.run(
            ["python", str(BASE_DIR / "train_model.py")],
            capture_output=True,
            text=True,
            cwd=BASE_DIR,
        )
        if result.returncode == 0:
            print("✅ Model trained successfully.")
        else:
            print(f"❌ Training failed:\n{result.stderr}")
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI VM Recommendation Engine",
    description="Hybrid AI engine for smart cloud VM recommendation",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGE_MAP = {
    "Linux":   "7f22f4d8-4863-45d6-befe-d19ba7e7563a",  # Ubuntu-Server-24
    "Debian":  "7be47085-2e35-40b9-855f-c6a1fb602cc9",  # Debian-10
    "Windows": "b686df0b-5551-4bbc-87e6-041a963f578b",  # Windows10-Pro
}

SECURITY_GROUP_ID   = "3953708c-a708-435d-ab3c-6ef2c0ae0388"
SUBNET_ID           = "490c9b38-c948-45da-abe3-c9e11466ddfc"
AVAILABILITY_ZONE   = "tn-global-1a"


class TextRecommendationRequest(BaseModel):
    user_request: str


APP_TYPE_LABELS = {
    "test": "application de test",
    "web": "application web",
    "university_app": "application universitaire",
    "ecommerce": "plateforme e-commerce",
    "database": "base de donnees",
    "ai": "application d'intelligence artificielle",
    "research": "environnement de recherche",
    "devops": "environnement DevOps",
}

TRAFFIC_LABELS = {
    "low": "faible",
    "medium": "moyen",
    "high": "eleve",
}

PERFORMANCE_LABELS = {
    "basic": "basique",
    "balanced": "equilibre",
    "performance": "eleve",
}


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "AI VM Recommendation Engine",
        "status":  "running",
        "version": "2.1.0",
    }


@app.get("/health")
def health():
    model_ready = os.path.exists("models/vm_recommender.pkl")
    return {
        "status":      "ok",
        "component":   "ai_engine",
        "model_ready": model_ready,
    }


@app.get("/profiles")
def list_profiles():
    return {"profiles": VM_PROFILES}


@app.post("/recommend-vm-from-text")
def recommend_from_text(request: TextRecommendationRequest):
    # 1. Parse via LLM (ou fallback)
    extracted = parse_user_need(request.user_request)
    llm_used  = extracted.pop("_llm_used", True)

    # 2. Raisonnement symbolique
    reasoned = reason_about_request(extracted)

    # 3. Prédiction ML
    # FIX: FileNotFoundError → HTTP 503 clair plutôt qu'une 500 générique
    try:
        recommendation = recommend_vm(
            application_type=reasoned["application_type"],
            expected_users=reasoned["expected_users"],
            traffic_level=reasoned["traffic_level"],
            budget=reasoned["budget"],
            performance_level=reasoned["performance_level"],
            storage_need=reasoned["storage_need"],
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )

    # FIX: en cas d'hésitation du modèle (confidence < 60%) sur database/ai avec budget high
    # → on prend le profil supérieur pour éviter le sous-dimensionnement
    top_profile   = recommendation["recommended_profile"]
    top_conf      = max(recommendation["confidence_scores"].values())
    app_type      = reasoned["application_type"]
    budget        = reasoned["budget"]

    UPGRADE_MAP = {
        "mem_m": "mem_l", "mem_l": "mem_xl",
        "gp_l":  "gp_l2", "gp_l2": "gp_xl",
        "gp_xl": "gp_xl2",
    }
    UPGRADE_APPS = ["database", "ai", "research"]

    if top_conf < 0.60 and app_type in UPGRADE_APPS and budget == "high":
        upgraded = UPGRADE_MAP.get(top_profile)
        if upgraded and upgraded in VM_PROFILES:
            recommendation["recommended_profile"] = upgraded
            recommendation["configuration"]       = VM_PROFILES[upgraded]
            recommendation["_upgraded"]           = True
            recommendation["_upgrade_reason"]     = (
                f"Low confidence ({top_conf:.0%}) on critical workload → upgraded from {top_profile} to {upgraded}"
            )

    vm_config = recommendation["configuration"]

    ready_to_deploy = {
        "instance_flavor_id":      vm_config["flavor_id"],
        "system_disk_size":        max(int(vm_config["storage"]), int(reasoned["storage_need"])),
        "system_disk_type":        vm_config["storage_type"],
        "instance_image_id":       IMAGE_MAP["Linux"],   # Linux par défaut
        "availability_zone":       AVAILABILITY_ZONE,
        "security_group_id":       SECURITY_GROUP_ID,
        "subnet_id":               SUBNET_ID,
        "estimated_monthly_cost":  vm_config["monthly_price"],
        "category":                vm_config["category"],
    }

    workload_score = recommendation["ai_scores"]["workload_score"]
    resource_score = recommendation["ai_scores"]["resource_score"]
    criticality_score = recommendation["ai_scores"]["criticality_score"]
    app_label = APP_TYPE_LABELS.get(app_type, app_type)
    traffic_label = TRAFFIC_LABELS.get(reasoned["traffic_level"], reasoned["traffic_level"])
    performance_label = PERFORMANCE_LABELS.get(
        reasoned["performance_level"],
        reasoned["performance_level"],
    )
    highest_score = max(workload_score, resource_score, criticality_score)
    if highest_score >= 8:
        score_note = (
            "Ces scores indiquent un besoin eleve, ce qui justifie une VM plus puissante "
            "pour eviter le sous-dimensionnement."
        )
    elif highest_score >= 5:
        score_note = (
            "Ces scores indiquent un besoin intermediaire, ce qui justifie une VM equilibree "
            "entre performance et cout."
        )
    else:
        score_note = (
            "Ces scores indiquent un besoin modere, ce qui evite de choisir une VM trop grande."
        )

    decision_summary = {
        "why_this_flavor": (
            f"La configuration {vm_config['flavor_id']} a ete selectionnee car la demande "
            f"correspond a une {app_label} avec environ {reasoned['expected_users']} "
            f"utilisateurs, un trafic {traffic_label}, un besoin de performance "
            f"{performance_label} et {reasoned['storage_need']} GB de stockage."
        ),
        "score_interpretation": (
            f"Le moteur estime la charge a {workload_score}/10, le besoin en ressources "
            f"a {resource_score}/10 et la criticite a {criticality_score}/10. "
            f"{score_note}"
        ),
        "deployment_note": (
            "Cette recommandation represente le profil techniquement adapte. "
            "Le deploiement reel peut toutefois dependre du quota disponible sur le cloud."
        ),
    }

    return {
        "original_request":    request.user_request,
        # FIX: flag llm_used exposé au frontend pour afficher un avertissement
        "llm_used":            llm_used,
        "extracted_parameters": extracted,
        "reasoned_parameters": reasoned,
        "recommendation":      recommendation,
        "decision_summary":    decision_summary,
        "ready_to_deploy":     ready_to_deploy,
    }
