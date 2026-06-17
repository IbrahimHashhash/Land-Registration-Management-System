from pydantic import BaseModel
from typing import Literal, List, Optional
from datetime import datetime



class IdentityBlock(BaseModel):
    national_id: str
    verified: bool = False
    verification_method: str = "otp_stub"

class ContactsBlock(BaseModel):
    email: str
    phone: str

class AddressBlock(BaseModel):
    city: str
    neighborhood: str
    zone_id: str

class NotificationsBlock(BaseModel):
    on_status_change: bool = True
    on_missing_documents: bool = True
    on_certificate_ready: bool = True

class PreferencesBlock(BaseModel):
    preferred_contact: Literal["email", "phone"] = "email"
    language: Literal["ar", "en"] = "ar"
    notifications: NotificationsBlock = NotificationsBlock()

class StatsBlock(BaseModel):
    total_applications: int = 0
    approved_applications: int = 0
    pending_applications: int = 0



class ApplicantCreate(BaseModel):
    full_name: str
    applicant_type: Literal["citizen", "lawyer", "company", "surveyor", "authorized_representative"]
    identity: IdentityBlock
    contacts: ContactsBlock
    address: AddressBlock
    preferences: PreferencesBlock = PreferencesBlock()
    profile_public: bool = False


class ApplicantPublic(BaseModel):
    applicant_id: str
    full_name: str
    applicant_type: str
    verification_state: str
    contacts: ContactsBlock
    address: AddressBlock
    preferences: PreferencesBlock
    stats: StatsBlock
    linked_applications: List[str] = []
    created_at: datetime


class ApplicantInternal(ApplicantPublic):
    identity: IdentityBlock
    profile_public: bool



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



class ObjectionCreate(BaseModel):
    author_id: str
    reason: str
    supporting_documents: List[str] = []


class ObjectionResponse(BaseModel):
    objection_id: str
    application_id: str
    author_id: str
    reason: str
    supporting_documents: List[str]
    status: str
    created_at: datetime



class TimelineBy(BaseModel):
    actor_type: str
    actor_id: Optional[str]

class TimelineEvent(BaseModel):
    type: str
    by: TimelineBy
    at: datetime
    meta: Optional[dict] = None



class ApplicationSummary(BaseModel):
    application_id: str
    status: str
    application_type: str
    submission_date: Optional[datetime] = None
