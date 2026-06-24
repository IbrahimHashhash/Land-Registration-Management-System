from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.features.staff.schemas import (
    StaffCreate, StaffOut, SurveyTaskOut, ReassignRequest, MilestoneUpdate,
    SurveyReportCreate, SurveyReportOut, RegistrarReviewRequest, FieldNoteCreate,
)
from app.features.staff import service
from app.features.staff.assignment import find_best_surveyor
from app.database import applications_col
from app.dependencies import require_staff_role
from app.utils.applications import parcel_of, parcel_zone_of

router = APIRouter(prefix="/staff", tags=["Staff"], dependencies=[Depends(require_staff_role)])
app_router = APIRouter(prefix="/applications", tags=["Surveyor & Registrar Actions"], dependencies=[Depends(require_staff_role)])


def _serialize_task(task: dict) -> dict:
    task["id"] = str(task["_id"])
    task["application_id"] = str(task["application_id"])
    task["parcel_id"] = str(task["parcel_id"]) if task.get("parcel_id") else None
    task["assigned_surveyor_id"] = str(task["assigned_surveyor_id"])
    return task


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


@router.get("/{staff_id}/tasks", response_model=list[SurveyTaskOut])
def get_surveyor_tasks(staff_id: str):
    tasks = service.get_tasks_by_surveyor(staff_id)
    return [_serialize_task(t) for t in tasks]


@app_router.post("/{application_id}/auto-assign-surveyor", response_model=SurveyTaskOut, status_code=201)
def auto_assign_surveyor(application_id: str):
    app = applications_col.find_one({"application_id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") != "survey_required":
        raise HTTPException(status_code=400, detail="Application not in survey_required state")

    surveyor = find_best_surveyor(parcel_zone_of(app), app.get("application_type", ""), app.get("priority", "normal"))
    if not surveyor:
        raise HTTPException(status_code=404, detail="No available surveyor found")

    parcel_id = parcel_of(app).get("parcel_id")
    task = service.create_survey_task(application_id, str(surveyor["_id"]), str(parcel_id) if parcel_id else None)
    return _serialize_task(task)


@app_router.patch("/{application_id}/reassign-surveyor", response_model=SurveyTaskOut)
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


@app_router.patch("/{application_id}/survey-milestone", response_model=SurveyTaskOut)
def update_survey_milestone(application_id: str, payload: MilestoneUpdate):
    task = service.update_milestone(application_id, payload.type, payload.by, payload.meta)
    if not task:
        raise HTTPException(status_code=400, detail="Invalid milestone transition or no task found")
    return _serialize_task(task)


@app_router.post("/{application_id}/survey-report", response_model=SurveyReportOut, status_code=201)
def upload_survey_report(application_id: str, payload: SurveyReportCreate):
    report = service.create_survey_report(application_id, payload.model_dump())
    if not report:
        raise HTTPException(status_code=404, detail="No survey task found for this application")
    report["id"] = str(report["_id"])
    return report


@app_router.post("/{application_id}/field-note", response_model=SurveyTaskOut, status_code=201)
def add_field_note(application_id: str, payload: FieldNoteCreate):
    task = service.add_field_note(application_id, payload.note, payload.by)
    if not task:
        raise HTTPException(status_code=404, detail="No survey task found for this application")
    return _serialize_task(task)


@app_router.patch("/{application_id}/registrar-review")
def registrar_review(application_id: str, payload: RegistrarReviewRequest):
    if payload.decision == "rejected" and not payload.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required")
    result = service.registrar_review(application_id, payload.decision, payload.reviewed_by, payload.notes, payload.rejection_reason)
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": result["status"], "application_id": application_id}
