import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.1"  # ← upgrade de phi3

ALLOWED_VALUES = {
    "application_type": [
        "web", "ecommerce", "database", "ai",
        "test", "university_app", "research", "devops",
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
    match = re.search(r"\{[\s\S]*?\}", text)
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
        r"(\d{1,3}(?:[\s.,]?\d{3})+|\d+)\s*(utilisateurs|users|étudiants|etudiants|students|clients|visitors)",
        r"utilisée par\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"used by\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"pour\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"for\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"(\d{1,3}(?:[\s.,]?\d{3})+|\d+)\s*concurrent",
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
    return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a cloud infrastructure requirement extraction engine.
Extract structured VM requirements from user requests.
Return ONLY a valid JSON object. No explanation. No markdown. No extra text.

Rules:
- application_type: web | ecommerce | database | ai | test | university_app | research | devops
- traffic_level: low | medium | high
- budget: low | medium | high  
- performance_level: economic | balanced | performance
- expected_users: integer number
- storage_need: integer in GB

Semantic mapping:
- shop/boutique/store/magasin → ecommerce
- university/students/étudiants/campus → university_app
- AI/ML/deep learning/neural/model training → ai
- database/MySQL/PostgreSQL/MongoDB → database
- CI/CD/DevOps/pipeline/Jenkins → devops
- high performance/rapide/fast/critical → performance_level=performance
- cheap/budget/économique/low cost → budget=low
- no budget mentioned → budget=medium

<|eot_id|><|start_header_id|>user<|end_header_id|>
{user_text}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
{{"""


def call_ollama(prompt: str) -> str:
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.05,
                    "top_p": 0.9,
                    "stop": ["}"],
                },
            },
            timeout=60,
        )
        response.raise_for_status()
        raw = response.json().get("response", "")
        return "{" + raw + "}"
    except Exception as e:
        print(f"⚠️ Ollama error: {e}")
        return "{}"


def parse_user_need(user_text: str) -> dict:
    prompt = build_prompt(user_text)
    llm_text = call_ollama(prompt)

    print(f"\n===== RAW LLM RESPONSE =====\n{llm_text}\n=====\n")

    raw_data = extract_json(llm_text)
    validated = validate_result(raw_data)

    detected_users = detect_users_from_original_text(user_text)
    if detected_users is not None:
        validated["expected_users"] = detected_users

    return validated