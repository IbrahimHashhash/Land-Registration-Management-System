from datetime import datetime, timezone
from bson import ObjectId
from app.database import staff_col, survey_tasks_col, applications_col, logs_col, survey_reports_col


def _log_event(application_id: str, event_type: str, actor_type: str, actor_id: str, meta: dict) -> None:
    logs_col.update_one(
        {"application_id": application_id},
        {
            "$push": {"event_stream": {
                "type": event_type,
                "by": {"actor_type": actor_type, "actor_id": actor_id},
                "at": datetime.now(timezone.utc),
                "meta": meta,
            }},
            "$setOnInsert": {"application_id": application_id, "computed_kpis": {}},
        },
        upsert=True,
    )


def create_staff(data: dict) -> dict:
    data["created_at"] = datetime.now(timezone.utc)
    result = staff_col.insert_one(data)
    data["_id"] = result.inserted_id
    return data


def get_staff_by_id(staff_id: str) -> dict | None:
    staff = staff_col.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        return None
    if staff.get("role") == "surveyor":
        assigned = survey_tasks_col.count_documents({"assigned_surveyor_id": ObjectId(staff_id)})
        completed = survey_tasks_col.count_documents({
            "assigned_surveyor_id": ObjectId(staff_id),
            "status": {"$in": ["report_uploaded", "registrar_reviewed"]},
        })
        staff["performance"] = {"assigned_tasks": assigned, "completed_tasks": completed}
    else:
        reviewed = applications_col.count_documents({"assignment.assigned_registrar_id": staff_id})
        staff["performance"] = {"reviewed_applications": reviewed}
    return staff


def get_tasks_by_surveyor(staff_id: str) -> list:
    tasks = list(survey_tasks_col.find({"assigned_surveyor_id": ObjectId(staff_id)}))
    for t in tasks:
        app = applications_col.find_one({"application_id": t["application_id"]})
        if app:
            parcel_ref = app.get("parcel_ref", {})
            t["parcel_number"] = parcel_ref.get("parcel_number")
            t["zone"] = parcel_ref.get("zone_id")
            t["priority"] = app.get("priority")
    return tasks


def add_field_note(application_id: str, note: str, by: str) -> dict | None:
    task = survey_tasks_col.find_one({"application_id": application_id})
    if not task:
        return None
    survey_tasks_col.update_one({"_id": task["_id"]}, {"$push": {"field_notes": note}})
    return survey_tasks_col.find_one({"_id": task["_id"]})


def create_survey_task(application_id: str, surveyor_id: str, parcel_id: str) -> dict:
    count = survey_tasks_col.count_documents({})
    task_id = f"SURV-2026-{count + 1:04d}"

    now = datetime.now(timezone.utc)
    task = {
        "task_id": task_id,
        "application_id": application_id,
        "parcel_id": ObjectId(parcel_id) if parcel_id else None,
        "assigned_surveyor_id": ObjectId(surveyor_id),
        "status": "assigned",
        "milestones": [{"type": "assigned", "at": now, "by": "system", "meta": {"reason": "zone and workload match"}}],
        "field_notes": [],
        "report_uploaded": False,
        "created_at": now,
    }
    result = survey_tasks_col.insert_one(task)
    task["_id"] = result.inserted_id

    staff_col.update_one({"_id": ObjectId(surveyor_id)}, {"$inc": {"workload.active_tasks": 1}})
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {"assignment.assigned_surveyor_id": surveyor_id, "timestamps.updated_at": now}},
    )

    surveyor = staff_col.find_one({"_id": ObjectId(surveyor_id)}, {"staff_code": 1})
    _log_event(application_id, "survey_assigned", "system", "assignment_engine",
               {"assigned_surveyor": surveyor.get("staff_code") if surveyor else surveyor_id})
    return task


