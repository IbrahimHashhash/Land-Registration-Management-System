from pydantic import BaseModel
from typing import Literal, List, Optional

ApplicationType = Literal[
    "first_registration", "ownership_transfer", "parcel_subdivision",
    "parcel_merge", "boundary_correction", "certificate_request",
]


class ApplicantRefIn(BaseModel):
    applicant_id: str
    applicant_type: Literal["citizen", "lawyer", "company", "surveyor", "authorized_representative"] = "citizen"
    submitted_by_representative: bool = False


class ParcelIn(BaseModel):
    parcel_no: str
    block_no: str
    basin_no: Optional[str] = None
    zone_id: str
    geometry: Optional[dict] = None


class RequiredDocument(BaseModel):
    document_type: str
    required: bool = True
    status: Literal["missing", "pending_review", "verified", "rejected"] = "missing"


class ApplicationCreate(BaseModel):
    application_type: ApplicationType
    priority: Literal["low", "normal", "high"] = "normal"
    applicant_ref: ApplicantRefIn
    parcel: ParcelIn
    description: Optional[str] = ""
    tags: List[str] = []
    required_documents: List[RequiredDocument] = []


class TransitionRequest(BaseModel):
    to_state: str
    note: Optional[str] = None
    reason: Optional[str] = None
    actor_id: Optional[str] = "staff"


class HoldRequest(BaseModel):
    reason: str
    actor_id: Optional[str] = "staff"


class RejectRequest(BaseModel):
    reason: str
    actor_id: Optional[str] = "staff"


class CertificateRequest(BaseModel):
    certificate_type: Literal["ownership_certificate", "registration_certificate"] = "ownership_certificate"
    full_name: str
    issued_by: str = "registrar"
