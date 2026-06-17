from fastapi import APIRouter
from app.features.applicants.schemas import DocumentUpload, DocumentResponse
from app.features.applicants.service import upload_document

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/{application_id}/documents", response_model=DocumentResponse, status_code=201)
def add_document(application_id: str, data: DocumentUpload):
    return upload_document(application_id, data)
