from scoring import compute_ai_scores, estimate_workload_category


def infer_traffic_level(expected_users: int) -> tuple[str, float]:
    workload = estimate_workload_category(expected_users)
    if workload in ["very_low", "low"]: return "low", 0.95
    if workload == "medium":            return "medium", 0.95
    return "high", 0.97


def infer_performance_level(
    application_type: str,
    expected_users: int,
    current_performance: str,
) -> tuple[str, float]:
    workload = estimate_workload_category(expected_users)
    high_priority = ["ecommerce", "database", "ai", "research"]

    if application_type in high_priority and workload in ["high", "critical"]:
        return "performance", 0.92
    if application_type == "university_app" and workload == "critical":
        return "performance", 0.90
    if workload == "critical":
        return "performance", 0.88
    return current_performance, 0.96


def infer_storage_need(
    application_type: str,
    expected_users: int,
    current_storage: int,
) -> tuple[int, float]:
    workload = estimate_workload_category(expected_users)
    base = {
        "test": 30, "web": 60, "university_app": 80,
        "ecommerce": 120, "database": 200, "ai": 300,
        "research": 200, "devops": 100,
    }.get(application_type, 60)

    multiplier = {
        "very_low": 1, "low": 1, "medium": 1.5, "high": 2, "critical": 3
    }[workload]

    inferred = max(int(base * multiplier), int(current_storage))
    return inferred, 0.90


def reason_about_request(parsed_need: dict) -> dict:
    result = parsed_need.copy()
    steps = []

    expected_users   = int(result["expected_users"])
    application_type = result["application_type"]

    # --- Traffic ---
    inferred_traffic, tc = infer_traffic_level(expected_users)
    if inferred_traffic != result["traffic_level"]:
        steps.append(f"Traffic adjusted to '{inferred_traffic}' based on {expected_users} users.")
        result["traffic_level"] = inferred_traffic

    # --- Performance ---
    inferred_perf, pc = infer_performance_level(
        application_type, expected_users, result["performance_level"]
    )
    if inferred_perf != result["performance_level"]:
        steps.append(f"Performance adjusted to '{inferred_perf}' for {application_type} workload.")
        result["performance_level"] = inferred_perf

    # --- Storage ---
    inferred_storage, sc = infer_storage_need(
        application_type, expected_users, int(result["storage_need"])
    )
    # FIX: toujours corriger si storage_need est 0 ou inférieur à la valeur inférée
    if inferred_storage != int(result["storage_need"]) or int(result["storage_need"]) == 0:
        steps.append(f"Storage adjusted to {inferred_storage} GB for {application_type} workload.")
        result["storage_need"] = inferred_storage

    # --- Budget cap: corriger budget "high" si non justifié par le contexte ---
    # Un utilisateur qui dit "haute performance" ne veut pas forcément payer GPU
    NON_GPU_TYPES = ["web", "ecommerce", "university_app", "devops", "test"]
    if result.get("budget") == "high" and application_type in NON_GPU_TYPES:
        from scoring import estimate_workload_category
        workload = estimate_workload_category(expected_users)
        # Seulement garder budget=high si vraiment critique
        if workload not in ["high", "critical"]:
            steps.append(f"Budget adjusted to 'medium' — '{application_type}' does not require GPU-tier resources.")
            result["budget"] = "medium"

    # FIX: budget maintenant transmis à compute_ai_scores
    result["ai_scores"] = compute_ai_scores(
        application_type=result["application_type"],
        expected_users=int(result["expected_users"]),
        traffic_level=result["traffic_level"],
        performance_level=result["performance_level"],
        storage_need=int(result["storage_need"]),
        budget=result.get("budget", "medium"),
    )

    result["reasoning"] = {
        "steps": steps,
        "confidence": {
            "traffic_confidence":     tc,
            "performance_confidence": pc,
            "storage_confidence":     sc,
        },
    }

    return result