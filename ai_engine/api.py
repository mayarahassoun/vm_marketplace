from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm_parser import parse_user_need
from ai_reasoner import reason_about_request
from predict_vm import recommend_vm, VM_PROFILES

app = FastAPI(
    title="AI VM Recommendation Engine",
    description="Hybrid AI engine for smart cloud VM recommendation",
    version="2.0.0",
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

SECURITY_GROUP_ID = "3953708c-a708-435d-ab3c-6ef2c0ae0388"
SUBNET_ID = "490c9b38-c948-45da-abe3-c9e11466ddfc"
AVAILABILITY_ZONE = "tn-global-1a"


class TextRecommendationRequest(BaseModel):
    user_request: str


@app.get("/")
def root():
    return {"service": "AI VM Recommendation Engine", "status": "running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "component": "ai_engine"}


@app.get("/profiles")
def list_profiles():
    return {"profiles": VM_PROFILES}


@app.post("/recommend-vm-from-text")
def recommend_from_text(request: TextRecommendationRequest):
    extracted = parse_user_need(request.user_request)
    reasoned = reason_about_request(extracted)
    recommendation = recommend_vm(
        application_type=reasoned["application_type"],
        expected_users=reasoned["expected_users"],
        traffic_level=reasoned["traffic_level"],
        budget=reasoned["budget"],
        performance_level=reasoned["performance_level"],
        storage_need=reasoned["storage_need"],
    )

    vm_config = recommendation["configuration"]

    # Choisit OS selon type d'app
    app_type = reasoned["application_type"]
    image_id = IMAGE_MAP["Linux"]  # défaut Linux pour tout

    ready_to_deploy = {
        "instance_flavor_id": vm_config["flavor_id"],
        "system_disk_size": max(int(vm_config["storage"]), int(reasoned["storage_need"])),
        "system_disk_type": vm_config["storage_type"],
        "instance_image_id": image_id,
        "availability_zone": AVAILABILITY_ZONE,
        "security_group_id": SECURITY_GROUP_ID,
        "subnet_id": SUBNET_ID,
        "estimated_monthly_cost": vm_config["monthly_price"],
        "category": vm_config["category"],
    }

    return {
        "original_request": request.user_request,
        "extracted_parameters": extracted,
        "reasoned_parameters": reasoned,
        "recommendation": recommendation,
        "ready_to_deploy": ready_to_deploy,
    }