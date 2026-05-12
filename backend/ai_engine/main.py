from fastapi import APIRouter
from ai_engine.ollama_client import ask_ollama
from ai_engine.parser import parse_ai_output
from ai_engine.mapper import map_to_flavor

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])


@router.post("/recommend")
def recommend_vm(payload: dict):

    user_request = payload["user_request"]

    raw = ask_ollama(user_request)
    ai = parse_ai_output(raw)
    vm = map_to_flavor(ai)

    return {
        "ai_analysis": ai,
        "recommendation": vm
    }