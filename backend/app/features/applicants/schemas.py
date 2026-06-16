from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

class ApplicantCreate(BaseModel):
    full_name: str
    national_id: str
    applicant_type: Literal["citizen", "lawyer", "company", "surveyor", "authorized_representative"]
    email: str
    phone: str
    city: str
    address: str
    preferred_language: Literal["ar", "en"] = "ar"
    notify_by_email: bool = True
    notify_by_sms: bool = False
