from fastapi import APIRouter, Header, Query
from typing import Optional
from app.features.applications.schemas import (
    ApplicationCreate, TransitionRequest, HoldRequest, RejectRequest, CertificateRequest,
)
from app.features.applications import service

router = APIRouter(prefix="/applications", tags=["Land Applications"])


@router.post("/", status_code=201)
def create_application(data: ApplicationCreate, idempotency_key: Optional[str] = Header(default=None)):
    return service.create_application(data, idempotency_key)


@router.get("/")
def list_applications(
    status: Optional[str] = None,
    application_type: Optional[str] = None,
    zone_id: Optional[str] = None,
    search: Optional[str] = None,
    submitted_from: Optional[str] = None,
    submitted_to: Optional[str] = None,
    sort_by: str = "submission_date",
    order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return service.list_applications(
        status, application_type, zone_id, search,
        submitted_from, submitted_to,
        sort_by, order, page, page_size,
    )


@router.get("/{application_id}")
def get_application(application_id: str):
    return service.get_application(application_id)


@router.patch("/{application_id}/transition")
def transition_application(application_id: str, data: TransitionRequest):
    return service.transition(application_id, data)


@router.post("/{application_id}/hold")
def hold_application(application_id: str, data: HoldRequest):
    return service.hold(application_id, data)


@router.post("/{application_id}/reject")
def reject_application(application_id: str, data: RejectRequest):
    return service.reject(application_id, data)


@router.post("/{application_id}/certificate", status_code=201)
def issue_certificate(application_id: str, data: CertificateRequest):
    return service.issue_certificate(application_id, data)
