from fastapi import APIRouter
from typing import List
from app.features.applicants.schemas import DocumentUpload, DocumentResponse, CommentCreate, CommentResponse, ObjectionCreate, ObjectionResponse, TimelineEvent
from app.features.applicants.service import upload_document, add_comment, submit_objection, get_timeline

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/{application_id}/documents", response_model=DocumentResponse, status_code=201)
def add_document(application_id: str, data: DocumentUpload):
    return upload_document(application_id, data)


@router.post("/{application_id}/comments", response_model=CommentResponse, status_code=201)
def post_comment(application_id: str, data: CommentCreate):
    return add_comment(application_id, data)
@router.post("/{application_id}/objections", response_model=ObjectionResponse, status_code=201)
def add_objection(application_id: str, data: ObjectionCreate):
    return submit_objection(application_id, data)

@router.get("/{application_id}/timeline", response_model=List[TimelineEvent], status_code=200)
def get_logs(application_id: str):
    return get_timeline(application_id)