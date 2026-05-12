import requests
from ai_engine.config import OLLAMA_URL, OLLAMA_MODEL
from ai_engine.prompts import SYSTEM_PROMPT

def ask_ollama(user_request: str):
    payload = {
    "model": OLLAMA_MODEL,
    "prompt": SYSTEM_PROMPT + "\nUser request:\n" + user_request,
    "stream": False
}

    res = requests.post(OLLAMA_URL, json=payload)

    data = res.json()

    # 🔥 DEBUG important
    print("OLLAMA RESPONSE:", data)

    # ✅ cas normal
    if "response" in data:
        return data["response"]

    # ✅ cas chat format
    if "message" in data:
        return data["message"]["content"]

    # ❌ erreur propre
    raise Exception(f"Ollama error: {data}")