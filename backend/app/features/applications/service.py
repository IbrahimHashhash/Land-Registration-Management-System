from datetime import datetime, timezone
from math import ceil
from bson import ObjectId
from fastapi import HTTPException
from app.database import (
    applications_col, certificates_col, logs_col, documents_col, survey_reports_col,
)
from app.features.applications.workflow import ALLOWED_NEXT, TIMESTAMP_FIELD, TRANSITION_RULES_VERSION
from app.features.applications.schemas import (
    ApplicationCreate, TransitionRequest, HoldRequest, RejectRequest, CertificateRequest,
)
from app.utils.ids import next_application_id, next_certificate_id
from app.utils.notifications import (
    notify_status_change, notify_missing_documents, notify_certificate_ready,
)

ALL_STATUSES = "All Statuses"
ALL_TYPES = "All Types"
ALL_ZONES = "All Zones"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _clean(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items()}
    return value


def _public(doc: dict) -> dict:
    if not doc:
        return doc
    return _clean(dict(doc))


def _log_event(application_id: str, event_type: str, actor_type: str, actor_id, meta: dict) -> None:
    logs_col.update_one(
        {"application_id": application_id},
        {
            "$push": {"event_stream": {
                "type": event_type,
                "by": {"actor_type": actor_type, "actor_id": actor_id},
                "at": _now(),
                "meta": meta,
            }},
            "$setOnInsert": {"application_id": application_id, "computed_kpis": {}},
        },
        upsert=True,
    )


def create_application(data: ApplicationCreate, idempotency_key: str | None = None) -> dict:
    if idempotency_key:
        existing = applications_col.find_one({"idempotency_key": idempotency_key})
        if existing:
            return _public(existing)

    now = _now()
    application_id = next_application_id()
    doc = {
        "application_id": application_id,
        "idempotency_key": idempotency_key,
        "application_type": data.application_type,
        "priority": data.priority,
        "status": "submitted",
        "applicant_ref": {
            "applicant_id": data.applicant_ref.applicant_id,
            "applicant_type": data.applicant_ref.applicant_type,
            "submitted_by_representative": data.applicant_ref.submitted_by_representative,
        },
        "parcel": {
            "parcel_no": data.parcel.parcel_no,
            "block_no": data.parcel.block_no,
            "basin_no": data.parcel.basin_no,
            "zone_id": data.parcel.zone_id,
            "geometry": data.parcel.geometry,
        },
        "description": data.description,
        "tags": data.tags,
        "required_documents": [d.model_dump() for d in data.required_documents],
        "workflow": {
            "current_state": "submitted",
            "allowed_next": ALLOWED_NEXT["submitted"],
            "transition_rules_version": TRANSITION_RULES_VERSION,
        },
        "assignment": {
            "assigned_surveyor_id": None,
            "assigned_registrar_id": None,
            "assignment_policy": "zone+workload+availability",
        },
        "objection": {"has_objection": False, "objection_ids": []},
        "internal": {"notes": [], "visibility": "staff_only"},
        "timestamps": {
            "submitted_at": now,
            "pre_checked_at": None,
            "survey_required_at": None,
            "surveyed_at": None,
            "legal_review_at": None,
            "approved_at": None,
            "certificate_issued_at": None,
            "closed_at": None,
            "updated_at": now,
        },
        "submission_date": now,
        "comments": [],
    }
    applications_col.insert_one(doc)
    _log_event(application_id, "submitted", "applicant", data.applicant_ref.applicant_id, {"channel": "web"})
    return _public(doc)


def get_application(application_id: str) -> dict:
    doc = applications_col.find_one({"application_id": application_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")
    return _public(doc)


def list_applications(status, application_type, zone_id, search, sort_by, order, page, page_size) -> dict:
    query: dict = {}
    if status and status not in ("", ALL_STATUSES):
        query["status"] = status
    if application_type and application_type not in ("", ALL_TYPES):
        query["application_type"] = application_type
    if zone_id and zone_id not in ("", ALL_ZONES):
        query["parcel.zone_id"] = zone_id
    if search:
        rx = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"application_id": rx},
            {"applicant_ref.applicant_id": rx},
            {"parcel.parcel_no": rx},
        ]

    total = applications_col.count_documents(query)
    direction = -1 if str(order).lower() == "desc" else 1
    cursor = (
        applications_col.find(query)
        .sort([(sort_by or "submission_date", direction)])
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    return {
        "items": [_public(d) for d in cursor],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, ceil(total / page_size)),
    }


