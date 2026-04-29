from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm_parser import parse_user_need
from ai_reasoner import reason_about_request
from predict_vm import recommend_vm


app = FastAPI(
    title="AI VM Recommendation Engine",
    description="Hybrid AI engine for smart cloud VM recommendation",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRecommendationRequest(BaseModel):
    user_request: str


@app.get("/")
def root():
    return {
        "service": "AI VM Recommendation Engine",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "component": "ai_engine",
    }


@app.post("/recommend-vm-from-text")
def recommend_from_text(request: TextRecommendationRequest):
    extracted_parameters = parse_user_need(request.user_request)

    reasoned_parameters = reason_about_request(extracted_parameters)

    recommendation = recommend_vm(
        application_type=reasoned_parameters["application_type"],
        expected_users=reasoned_parameters["expected_users"],
        traffic_level=reasoned_parameters["traffic_level"],
        budget=reasoned_parameters["budget"],
        performance_level=reasoned_parameters["performance_level"],
        storage_need=reasoned_parameters["storage_need"],
    )

    return {
        "original_request": request.user_request,
        "extracted_parameters": extracted_parameters,
        "reasoned_parameters": reasoned_parameters,
        "recommendation": recommendation,
    }