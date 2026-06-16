from fastapi import APIRouter
from app.features.applicants.schemas import ApplicantCreate, ApplicantPublic
from app.features.applicants.service import create_applicant, get_applicant

router = APIRouter(prefix="/applicants", tags=["Applicants"])


@router.post("/", response_model=ApplicantPublic, status_code=201)
def register_applicant(data: ApplicantCreate):
    return create_applicant(data)


@router.get("/{applicant_id}", response_model=ApplicantPublic)
def fetch_applicant(applicant_id: str):
    return get_applicant(applicant_id)
