from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.features.staff.schemas import StaffCreate, StaffOut, SurveyTaskOut, ReassignRequest
from app.features.staff import service
from app.features.staff.assignment import find_best_surveyor
from app.database import applications_col

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.post("/", response_model=StaffOut, status_code=201)
def create_staff(payload: StaffCreate):
    doc = service.create_staff(payload.model_dump())
    doc["id"] = str(doc["_id"])
    return doc


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff(staff_id: str):
    doc = service.get_staff_by_id(staff_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Staff not found")
    doc["id"] = str(doc["_id"])
    return doc


def _serialize_task(task: dict) -> dict:
    task["id"] = str(task["_id"])
    task["application_id"] = str(task["application_id"])
    task["parcel_id"] = str(task["parcel_id"])
    task["assigned_surveyor_id"] = str(task["assigned_surveyor_id"])
    return task


@router.post("/applications/{application_id}/auto-assign-surveyor", response_model=SurveyTaskOut, status_code=201)
def auto_assign_surveyor(application_id: str):
    app = applications_col.find_one({"_id": ObjectId(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") != "survey_required":
        raise HTTPException(status_code=400, detail="Application not in survey_required state")

    zone_id = app["parcel_ref"]["zone_id"]
    app_type = app.get("application_type", "")
    priority = app.get("priority", "normal")

    surveyor = find_best_surveyor(zone_id, app_type, priority)
    if not surveyor:
        raise HTTPException(status_code=404, detail="No available surveyor found")

    task = service.create_survey_task(application_id, str(surveyor["_id"]), str(app["parcel_ref"]["parcel_id"]))
    return _serialize_task(task)


@router.patch("/applications/{application_id}/reassign-surveyor", response_model=SurveyTaskOut)
def reassign_surveyor(application_id: str, payload: ReassignRequest):
    new_surveyor = service.get_staff_by_id(payload.new_surveyor_id)
    if not new_surveyor:
        raise HTTPException(status_code=404, detail="New surveyor not found")
    if new_surveyor.get("role") != "surveyor":
        raise HTTPException(status_code=400, detail="Staff member is not a surveyor")

    task = service.reassign_survey_task(application_id, payload.new_surveyor_id)
    if not task:
        raise HTTPException(status_code=404, detail="No survey task found for this application")
    return _serialize_task(task)
