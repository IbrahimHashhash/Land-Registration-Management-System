from fastapi import APIRouter, HTTPException
from app.features.staff.schemas import StaffCreate, StaffOut
from app.features.staff import service

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
