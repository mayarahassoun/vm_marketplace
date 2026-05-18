import json
from typing import Any

import httpx

from app.core.config import (
    MANAGEONE_DOMAIN_NAME,
    MANAGEONE_IAM_ENDPOINT,
    MANAGEONE_PASSWORD,
    MANAGEONE_SC_ENDPOINT,
    MANAGEONE_USERNAME,
    MANAGEONE_VERIFY_SSL,
)


class ManageOneConfigError(Exception):
    pass


class ManageOneAPIError(Exception):
    pass


def _require_config() -> None:
    missing = [
        name
        for name, value in {
            "MANAGEONE_USERNAME": MANAGEONE_USERNAME,
            "MANAGEONE_PASSWORD": MANAGEONE_PASSWORD,
            "MANAGEONE_DOMAIN_NAME": MANAGEONE_DOMAIN_NAME,
        }.items()
        if not value
    ]
    if missing:
        raise ManageOneConfigError(
            f"Missing ManageOne configuration: {', '.join(missing)}"
        )


def _localized_name(value: Any) -> str:
    if not value:
        return "-"
    if not isinstance(value, str):
        return str(value)
    try:
        data = json.loads(value)
        return data.get("en_us") or data.get("zh_cn") or value
    except json.JSONDecodeError:
        return value


class ManageOneService:
    def __init__(self) -> None:
        self.iam_endpoint = MANAGEONE_IAM_ENDPOINT.rstrip("/")
        self.sc_endpoint = MANAGEONE_SC_ENDPOINT.rstrip("/")
        self.verify_ssl = MANAGEONE_VERIFY_SSL

    async def get_token(self) -> str:
        _require_config()

        auth_url = f"{self.iam_endpoint}/v3/auth/tokens"
        payload = {
            "auth": {
                "identity": {
                    "methods": ["password"],
                    "password": {
                        "user": {
                            "name": MANAGEONE_USERNAME,
                            "password": MANAGEONE_PASSWORD,
                            "domain": {"name": MANAGEONE_DOMAIN_NAME},
                        }
                    },
                }
            }
        }

        async with httpx.AsyncClient(verify=self.verify_ssl, timeout=30) as client:
            response = await client.post(
                auth_url,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json=payload,
            )

        if response.status_code != 201:
            raise ManageOneAPIError(
                f"Failed to get IAM token ({response.status_code}): {response.text[:500]}"
            )

        token = response.headers.get("X-Subject-Token")
        if not token:
            raise ManageOneAPIError("ManageOne authentication succeeded but no token was returned")
        return token

    async def list_vdcs(self, start: int = 0, limit: int = 20) -> dict[str, Any]:
        token = await self.get_token()
        url = f"{self.sc_endpoint}/rest/vdc/v3.0/vdcs"

        async with httpx.AsyncClient(verify=self.verify_ssl, timeout=30) as client:
            response = await client.get(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-auth-token": token,
                },
                params={"start": start, "limit": limit},
            )

        if response.status_code != 200:
            raise ManageOneAPIError(
                f"Failed to query VDC list ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        return {
            "total": data.get("total", len(data.get("vdcs", []))),
            "vdcs": data.get("vdcs", []),
        }

    async def get_vdc_quotas(self, vdc_id: str, start: int = 0, limit: int = 100) -> dict[str, Any]:
        token = await self.get_token()
        url = f"{self.sc_endpoint}/rest/vdc/v3.2/vdcs/{vdc_id}/quotas"

        async with httpx.AsyncClient(verify=self.verify_ssl, timeout=30) as client:
            response = await client.get(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-auth-token": token,
                },
                params={"start": start, "limit": limit},
            )

        if response.status_code != 200:
            raise ManageOneAPIError(
                f"Failed to query VDC quotas ({response.status_code}): {response.text[:500]}"
            )

        return response.json()

    def summarize_quotas(self, quota_data: dict[str, Any]) -> list[dict[str, Any]]:
        summary: list[dict[str, Any]] = []
        for service in quota_data.get("services", []):
            service_name = _localized_name(service.get("service_name"))
            for quota in service.get("quotas", []):
                limit = quota.get("quota_limit")
                left = quota.get("quota_left")
                summary.append(
                    {
                        "service": service_name,
                        "service_id": service.get("service_id"),
                        "resource": _localized_name(quota.get("resource_name")),
                        "unit": _localized_name(quota.get("unit")),
                        "az": quota.get("az_name") or "N/A",
                        "limit": "Unlimited" if limit == -1 else limit,
                        "used": quota.get("quota_used"),
                        "remaining": "Unlimited" if left == -1 else left,
                    }
                )
        return summary
