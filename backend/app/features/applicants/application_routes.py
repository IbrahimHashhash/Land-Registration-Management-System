from fastapi import APIRouter, Depends
from typing import List
from app.features.applicants.schemas import (
    DocumentUpload, DocumentResponse, DocumentVerify, CommentCreate, CommentResponse,
    ObjectionCreate, ObjectionResponse, TimelineEvent,
)
from app.features.applicants.service import (
    upload_document, add_comment, submit_objection, get_timeline,
    list_documents_for_application, verify_document,
)
from app.dependencies import require_staff_role

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/{application_id}/documents", response_model=DocumentResponse, status_code=201)
def add_document(application_id: str, data: DocumentUpload):
    return upload_document(application_id, data)


@router.get("/{application_id}/documents", response_model=List[DocumentResponse])
def get_documents(application_id: str):
    return list_documents_for_application(application_id)


@router.patch(
    "/{application_id}/documents/{document_id}/verify",
    response_model=DocumentResponse,
    dependencies=[Depends(require_staff_role)],
)
def verify_document_endpoint(application_id: str, document_id: str, data: DocumentVerify):
    return verify_document(application_id, document_id, data.verification_status, data.by)


@router.post("/{application_id}/comments", response_model=CommentResponse, status_code=201)
def post_comment(application_id: str, data: CommentCreate):
    return add_comment(application_id, data)


@router.post("/{application_id}/objections", response_model=ObjectionResponse, status_code=201)
def add_objection(application_id: str, data: ObjectionCreate):
    return submit_objection(application_id, data)


@router.get("/{application_id}/timeline", response_model=List[TimelineEvent])
def get_logs(application_id: str):
    return get_timeline(application_id)
