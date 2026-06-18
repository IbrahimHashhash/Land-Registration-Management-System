from datetime import datetime, timezone
from bson import ObjectId
from app.database import staff_col, survey_tasks_col, applications_col


def create_staff(data: dict) -> dict:
    data["created_at"] = datetime.now(timezone.utc)
    result = staff_col.insert_one(data)
    data["_id"] = result.inserted_id
    return data


def get_staff_by_id(staff_id: str) -> dict | None:
    return staff_col.find_one({"_id": ObjectId(staff_id)})


def get_tasks_by_surveyor(staff_id: str) -> list:
    return list(survey_tasks_col.find({"assigned_surveyor_id": ObjectId(staff_id)}))



def create_survey_task(application_id: str, surveyor_id: str, parcel_id: str) -> dict:
    count = survey_tasks_col.count_documents({})
    task_id = f"SURV-2026-{count + 1:04d}"

    now = datetime.now(timezone.utc)
    task = {
        "task_id": task_id,
        "application_id": ObjectId(application_id),
        "parcel_id": ObjectId(parcel_id),
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
        {"_id": ObjectId(application_id)},
        {"$set": {"assignment.assigned_surveyor_id": surveyor_id, "timestamps.updated_at": now}},
    )
    return task


def reassign_survey_task(application_id: str, new_surveyor_id: str) -> dict | None:
    task = survey_tasks_col.find_one({"application_id": ObjectId(application_id)})
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
        {"_id": ObjectId(application_id)},
        {"$set": {"assignment.assigned_surveyor_id": new_surveyor_id, "timestamps.updated_at": now}},
    )

    return survey_tasks_col.find_one({"_id": task["_id"]})



def update_milestone(application_id: str, milestone_type: str, by: str, meta: dict) -> dict | None:
    from app.features.staff.schemas import MILESTONE_ORDER

    task = survey_tasks_col.find_one({"application_id": ObjectId(application_id)})
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
    return survey_tasks_col.find_one({"_id": task["_id"]})


def create_survey_report(application_id: str, data: dict) -> dict | None:
    from app.database import survey_reports_col

    task = survey_tasks_col.find_one({"application_id": ObjectId(application_id)})
    if not task:
        return None

    now = datetime.now(timezone.utc)
    report = {
        "task_id": task["task_id"],
        "application_id": ObjectId(application_id),
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
        {"_id": ObjectId(application_id)},
        {"$set": {"status": "surveyed", "timestamps.surveyed_at": now, "timestamps.updated_at": now}},
    )
    return report



def registrar_review(application_id: str, decision: str, reviewed_by: str, notes: str | None, rejection_reason: str | None) -> dict | None:
    app = applications_col.find_one({"_id": ObjectId(application_id)})
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
        update.setdefault("$push", {})
        update["$push"]["internal.notes"] = notes

    if decision == "rejected" and rejection_reason:
        update["$set"]["rejection_reason"] = rejection_reason

    applications_col.update_one({"_id": ObjectId(application_id)}, update)

    task = survey_tasks_col.find_one({"application_id": ObjectId(application_id)})
    if task:
        survey_tasks_col.update_one(
            {"_id": task["_id"]},
            {
                "$set": {"status": "registrar_reviewed"},
                "$push": {"milestones": {"type": "registrar_reviewed", "at": now, "by": reviewed_by, "meta": {"decision": decision}}},
            },
        )

    return applications_col.find_one({"_id": ObjectId(application_id)})
