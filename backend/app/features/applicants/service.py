from datetime import datetime, timezone
import uuid
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException
from app.database import applicants_col
from app.features.applicants.schemas import ApplicantCreate


def create_applicant(data: ApplicantCreate) -> dict:
    doc = {
        "applicant_id": "APP-" + str(uuid.uuid4())[:8].upper(),
        "full_name": data.full_name,
        "national_id": data.national_id,
        "applicant_type": data.applicant_type,
        "email": data.email,
        "phone": data.phone,
        "city": data.city,
        "neighborhood": data.neighborhood,
        "address": data.address,
        "zone_id": data.zone_id,
        "preferred_language": data.preferred_language,
        "preferred_contact": data.preferred_contact,
        "notify_by_email": data.notify_by_email,
        "notify_by_sms": data.notify_by_sms,
        "profile_public": data.profile_public,
        "verification_state": "unverified",
        "on_status_change": True,
        "on_missing_documents": True,
        "on_certificate_ready": True,
        "stats": {"total_applications": 0, "approved": 0, "pending": 0},
        "linked_applications": [],
        "created_at": datetime.now(timezone.utc),
    }
    try:
        applicants_col.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="National ID already registered")
    return doc


def get_applicant(applicant_id: str) -> dict:
    doc = applicants_col.find_one({"applicant_id": applicant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return doc
