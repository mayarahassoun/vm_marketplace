import json
import re
import requests

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.1"

ALLOWED_VALUES = {
    "application_type": [
        "web", "ecommerce", "database", "ai",
        "test", "university_app", "research", "devops",
    ],
    "traffic_level":    ["low", "medium", "high"],
    "budget":           ["low", "medium", "high"],
    "performance_level": ["economic", "balanced", "performance"],
}

DEFAULT_VALUES = {
    "application_type": "web",
    "expected_users":   100,
    "traffic_level":    "medium",
    "budget":           "medium",
    "performance_level": "balanced",
    "storage_need":     60,
}


def extract_json(text: str) -> dict:
    """
    FIX: Extraire le premier objet JSON complet (avec accolades équilibrées)
    au lieu de s'arrêter au premier `}` via le stop token.
    """
    start = text.find("{")
    if start == -1:
        return DEFAULT_VALUES.copy()

    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                raw_json = text[start:i + 1]
                try:
                    return json.loads(raw_json)
                except json.JSONDecodeError:
                    # Tentative de nettoyage
                    cleaned = raw_json.replace("'", '"')
                    cleaned = re.sub(r",\s*}", "}", cleaned)
                    try:
                        return json.loads(cleaned)
                    except json.JSONDecodeError:
                        return DEFAULT_VALUES.copy()

    return DEFAULT_VALUES.copy()


def detect_users_from_original_text(user_text: str) -> int | None:
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
        result["storage_need"] = 0

    # FIX: plafonner le storage LLM — le LLM hallucine souvent des valeurs absurdes
    # Le reasoner calculera la vraie valeur depuis le type d'app + users
    MAX_STORAGE_PER_TYPE = {
        "test": 100, "web": 400, "university_app": 300,
        "ecommerce": 400, "database": 600, "ai": 500,
        "research": 500, "devops": 300,
    }
    app_type = result.get("application_type", "web")
    max_storage = MAX_STORAGE_PER_TYPE.get(app_type, 400)

    if result["storage_need"] > max_storage:
        # Valeur hallucinée → on laisse le reasoner décider
        result["storage_need"] = 0

    if result["storage_need"] <= 0:
        result["storage_need"] = 0  # reasoner corrigera

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
"""


def call_ollama(prompt: str) -> tuple[str, bool]:
    """
    FIX: Retourne (texte, llm_used).
    - Stop tokens corrigés: plus de `}}` qui coupe le JSON prématurément.
    - Timeout augmenté, erreurs loggées clairement.
    """
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
                    # FIX: stop tokens qui ne cassent plus le JSON
                    "stop": ["<|eot_id|>", "<|start_header_id|>"],
                },
            },
            timeout=60,
        )
        response.raise_for_status()
        raw = response.json().get("response", "").strip()
        return raw, True
    except requests.exceptions.ConnectionError:
        print("⚠️  Ollama not running at", OLLAMA_URL, "— using default values")
        return "{}", False
    except requests.exceptions.Timeout:
        print("⚠️  Ollama timeout — using default values")
        return "{}", False
    except Exception as e:
        print(f"⚠️  Ollama error: {e}")
        return "{}", False


def parse_user_need(user_text: str) -> dict:
    prompt   = build_prompt(user_text)
    llm_text, llm_used = call_ollama(prompt)

    print(f"\n===== RAW LLM RESPONSE =====\n{llm_text}\n=====\n")

    raw_data  = extract_json(llm_text)
    validated = validate_result(raw_data)

    # Regex override: toujours prioritaire sur le LLM pour les chiffres
    detected_users = detect_users_from_original_text(user_text)
    if detected_users is not None:
        validated["expected_users"] = detected_users

    # FIX: flag pour informer l'API si le LLM était disponible
    validated["_llm_used"] = llm_used

    return validated
