from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.features.applicants.schemas import (
    ApplicantCreate, ApplicantPublic, ApplicationSummary, ObjectionResponse,
    VerificationStateUpdate,
)
from app.features.applicants.service import (
    create_applicant, get_applicant, get_applications_for_applicant,
    get_applicant_by_national_id, list_objections_for_applicant,
    update_verification_state,
)
from app.dependencies import require_staff_role

router = APIRouter(prefix="/applicants", tags=["Applicants"])


@router.post("/", response_model=ApplicantPublic, status_code=201)
def register_applicant(data: ApplicantCreate):
    return create_applicant(data)


@router.get("/by-national-id/{national_id}", response_model=ApplicantPublic)
def lookup_applicant(national_id: str):
    doc = get_applicant_by_national_id(national_id)
    if not doc:
        raise HTTPException(status_code=404, detail="No applicant with that national ID")
    return doc


@router.get("/{applicant_id}", response_model=ApplicantPublic)
def fetch_applicant(applicant_id: str):
    return get_applicant(applicant_id)


@router.patch(
    "/{applicant_id}/verification-state",
    response_model=ApplicantPublic,
    dependencies=[Depends(require_staff_role)],
)
def patch_verification_state(applicant_id: str, data: VerificationStateUpdate):
    return update_verification_state(applicant_id, data.verification_state)


@router.get("/{applicant_id}/applications", response_model=List[ApplicationSummary])
def get_applications(applicant_id: str):
    return get_applications_for_applicant(applicant_id)


@router.get("/{applicant_id}/objections", response_model=List[ObjectionResponse])
def get_objections(applicant_id: str):
    return list_objections_for_applicant(applicant_id)
