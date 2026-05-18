from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.models.user import User
from app.services.manageone_service import (
    ManageOneAPIError,
    ManageOneConfigError,
    ManageOneService,
)

router = APIRouter(prefix="/api/manageone", tags=["ManageOne"])


def get_manageone_service() -> ManageOneService:
    return ManageOneService()


@router.get("/health")
async def manageone_health(
    current_user: User = Depends(get_current_user),
    service: ManageOneService = Depends(get_manageone_service),
):
    try:
        await service.get_token()
        return {"status": "ok", "component": "manageone"}
    except ManageOneConfigError as exc:
        return {"status": "not_configured", "detail": str(exc)}
    except ManageOneAPIError as exc:
        return {"status": "unavailable", "detail": str(exc)}


@router.get("/vdcs")
async def list_vdcs(
    start: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: ManageOneService = Depends(get_manageone_service),
):
    try:
        return await service.list_vdcs(start=start, limit=limit)
    except ManageOneConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ManageOneAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/vdcs/{vdc_id}/quotas")
async def get_vdc_quotas(
    vdc_id: str,
    start: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    service: ManageOneService = Depends(get_manageone_service),
):
    try:
        data = await service.get_vdc_quotas(vdc_id=vdc_id, start=start, limit=limit)
        return {
            "raw": data,
            "summary": service.summarize_quotas(data),
        }
    except ManageOneConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ManageOneAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
