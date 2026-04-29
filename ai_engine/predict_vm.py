import joblib
import pandas as pd

MODEL_PATH = "models/vm_recommender.pkl"

VM_PROFILES = {
    "small": {
        "flavor": "s2.small.1",
        "cpu": 1,
        "ram": 2,
        "storage": 30,
        "os": "Ubuntu 22.04",
        "cost_level": "low"
    },
    "medium": {
        "flavor": "s2.medium.2",
        "cpu": 2,
        "ram": 4,
        "storage": 60,
        "os": "Ubuntu 22.04",
        "cost_level": "medium"
    },
    "large": {
        "flavor": "s3.large.2",
        "cpu": 4,
        "ram": 8,
        "storage": 120,
        "os": "Ubuntu 22.04",
        "cost_level": "medium-high"
    },
    "xlarge": {
        "flavor": "s3.xlarge.2",
        "cpu": 8,
        "ram": 16,
        "storage": 200,
        "os": "Ubuntu 22.04",
        "cost_level": "high"
    },
    "database": {
        "flavor": "m3.large.4",
        "cpu": 4,
        "ram": 16,
        "storage": 300,
        "os": "Ubuntu 22.04",
        "cost_level": "high"
    },
    "high-performance": {
        "flavor": "c3.xlarge.4",
        "cpu": 8,
        "ram": 32,
        "storage": 300,
        "os": "Ubuntu 22.04",
        "cost_level": "high"
    }
}


def compute_ai_scores(application_type, expected_users, traffic_level, budget, performance_level, storage_need):
    expected_users = int(expected_users)
    storage_need = int(storage_need)

    if expected_users <= 100:
        user_score = 1
    elif expected_users <= 500:
        user_score = 3
    elif expected_users <= 2000:
        user_score = 6
    elif expected_users <= 5000:
        user_score = 8
    else:
        user_score = 10

    traffic_score = {
        "low": 1,
        "medium": 5,
        "high": 9
    }.get(traffic_level, 5)

    performance_score = {
        "economic": 2,
        "balanced": 5,
        "performance": 9
    }.get(performance_level, 5)

    storage_score = min(10, max(1, storage_need // 30))

    application_weight = {
        "test": 0.6,
        "web": 1.0,
        "university_app": 1.1,
        "devops": 1.2,
        "ecommerce": 1.4,
        "research": 1.5,
        "database": 1.6,
        "ai": 1.8
    }.get(application_type, 1.0)

    workload_score = round(((user_score * 0.5) + (traffic_score * 0.3) + (performance_score * 0.2)) * application_weight)
    workload_score = min(10, max(1, workload_score))

    resource_score = round((performance_score * 0.4) + (storage_score * 0.3) + (user_score * 0.3))
    resource_score = min(10, max(1, resource_score))

    criticality_score = round((workload_score * 0.5) + (resource_score * 0.3) + (performance_score * 0.2))
    criticality_score = min(10, max(1, criticality_score))

    return workload_score, resource_score, criticality_score


def recommend_vm(
    application_type,
    expected_users,
    traffic_level,
    budget,
    performance_level,
    storage_need
):
    model = joblib.load(MODEL_PATH)

    workload_score, resource_score, criticality_score = compute_ai_scores(
        application_type,
        expected_users,
        traffic_level,
        budget,
        performance_level,
        storage_need
    )

    input_data = pd.DataFrame([{
        "application_type": application_type,
        "expected_users": expected_users,
        "traffic_level": traffic_level,
        "budget": budget,
        "performance_level": performance_level,
        "storage_need": storage_need,
        "workload_score": workload_score,
        "resource_score": resource_score,
        "criticality_score": criticality_score,
    }])

    predicted_profile = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    classes = model.classes_

    confidence_scores = {
        classes[i]: round(float(probabilities[i]), 3)
        for i in range(len(classes))
    }

    vm_config = VM_PROFILES.get(predicted_profile)

    return {
        "recommended_profile": predicted_profile,
        "configuration": vm_config,
        "ai_scores": {
            "workload_score": workload_score,
            "resource_score": resource_score,
            "criticality_score": criticality_score
        },
        "confidence_scores": confidence_scores,
        "explanation": (
            f"The recommendation is generated using an AI scoring engine and a supervised ML model. "
            f"The workload score is {workload_score}/10, the resource score is {resource_score}/10, "
            f"and the criticality score is {criticality_score}/10."
        )
    }


if __name__ == "__main__":
    result = recommend_vm(
        application_type="ecommerce",
        expected_users=10000,
        traffic_level="high",
        budget="medium",
        performance_level="performance",
        storage_need=250
    )

    print(result)