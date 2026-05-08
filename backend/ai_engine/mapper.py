def map_to_flavor(ai):

    workload = ai.get("workload", "medium")

    if workload == "low":
        return {
            "flavor_id": "s6.medium.2",
            "cpu": "2 vCPUs",
            "ram": "4 GB",
            "storage": 50,
            "storage_type": "SSD"
        }

    if workload == "medium":
        return {
            "flavor_id": "s6.large.4",
            "cpu": "2 vCPUs",
            "ram": "8 GB",
            "storage": 100,
            "storage_type": "SSD"
        }

    return {
        "flavor_id": "s6.xlarge.8",
        "cpu": "4 vCPUs",
        "ram": "16 GB",
        "storage": 200,
        "storage_type": "SSD"
    }