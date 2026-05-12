def estimate_workload_category(expected_users: int) -> str:
    expected_users = int(expected_users)
    if expected_users <= 100:   return "very_low"
    if expected_users <= 300:   return "low"
    if expected_users <= 2000:  return "medium"
    if expected_users <= 10000: return "high"
    return "critical"


def compute_ai_scores(
    application_type: str,
    expected_users: int,
    traffic_level: str,
    performance_level: str,
    storage_need: int,
    budget: str = "medium",  # FIX: budget était ignoré, maintenant pris en compte
) -> dict:
    expected_users = int(expected_users)
    storage_need = int(storage_need)

    workload = estimate_workload_category(expected_users)

    user_score        = {"very_low": 1, "low": 3, "medium": 5, "high": 8, "critical": 10}[workload]
    traffic_score     = {"low": 2, "medium": 5, "high": 9}.get(traffic_level, 5)
    performance_score = {"economic": 2, "balanced": 5, "performance": 9}.get(performance_level, 5)
    storage_score     = min(10, max(1, storage_need // 50))
    # FIX: budget_score maintenant utilisé dans resource_score
    budget_score      = {"low": 2, "medium": 5, "high": 9}.get(budget, 5)

    app_weight = {
        "test": 0.7, "web": 1.0, "university_app": 1.2,
        "ecommerce": 1.5, "database": 1.6, "research": 1.5,
        "ai": 1.8, "devops": 1.2,
    }.get(application_type, 1.0)

    workload_score = round(
        ((user_score * 0.45) + (traffic_score * 0.30) + (performance_score * 0.25)) * app_weight
    )
    workload_score = min(10, max(1, workload_score))

    # FIX: budget_score intégré dans resource_score
    resource_score = round(
        (performance_score * 0.35) + (storage_score * 0.25) + (user_score * 0.25) + (budget_score * 0.15)
    )
    resource_score = min(10, max(1, resource_score))

    criticality_score = round(
        (workload_score * 0.50) + (resource_score * 0.30) + (performance_score * 0.20)
    )
    criticality_score = min(10, max(1, criticality_score))

    return {
        "workload_category": workload,
        "workload_score": workload_score,
        "resource_score": resource_score,
        "criticality_score": criticality_score,
    }