def reassign_survey_task(application_id: str, new_surveyor_id: str) -> dict | None:
    task = survey_tasks_col.find_one({"application_id": application_id})
    if not task:
        return None

    old_surveyor_id = task["assigned_surveyor_id"]
    now = datetime.now(timezone.utc)

    survey_tasks_col.update_one(
        {"_id": task["_id"]},
        {
            "$set": {"assigned_surveyor_id": ObjectId(new_surveyor_id)},
            "$push": {"milestones": {"type": "reassigned", "at": now, "by": "staff", "meta": {"previous_surveyor": str(old_surveyor_id)}}},
        },
    )

    staff_col.update_one({"_id": old_surveyor_id}, {"$inc": {"workload.active_tasks": -1}})
    staff_col.update_one({"_id": ObjectId(new_surveyor_id)}, {"$inc": {"workload.active_tasks": 1}})
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {"assignment.assigned_surveyor_id": new_surveyor_id, "timestamps.updated_at": now}},
    )

    _log_event(application_id, "survey_reassigned", "staff", new_surveyor_id, {"previous_surveyor": str(old_surveyor_id)})
    return survey_tasks_col.find_one({"_id": task["_id"]})


def update_milestone(application_id: str, milestone_type: str, by: str, meta: dict) -> dict | None:
    from app.features.staff.schemas import MILESTONE_ORDER

    task = survey_tasks_col.find_one({"application_id": application_id})
    if not task:
        return None

    current_types = [m["type"] for m in task.get("milestones", [])]
    current_index = max((MILESTONE_ORDER.index(t) for t in current_types if t in MILESTONE_ORDER), default=-1)
    new_index = MILESTONE_ORDER.index(milestone_type)
    if new_index <= current_index:
        return None

    now = datetime.now(timezone.utc)
    milestone = {"type": milestone_type, "at": now, "by": by, "meta": meta}

    survey_tasks_col.update_one(
        {"_id": task["_id"]},
        {"$set": {"status": milestone_type}, "$push": {"milestones": milestone}},
    )
    _log_event(application_id, milestone_type, "surveyor", by, meta)
    return survey_tasks_col.find_one({"_id": task["_id"]})


def create_survey_report(application_id: str, data: dict) -> dict | None:
    task = survey_tasks_col.find_one({"application_id": application_id})
    if not task:
        return None

    now = datetime.now(timezone.utc)
    report = {
        "task_id": task["task_id"],
        "application_id": application_id,
        "report_title": data["report_title"],
        "file_path": data.get("file_path"),
        "findings": data.get("findings"),
        "uploaded_by": data["uploaded_by"],
        "uploaded_at": now,
    }
    result = survey_reports_col.insert_one(report)
    report["_id"] = result.inserted_id

    survey_tasks_col.update_one(
        {"_id": task["_id"]},
        {
            "$set": {"status": "report_uploaded", "report_uploaded": True},
            "$push": {"milestones": {"type": "report_uploaded", "at": now, "by": data["uploaded_by"], "meta": {}}},
        },
    )
    applications_col.update_one(
        {"application_id": application_id},
        {"$set": {"status": "surveyed", "timestamps.surveyed_at": now, "timestamps.updated_at": now}},
    )
    _log_event(application_id, "report_uploaded", "surveyor", data["uploaded_by"], {"report_title": data["report_title"]})
    return report


def registrar_review(application_id: str, decision: str, reviewed_by: str, notes: str | None, rejection_reason: str | None) -> dict | None:
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        return None

    now = datetime.now(timezone.utc)
    update: dict = {
        "$set": {
            "status": decision,
            "assignment.assigned_registrar_id": reviewed_by,
            "timestamps.updated_at": now,
        }
    }

    if notes:
        update["$push"] = {"internal.notes": notes}

    if decision == "rejected" and rejection_reason:
        update["$set"]["rejection_reason"] = rejection_reason

    applications_col.update_one({"application_id": application_id}, update)

    task = survey_tasks_col.find_one({"application_id": application_id})
    if task:
        survey_tasks_col.update_one(
            {"_id": task["_id"]},
            {
                "$set": {"status": "registrar_reviewed"},
                "$push": {"milestones": {"type": "registrar_reviewed", "at": now, "by": reviewed_by, "meta": {"decision": decision}}},
            },
        )

    _log_event(application_id, "registrar_reviewed", "registrar", reviewed_by, {"decision": decision})
    return applications_col.find_one({"application_id": application_id})
