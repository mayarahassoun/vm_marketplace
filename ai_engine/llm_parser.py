import json
import re
import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi3"


ALLOWED_VALUES = {
    "application_type": [
        "web",
        "ecommerce",
        "database",
        "ai",
        "test",
        "university_app",
        "research",
        "devops",
    ],
    "traffic_level": ["low", "medium", "high"],
    "budget": ["low", "medium", "high"],
    "performance_level": ["economic", "balanced", "performance"],
}


DEFAULT_VALUES = {
    "application_type": "web",
    "expected_users": 100,
    "traffic_level": "medium",
    "budget": "medium",
    "performance_level": "balanced",
    "storage_need": 60,
}


def extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return DEFAULT_VALUES.copy()

    raw_json = match.group(0)

    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        cleaned = raw_json.replace("'", '"')
        cleaned = re.sub(r",\s*}", "}", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return DEFAULT_VALUES.copy()


def detect_users_from_original_text(user_text: str):
    text = user_text.lower()

    patterns = [
        r"(\d{1,3}(?:[\s.,]?\d{3})+|\d+)\s*(utilisateurs|users|étudiants|etudiants)",
        r"utilisée par\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"utilisee par\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"pour\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            raw = match.group(1)
            clean = raw.replace(" ", "").replace(".", "").replace(",", "")
            try:
                return int(clean)
            except ValueError:
                return None

    return None


def validate_result(data: dict) -> dict:
    result = DEFAULT_VALUES.copy()

    for key in result:
        if key in data and data[key] is not None:
            result[key] = data[key]

    if result["application_type"] not in ALLOWED_VALUES["application_type"]:
        result["application_type"] = DEFAULT_VALUES["application_type"]

    if result["traffic_level"] not in ALLOWED_VALUES["traffic_level"]:
        result["traffic_level"] = DEFAULT_VALUES["traffic_level"]

    if result["budget"] not in ALLOWED_VALUES["budget"]:
        result["budget"] = DEFAULT_VALUES["budget"]

    if result["performance_level"] not in ALLOWED_VALUES["performance_level"]:
        result["performance_level"] = DEFAULT_VALUES["performance_level"]

    try:
        result["expected_users"] = int(result["expected_users"])
    except (TypeError, ValueError):
        result["expected_users"] = DEFAULT_VALUES["expected_users"]

    try:
        result["storage_need"] = int(result["storage_need"])
    except (TypeError, ValueError):
        result["storage_need"] = DEFAULT_VALUES["storage_need"]

    return result


def build_prompt(user_text: str) -> str:
    return f"""
You are an AI requirement extraction engine for a smart cloud VM marketplace.

Your task is to extract structured cloud workload requirements from the user's natural language request.

Return ONLY a valid JSON object. No explanation. No markdown.

Allowed values:
application_type: web, ecommerce, database, ai, test, university_app, research, devops
traffic_level: low, medium, high
budget: low, medium, high
performance_level: economic, balanced, performance

Important semantic rules:
- "e-shop", "online shop", "boutique en ligne" mean ecommerce.
- "university", "students", "étudiants", "plateforme universitaire" mean university_app.
- "AI", "machine learning", "deep learning", "model training" mean ai.
- "database", "base de données" mean database.
- "CI/CD", "DevOps", "pipeline" mean devops.
- If the user mentions high performance, performance élevée, rapidité, forte charge, set performance_level to performance.
- If the user mentions low cost, petit budget, économique, set budget to low.
- If the user gives no budget, use medium.
- Estimate storage_need in GB.
- If unsure, use reasonable values but keep the JSON valid.

Expected JSON schema:
{{
  "application_type": "web",
  "expected_users": 100,
  "traffic_level": "medium",
  "budget": "medium",
  "performance_level": "balanced",
  "storage_need": 60
}}

User request:
{user_text}
"""


def call_ollama(prompt: str) -> str:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
            },
        },
        timeout=60,
    )

    response.raise_for_status()
    return response.json().get("response", "")


def parse_user_need(user_text: str) -> dict:
    prompt = build_prompt(user_text)
    llm_text = call_ollama(prompt)

    print("\n===== RAW LLM RESPONSE =====")
    print(llm_text)
    print("===== END RAW LLM RESPONSE =====\n")

    raw_data = extract_json(llm_text)
    validated = validate_result(raw_data)

    detected_users = detect_users_from_original_text(user_text)
    if detected_users is not None:
        validated["expected_users"] = detected_users

    return validated


if __name__ == "__main__":
    text = "Je veux une VM pour une application universitaire utilisée par 30000 étudiants."

    result = parse_user_need(text)

    print("\n===== FINAL PARSED RESULT =====")
    print(json.dumps(result, indent=2, ensure_ascii=False))