import os
from pathlib import Path
import joblib
import pandas as pd
from .scoring import compute_ai_scores

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "vm_recommender.pkl"

VM_PROFILES = {
    # ── General Purpose ──────────────────────────────────────────────────────
    "gp_xs": {
        "flavor_id": "s6.medium.2", "cpu": "1 vCPU", "ram": "2 GB",
        "storage": 40, "storage_type": "SSD", "monthly_price": 10,
        "category": "general", "use_case": "Testing, dev, personal projects",
    },
    "gp_s": {
        "flavor_id": "s6.medium.4", "cpu": "1 vCPU", "ram": "4 GB",
        "storage": 60, "storage_type": "SSD", "monthly_price": 15,
        "category": "general", "use_case": "Small web apps, low traffic APIs",
    },
    "gp_m": {
        "flavor_id": "s6.large.2", "cpu": "2 vCPUs", "ram": "4 GB",
        "storage": 80, "storage_type": "SSD", "monthly_price": 20,
        "category": "general", "use_case": "Medium web apps, moderate traffic",
    },
    "gp_m2": {
        "flavor_id": "s6.large.4", "cpu": "2 vCPUs", "ram": "8 GB",
        "storage": 100, "storage_type": "Business_SSD", "monthly_price": 30,
        "category": "general", "use_case": "Production apps, ecommerce, small databases",
    },
    "gp_l": {
        "flavor_id": "s6.xlarge.2", "cpu": "4 vCPUs", "ram": "8 GB",
        "storage": 150, "storage_type": "Business_SSD", "monthly_price": 40,
        "category": "general", "use_case": "High traffic apps, CI/CD, DevOps",
    },
    "gp_l2": {
        "flavor_id": "s6.xlarge.4", "cpu": "4 vCPUs", "ram": "16 GB",
        "storage": 200, "storage_type": "Business_SSD", "monthly_price": 60,
        "category": "general", "use_case": "Large web apps, university platforms",
    },
    "gp_xl": {
        "flavor_id": "s6.2xlarge.2", "cpu": "8 vCPUs", "ram": "16 GB",
        "storage": 200, "storage_type": "Business_SSD", "monthly_price": 80,
        "category": "general", "use_case": "High load apps, large ecommerce",
    },
    "gp_xl2": {
        "flavor_id": "s6.2xlarge.4", "cpu": "8 vCPUs", "ram": "32 GB",
        "storage": 300, "storage_type": "Business_SSD", "monthly_price": 120,
        "category": "general", "use_case": "Critical production, large databases",
    },
    "gp_xxl": {
        "flavor_id": "s6.4xlarge.2", "cpu": "16 vCPUs", "ram": "32 GB",
        "storage": 400, "storage_type": "Business_SSD", "monthly_price": 200,
        "category": "general", "use_case": "Enterprise apps, massive scale",
    },
    # ── Memory Optimized ─────────────────────────────────────────────────────
    "mem_s": {
        "flavor_id": "m6.large.8", "cpu": "2 vCPUs", "ram": "16 GB",
        "storage": 100, "storage_type": "Business_SSD", "monthly_price": 50,
        "category": "memory", "use_case": "Relational databases, Redis, caching",
    },
    "mem_m": {
        "flavor_id": "m6.xlarge.8", "cpu": "4 vCPUs", "ram": "32 GB",
        "storage": 200, "storage_type": "Business_SSD", "monthly_price": 100,
        "category": "memory", "use_case": "Large databases, NoSQL, data processing",
    },
    "mem_l": {
        "flavor_id": "m6.2xlarge.8", "cpu": "8 vCPUs", "ram": "64 GB",
        "storage": 300, "storage_type": "Business_SSD", "monthly_price": 200,
        "category": "memory", "use_case": "Enterprise databases, big data",
    },
    "mem_xl": {
        "flavor_id": "m6.4xlarge.8", "cpu": "16 vCPUs", "ram": "128 GB",
        "storage": 500, "storage_type": "Business_SSD", "monthly_price": 400,
        "category": "memory", "use_case": "Critical databases, in-memory computing",
    },
    # ── GPU ──────────────────────────────────────────────────────────────────
    "gpu_s": {
        "flavor_id": "p2s.2xlarge.8", "cpu": "8 vCPUs", "ram": "64 GB",
        "storage": 300, "storage_type": "Business_SSD", "monthly_price": 500,
        "category": "gpu", "use_case": "AI training, deep learning, image classification",
    },
    "gpu_m": {
        "flavor_id": "p2s.4xlarge.8", "cpu": "16 vCPUs", "ram": "32 GB",
        "storage": 400, "storage_type": "Business_SSD", "monthly_price": 800,
        "category": "gpu", "use_case": "Large AI models, NLP, autonomous driving",
    },
    "gpu_l": {
        "flavor_id": "p2s.8xlarge.8", "cpu": "32 vCPUs", "ram": "64 GB",
        "storage": 500, "storage_type": "Business_SSD", "monthly_price": 1500,
        "category": "gpu", "use_case": "Heavy ML training, scientific computing",
    },
}


def recommend_vm(
    application_type: str,
    expected_users: int,
    traffic_level: str,
    budget: str,
    performance_level: str,
    storage_need: int,
) -> dict:
    # FIX: FileNotFoundError propagée proprement (capturée dans api.py → HTTP 503)
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at '{MODEL_PATH}'. Run: python train_model.py"
        )

    model = joblib.load(MODEL_PATH)

    # FIX: budget transmis à compute_ai_scores
    scores = compute_ai_scores(
        application_type=application_type,
        expected_users=int(expected_users),
        traffic_level=traffic_level,
        performance_level=performance_level,
        storage_need=int(storage_need),
        budget=budget,
    )

    # FIX: app_weight et budget_score ajoutés pour mieux discriminer les profils
    APP_WEIGHT = {
        "test": 0.7, "web": 1.0, "university_app": 1.2,
        "ecommerce": 1.5, "database": 1.6, "research": 1.5,
        "ai": 1.8, "devops": 1.2,
    }
    BUDGET_SCORE = {"low": 2, "medium": 5, "high": 9}

    input_data = pd.DataFrame([{
        "application_type":  application_type,
        "expected_users":    int(expected_users),
        "traffic_level":     traffic_level,
        "budget":            budget,
        "performance_level": performance_level,
        "storage_need":      int(storage_need),
        "workload_score":    scores["workload_score"],
        "resource_score":    scores["resource_score"],
        "criticality_score": scores["criticality_score"],
        "app_weight":        APP_WEIGHT.get(application_type, 1.0),
        "budget_score":      BUDGET_SCORE.get(budget, 5),
    }])

    predicted_profile = model.predict(input_data)[0]
    probabilities     = model.predict_proba(input_data)[0]
    classes           = model.classes_

    confidence_scores = {
        classes[i]: round(float(probabilities[i]), 3)
        for i in range(len(classes))
    }

    vm_config = VM_PROFILES.get(predicted_profile, VM_PROFILES["gp_s"])

    return {
        "recommended_profile": predicted_profile,
        "configuration":       vm_config,
        "ai_scores":           scores,
        "confidence_scores":   confidence_scores,
        "explanation": (
            f"Based on your {application_type} application with {expected_users} users, "
            f"workload score {scores['workload_score']}/10, "
            f"resource score {scores['resource_score']}/10, "
            f"criticality {scores['criticality_score']}/10. "
            f"Recommended: {vm_config['flavor_id']} "
            f"({vm_config['cpu']}, {vm_config['ram']}) — {vm_config['use_case']}."
        ),
    }