def _check_rules(app: dict, target: str) -> None:
    application_id = app["application_id"]
    parcel = app.get("parcel") or {}

    if target == "pre_checked":
        applicant = app.get("applicant_ref") or {}
        if not applicant.get("applicant_id") or not parcel.get("parcel_no") or not parcel.get("zone_id"):
            raise HTTPException(status_code=400, detail="Applicant and parcel information must be complete")

    if target == "survey_required":
        if not parcel.get("parcel_no") or not parcel.get("zone_id"):
            raise HTTPException(status_code=400, detail="Parcel location is not valid")
        geometry = parcel.get("geometry") or {}
        if not geometry or not geometry.get("type") or not geometry.get("coordinates"):
            raise HTTPException(status_code=400, detail="Parcel location is not valid: geometry is required")

    if target == "surveyed":
        if not survey_reports_col.find_one({"application_id": application_id}):
            raise HTTPException(status_code=400, detail="A survey report is required before marking surveyed")

    if target == "legal_review":
        if documents_col.count_documents({"application_id": application_id}) == 0:
            raise HTTPException(status_code=400, detail="Ownership documents must be uploaded before legal review")


def transition(application_id: str, data: TransitionRequest) -> dict:
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    current = app.get("status")
    target = data.to_state
    if target not in ALLOWED_NEXT.get(current, []):
        raise HTTPException(status_code=400, detail=f"Cannot move from {current} to {target}")
    if target == "rejected" and not data.reason:
        raise HTTPException(status_code=400, detail="A rejection reason is required")

    _check_rules(app, target)

    now = _now()
    update = {"$set": {
        "status": target,
        "workflow.current_state": target,
        "workflow.allowed_next": ALLOWED_NEXT[target],
        "timestamps.updated_at": now,
    }}
    if target in TIMESTAMP_FIELD:
        update["$set"][f"timestamps.{TIMESTAMP_FIELD[target]}"] = now
    if target == "rejected":
        update["$set"]["rejection_reason"] = data.reason
    if data.note:
        update["$push"] = {"internal.notes": data.note}

    applications_col.update_one({"application_id": application_id}, update)
    _log_event(application_id, target, "staff", data.actor_id, {"from": current, "note": data.note})

    applicant_id = (app.get("applicant_ref") or {}).get("applicant_id")
    if target == "missing_documents":
        notify_missing_documents(applicant_id, application_id)
    else:
        notify_status_change(applicant_id, application_id, target)

    return _public(applications_col.find_one({"application_id": application_id}))


def hold(application_id: str, data: HoldRequest) -> dict:
    if not data.reason or not data.reason.strip():
        raise HTTPException(status_code=400, detail="A hold reason is required")
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") in ("closed", "rejected", "certificate_issued"):
        raise HTTPException(status_code=400, detail="Application can no longer be placed on hold")

    now = _now()
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {
            "status": "on_hold",
            "previous_state": app.get("status"),
            "hold_reason": data.reason,
            "workflow.current_state": "on_hold",
            "workflow.allowed_next": ALLOWED_NEXT["on_hold"],
            "timestamps.updated_at": now,
        }},
    )
    _log_event(application_id, "on_hold", "staff", data.actor_id, {"reason": data.reason})
    return _public(applications_col.find_one({"application_id": application_id}))


def reject(application_id: str, data: RejectRequest) -> dict:
    if not data.reason or not data.reason.strip():
        raise HTTPException(status_code=400, detail="A rejection reason is required")
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") in ("closed", "rejected", "certificate_issued"):
        raise HTTPException(status_code=400, detail="Application can no longer be rejected")

    now = _now()
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": data.reason,
            "workflow.current_state": "rejected",
            "workflow.allowed_next": ALLOWED_NEXT["rejected"],
            "timestamps.updated_at": now,
        }},
    )
    _log_event(application_id, "rejected", "registrar", data.actor_id, {"reason": data.reason})
    return _public(applications_col.find_one({"application_id": application_id}))


def issue_certificate(application_id: str, data: CertificateRequest) -> dict:
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Certificate can only be issued for approved applications")

    now = _now()
    certificate_id = next_certificate_id()
    cert = {
        "certificate_id": certificate_id,
        "application_id": application_id,
        "parcel_id": (app.get("parcel") or {}).get("parcel_id"),
        "certificate_type": data.certificate_type,
        "status": "issued",
        "issued_to": {
            "applicant_id": (app.get("applicant_ref") or {}).get("applicant_id"),
            "full_name": data.full_name,
        },
        "issued_at": now,
        "issued_by": data.issued_by,
        "verification": {
            "qr_code_url": f"/certificates/{certificate_id}/verify",
            "digital_signature_stub": "signed_hash_example",
        },
    }
    certificates_col.insert_one(cert)
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {
            "status": "certificate_issued",
            "workflow.current_state": "certificate_issued",
            "workflow.allowed_next": ALLOWED_NEXT["certificate_issued"],
            "certificate_ref": certificate_id,
            "timestamps.certificate_issued_at": now,
            "timestamps.updated_at": now,
        }},
    )
    _log_event(application_id, "certificate_issued", "registrar", data.issued_by, {"certificate_id": certificate_id})

    applicant_id = (app.get("applicant_ref") or {}).get("applicant_id")
    notify_certificate_ready(applicant_id, application_id, certificate_id)

    return _public(cert)
