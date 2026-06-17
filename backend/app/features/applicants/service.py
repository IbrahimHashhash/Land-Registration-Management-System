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
        "applicant_type": data.applicant_type,
        "verification_state": "unverified",
        "identity": {
            "national_id": data.identity.national_id,
            "verified": False,
            "verification_method": "otp_stub",
        },
        "contacts": {
            "email": data.contacts.email,
            "phone": data.contacts.phone,
        },
        "address": {
            "city": data.address.city,
            "neighborhood": data.address.neighborhood,
            "zone_id": data.address.zone_id,
        },
        "preferences": {
            "preferred_contact": data.preferences.preferred_contact,
            "language": data.preferences.language,
            "notifications": {
                "on_status_change": data.preferences.notifications.on_status_change,
                "on_missing_documents": data.preferences.notifications.on_missing_documents,
                "on_certificate_ready": data.preferences.notifications.on_certificate_ready,
            },
        },
        "profile_public": data.profile_public,
        "stats": {"total_applications": 0, "approved_applications": 0, "pending_applications": 0},
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
    logs_col.update_one(
        {"application_id": application_id},
        {"$push": {"event_stream": {
            "type": "document_uploaded",
            "by": {"actor_type": "applicant", "actor_id": None},
            "at": now,
            "meta": {"document_id": doc["document_id"], "document_type": data.document_type},
        }}, "$setOnInsert": {"application_id": application_id, "computed_kpis": {}}},
        upsert=True
    )
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
    logs_col.update_one(
        {"application_id": application_id},
        {"$push": {"event_stream": {
            "type": "objection_submitted",
            "by": {"actor_type": "applicant", "actor_id": data.author_id},
            "at": now,
            "meta": {"objection_id": doc["objection_id"], "reason": data.reason},
        }}, "$setOnInsert": {"application_id": application_id, "computed_kpis": {}}},
        upsert=True
    )
    return doc

def get_timeline(application_id: str) -> list:
    log = logs_col.find_one({"application_id": application_id})
    if not log:
        return []
    events = log.get("event_stream", [])
    return sorted(events, key=lambda e: e["at"])

def get_applications_for_applicant(applicant_id: str) -> list:
    # TODO: confirm field name with zaid — assuming applicant_ref.applicant_id
    result = applications_col.find({"applicant_ref.applicant_id": applicant_id})
    return list(result)