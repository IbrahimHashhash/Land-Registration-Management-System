from datetime import datetime, timezone
import uuid
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException
from app.database import applicants_col, documents_col, logs_col, applications_col, objections_col
from app.features.applicants.schemas import ApplicantCreate, DocumentUpload, CommentCreate, ObjectionCreate, ApplicationSummary


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


def upload_document(application_id: str, data: DocumentUpload) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "document_id": "DOC-" + str(uuid.uuid4())[:8].upper(),
        "application_id": application_id,
        "document_type": data.document_type,
        "file_name": data.file_name,
        "file_path": data.file_path,
        "verification_status": "pending_review",
        "uploaded_at": now,
    }
    documents_col.insert_one(doc)
    logs_col.insert_one({
        "application_id": application_id,
        "event_type": "document_uploaded",
        "actor_id": None,
        "actor_role": "applicant",
        "at": now,
        "meta": {"document_id": doc["document_id"], "document_type": data.document_type},
    })
    return doc


def add_comment(application_id: str, data: CommentCreate) -> dict:
    now = datetime.now(timezone.utc)
    comment = {
        "comment_id": "CMT-" + str(uuid.uuid4())[:8].upper(),
        "application_id": application_id,
        "author_id": data.author_id,
        "author_role": "applicant",
        "text": data.text,
        "created_at": now,
    }
    # TODO: confirm field name with Student 1 — assuming comments array is at land_applications.comments
    result = applications_col.update_one(
        {"application_id": application_id},
        {"$push": {"comments": comment}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return comment

def submit_objection(application_id: str ,data: ObjectionCreate) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "objection_id": "OBJ-" + str(uuid.uuid4())[:8].upper(),
        "application_id":application_id,
        "author_id": data.author_id,
        "reason": data.reason,
        "supporting_documents": data.supporting_documents,
        "status": "open",
        "created_at": now
    }
    application = applications_col.find_one({"application_id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.get("status") in ["closed", "rejected"]:
        raise HTTPException(status_code=400, detail="Cannot object on a closed or rejected application")

    objections_col.insert_one(doc)
    result = applications_col.update_one(
        {"application_id": application_id}, 
        {
            "$set": {"objection.has_objection" : True, "status": "under_objection"},
            "$push": {"objection.objection_ids": doc["objection_id"]}
        }
    )
    logs_col.insert_one({
        "application_id": application_id,
        "event_type": "objection_submitted",
        "actor_id": data.author_id,
        "actor_role": "applicant",
        "at": now,
        "meta": {"objection_id": doc["objection_id"], "reason": data.reason},
    })
    return doc

def get_timeline(application_id: str) -> list:
    result = logs_col.find({"application_id" : application_id}).sort("at", 1)
    return list(result)

def get_applications_for_applicant(applicant_id: str) -> list:
    # TODO: confirm field name with zaid — assuming applicant_ref.applicant_id
    result = applications_col.find({"applicant_ref.applicant_id": applicant_id})
    return list(result)