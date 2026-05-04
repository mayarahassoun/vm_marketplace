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
        r"(\d{1,3}(?:[\s.,]?\d{3})+|\d+)\s*(utilisateurs|users|étudiants|etudiants|clients|visiteurs)",
        r"utilisée par\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"utilisee par\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"recevoir\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"supporter\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"pour\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
        r"avec\s+(\d{1,3}(?:[\s.,]?\d{3})+|\d+)",
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


def apply_rule_based_corrections(user_text: str, result: dict) -> dict:
    text = user_text.lower()

    # Correction du type d'application
    if any(word in text for word in [
        "base de données",
        "base de donnees",
        "database",
        "bdd",
        "sql",
        "mysql",
        "postgresql",
        "postgres",
        "oracle",
        "mongodb",
    ]):
        result["application_type"] = "database"

    elif any(word in text for word in [
        "e-commerce",
        "ecommerce",
        "e commerce",
        "boutique en ligne",
        "e-shop",
        "eshop",
        "online shop",
        "vente en ligne",
        "application de vente",
        "shop",
    ]):
        result["application_type"] = "ecommerce"

    elif any(word in text for word in [
        "intelligence artificielle",
        "ia",
        "ai",
        "machine learning",
        "deep learning",
        "modèle ia",
        "modele ia",
        "entrainer un modèle",
        "entraîner un modèle",
        "training model",
        "model training",
    ]):
        result["application_type"] = "ai"

    elif any(word in text for word in [
        "universitaire",
        "université",
        "universite",
        "étudiants",
        "etudiants",
        "plateforme universitaire",
        "student",
        "students",
    ]):
        result["application_type"] = "university_app"

    elif any(word in text for word in [
        "test",
        "tests",
        "tester",
        "test interne",
        "tests internes",
        "interne",
        "interne seulement",
        "environnement de test",
    ]):
        result["application_type"] = "test"

    elif any(word in text for word in [
        "devops",
        "ci/cd",
        "cicd",
        "pipeline",
        "pipelines",
        "gitlab",
        "jenkins",
        "déploiement continu",
        "deploiement continu",
    ]):
        result["application_type"] = "devops"

    elif any(word in text for word in [
        "recherche",
        "scientifique",
        "research",
        "calcul scientifique",
    ]):
        result["application_type"] = "research"

    # Correction du trafic
    if any(word in text for word in [
        "trafic très élevé",
        "trafic tres eleve",
        "trafic élevé",
        "trafic eleve",
        "fort trafic",
        "beaucoup de trafic",
        "trafic important",
        "forte charge",
        "haute charge",
        "charge élevée",
        "charge elevee",
    ]):
        result["traffic_level"] = "high"

    elif any(word in text for word in [
        "trafic moyen",
        "charge moyenne",
        "trafic modéré",
        "trafic modere",
    ]):
        result["traffic_level"] = "medium"

    elif any(word in text for word in [
        "trafic faible",
        "peu de trafic",
        "faible charge",
        "petite charge",
    ]):
        result["traffic_level"] = "low"

    # Correction de la performance
    if any(word in text for word in [
        "performance maximale",
        "haute performance",
        "performance élevée",
        "performance elevee",
        "très performant",
        "tres performant",
        "rapide",
        "rapidité",
        "rapidite",
        "forte charge",
        "haute charge",
        "temps de réponse rapide",
        "temps de reponse rapide",
    ]):
        result["performance_level"] = "performance"

    elif any(word in text for word in [
        "économique",
        "economique",
        "low cost",
        "petit budget",
        "budget limité",
        "budget limite",
        "moins cher",
        "coût faible",
        "cout faible",
    ]):
        result["performance_level"] = "economic"

    # Correction du budget
    if any(word in text for word in [
        "économique",
        "economique",
        "low cost",
        "petit budget",
        "budget limité",
        "budget limite",
        "moins cher",
        "coût faible",
        "cout faible",
    ]):
        result["budget"] = "low"

    elif any(word in text for word in [
        "budget élevé",
        "budget eleve",
        "grand budget",
        "budget important",
    ]):
        result["budget"] = "high"

    # Correction du stockage
    if any(word in text for word in [
        "grand besoin de stockage",
        "stockage important",
        "beaucoup de stockage",
        "large storage",
        "gros stockage",
        "données importantes",
        "donnees importantes",
        "volume important",
    ]):
        if result["application_type"] == "database":
            result["storage_need"] = max(int(result["storage_need"]), 300)
        elif result["application_type"] in ["ecommerce", "ai", "research"]:
            result["storage_need"] = max(int(result["storage_need"]), 250)
        else:
            result["storage_need"] = max(int(result["storage_need"]), 150)

    # Correction selon le nombre d'utilisateurs
    users = int(result.get("expected_users", 100))

    if users <= 100:
        result["traffic_level"] = "low"

    elif users <= 500:
        if result["traffic_level"] == "high":
            result["traffic_level"] = "medium"

    elif users <= 2000:
        if result["traffic_level"] == "low":
            result["traffic_level"] = "medium"

    elif users >= 5000:
        result["traffic_level"] = "high"

    if users >= 10000:
        result["performance_level"] = "performance"

    # Règles métiers fortes
    if result["application_type"] == "database":
        result["performance_level"] = "performance"
        result["storage_need"] = max(int(result["storage_need"]), 300)
        if users >= 1000:
            result["traffic_level"] = "high"

    if result["application_type"] == "ecommerce":
        if users >= 5000:
            result["traffic_level"] = "high"
            result["performance_level"] = "performance"
            result["storage_need"] = max(int(result["storage_need"]), 250)

    if result["application_type"] == "ai":
        result["performance_level"] = "performance"
        result["storage_need"] = max(int(result["storage_need"]), 300)

    if result["application_type"] == "test" and users <= 100:
        result["traffic_level"] = "low"
        result["budget"] = "low"
        result["performance_level"] = "economic"
        result["storage_need"] = min(int(result["storage_need"]), 30)

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
- "e-shop", "online shop", "boutique en ligne", "e-commerce", "vente en ligne" mean ecommerce.
- "university", "students", "étudiants", "plateforme universitaire" mean university_app.
- "AI", "IA", "machine learning", "deep learning", "model training" mean ai.
- "database", "base de données", "base de donnees", "BDD", "SQL" mean database.
- "CI/CD", "DevOps", "pipeline" mean devops.
- If the user mentions high performance, performance élevée, rapidité, forte charge, set performance_level to performance.
- If the user mentions low cost, petit budget, économique, set budget to low.
- If the user mentions important storage, set storage_need to a high value.
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

    validated = apply_rule_based_corrections(user_text, validated)

    return validated


if __name__ == "__main__":
    test_texts = [
        "Je veux une VM pour une application universitaire utilisée par 30000 étudiants.",
        "Je cherche une machine virtuelle pour une base de données importante avec 3000 utilisateurs et un grand besoin de stockage.",
        "Je veux une VM économique pour faire des tests internes avec 20 utilisateurs seulement.",
        "Notre application e-commerce va recevoir 20000 utilisateurs, trafic très élevé, besoin de stockage important et performance maximale.",
    ]

    for text in test_texts:
        result = parse_user_need(text)
        print("\n===== FINAL PARSED RESULT =====")
        print("TEXT:", text)
        print(json.dumps(result, indent=2, ensure_ascii=False))