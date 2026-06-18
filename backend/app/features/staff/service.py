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
