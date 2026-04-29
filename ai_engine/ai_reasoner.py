def estimate_workload_category(expected_users: int) -> str:
    expected_users = int(expected_users)

    if expected_users <= 100:
        return "very_low"
    if expected_users <= 500:
        return "low"
    if expected_users <= 2000:
        return "medium"
    if expected_users <= 10000:
        return "high"
    return "critical"


def infer_traffic_level(expected_users: int) -> tuple[str, float]:
    workload = estimate_workload_category(expected_users)

    if workload in ["very_low", "low"]:
        return "low", 0.95
    if workload == "medium":
        return "medium", 0.95
    return "high", 0.97


def infer_performance_level(application_type: str, expected_users: int, current_performance: str) -> tuple[str, float]:
    workload = estimate_workload_category(expected_users)

    high_priority_apps = ["ecommerce", "database", "ai", "research"]

    if application_type in high_priority_apps and workload in ["high", "critical"]:
        return "performance", 0.92

    if application_type == "university_app" and workload == "critical":
        return "performance", 0.90

    if workload == "critical":
        return "performance", 0.88

    return current_performance, 0.96


def infer_storage_need(application_type: str, expected_users: int, current_storage: int) -> tuple[int, float]:
    workload = estimate_workload_category(expected_users)

    base_storage = {
        "test": 30,
        "web": 60,
        "university_app": 80,
        "ecommerce": 120,
        "database": 200,
        "ai": 300,
        "research": 200,
        "devops": 100,
    }.get(application_type, 60)

    multiplier = {
        "very_low": 1,
        "low": 1,
        "medium": 1.5,
        "high": 2,
        "critical": 3,
    }[workload]

    inferred_storage = int(base_storage * multiplier)

    if inferred_storage < int(current_storage):
        inferred_storage = int(current_storage)

    return inferred_storage, 0.90


def compute_ai_scores(
    application_type: str,
    expected_users: int,
    traffic_level: str,
    performance_level: str,
    storage_need: int,
) -> dict:
    workload_category = estimate_workload_category(expected_users)

    user_score_map = {
        "very_low": 1,
        "low": 3,
        "medium": 5,
        "high": 8,
        "critical": 10,
    }

    traffic_score_map = {
        "low": 2,
        "medium": 5,
        "high": 9,
    }

    performance_score_map = {
        "economic": 2,
        "balanced": 5,
        "performance": 9,
    }

    app_weight = {
        "test": 0.7,
        "web": 1.0,
        "university_app": 1.2,
        "ecommerce": 1.5,
        "database": 1.6,
        "research": 1.5,
        "ai": 1.8,
        "devops": 1.2,
    }.get(application_type, 1.0)

    user_score = user_score_map[workload_category]
    traffic_score = traffic_score_map.get(traffic_level, 5)
    performance_score = performance_score_map.get(performance_level, 5)
    storage_score = min(10, max(1, int(storage_need) // 50))

    workload_score = round(
        ((user_score * 0.45) + (traffic_score * 0.30) + (performance_score * 0.25)) * app_weight
    )
    workload_score = min(10, max(1, workload_score))

    resource_score = round(
        (performance_score * 0.40) + (storage_score * 0.30) + (user_score * 0.30)
    )
    resource_score = min(10, max(1, resource_score))

    criticality_score = round(
        (workload_score * 0.50) + (resource_score * 0.30) + (performance_score * 0.20)
    )
    criticality_score = min(10, max(1, criticality_score))

    return {
        "workload_category": workload_category,
        "workload_score": workload_score,
        "resource_score": resource_score,
        "criticality_score": criticality_score,
    }


def reason_about_request(parsed_need: dict) -> dict:
    result = parsed_need.copy()
    reasoning_steps = []

    expected_users = int(result["expected_users"])
    application_type = result["application_type"]

    inferred_traffic, traffic_confidence = infer_traffic_level(expected_users)
    if inferred_traffic != result["traffic_level"]:
        reasoning_steps.append(
            f"Traffic level adjusted from {result['traffic_level']} to {inferred_traffic} based on {expected_users} expected users."
        )
        result["traffic_level"] = inferred_traffic

    inferred_performance, performance_confidence = infer_performance_level(
        application_type,
        expected_users,
        result["performance_level"],
    )
    if inferred_performance != result["performance_level"]:
        reasoning_steps.append(
            f"Performance level adjusted from {result['performance_level']} to {inferred_performance} for workload type {application_type}."
        )
        result["performance_level"] = inferred_performance

    inferred_storage, storage_confidence = infer_storage_need(
        application_type,
        expected_users,
        int(result["storage_need"]),
    )
    if inferred_storage != int(result["storage_need"]):
        reasoning_steps.append(
            f"Storage need adjusted from {result['storage_need']} GB to {inferred_storage} GB based on workload category."
        )
        result["storage_need"] = inferred_storage

    ai_scores = compute_ai_scores(
        application_type=result["application_type"],
        expected_users=int(result["expected_users"]),
        traffic_level=result["traffic_level"],
        performance_level=result["performance_level"],
        storage_need=int(result["storage_need"]),
    )

    result["ai_scores"] = ai_scores
    result["reasoning"] = {
        "steps": reasoning_steps,
        "confidence": {
            "traffic_confidence": traffic_confidence,
            "performance_confidence": performance_confidence,
            "storage_confidence": storage_confidence,
        },
    }

    return result