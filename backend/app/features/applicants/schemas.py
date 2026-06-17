from pydantic import BaseModel
from typing import Literal, List, Optional
from datetime import datetime

class ApplicantCreate(BaseModel):
    full_name: str
    national_id: str
    applicant_type: Literal["citizen", "lawyer", "company", "surveyor", "authorized_representative"]
    email: str
    phone: str
    city: str
    neighborhood: str
    address: str
    zone_id: str
    preferred_language: Literal["ar", "en"] = "ar"
    preferred_contact: Literal["email", "phone"] = "email"
    notify_by_email: bool = True
    notify_by_sms: bool = False
    profile_public: bool = False


class ApplicantStats(BaseModel):
    total_applications: int = 0
    approved: int = 0
    pending: int = 0


class ApplicantPublic(BaseModel):
    applicant_id: str
    full_name: str
    applicant_type: str
    verification_state: str
    email: str
    phone: str
    city: str
    neighborhood: str
    address: str
    zone_id: str
    preferred_language: str
    preferred_contact: str
    notify_by_email: bool
    notify_by_sms: bool
    stats: ApplicantStats
    linked_applications: List[str] = []


class ApplicantInternal(ApplicantPublic):
    national_id: str
    profile_public: bool
    on_status_change: bool
    on_missing_documents: bool
    on_certificate_ready: bool


class CommentCreate(BaseModel):
    author_id: str
    text: str


class CommentResponse(BaseModel):
    comment_id: str
    application_id: str
    author_id: str
    author_role: str
    text: str
    created_at: datetime


class DocumentUpload(BaseModel):
    document_type: Literal["ownership_deed", "id_copy", "sale_contract", "survey_report", "power_of_attorney", "other"]
    file_name: str
    file_path: str


class DocumentResponse(BaseModel):
    document_id: str
    application_id: str
    document_type: str
    file_name: str
    file_path: str
    verification_status: str
    uploaded_at: datetime
