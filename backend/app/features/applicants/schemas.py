from pydantic import BaseModel
from typing import Literal, List, Optional

class ApplicantCreate(BaseModel):
    full_name: str
    national_id: str
    applicant_type: Literal["citizen", "lawyer", "company", "surveyor", "authorized_representative"]
    email: str
    phone: str
    city: str
    neighborhood: str
    address: str
    zone_id: str
    preferred_language: Literal["ar", "en"] = "ar"
    preferred_contact: Literal["email", "phone"] = "email"
    notify_by_email: bool = True
    notify_by_sms: bool = False
    profile_public: bool = False
