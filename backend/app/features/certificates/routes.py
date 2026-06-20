from fastapi import APIRouter
from app.features.certificates import service

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/")
def list_certificates():
    return service.list_certificates()


@router.get("/{certificate_id}")
def get_certificate(certificate_id: str):
    return service.get_certificate(certificate_id)
