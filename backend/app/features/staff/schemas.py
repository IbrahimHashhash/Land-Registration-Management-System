from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Shift(BaseModel):
    day: str
    start: str
    end: str


class Schedule(BaseModel):
    timezone: str = "Asia/Jerusalem"
    shifts: list[Shift] = []
    on_call: bool = False


class GeoFence(BaseModel):
    type: str = "Polygon"
    coordinates: list = []


class Coverage(BaseModel):
    zone_ids: list[str] = []
    geo_fence: Optional[GeoFence] = None


class Workload(BaseModel):
    active_tasks: int = 0
    max_tasks: int = 10


class Contacts(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None


class StaffCreate(BaseModel):
    staff_code: str
    name: str
    role: str = Field(..., pattern="^(surveyor|registrar)$")
    department: Optional[str] = None
    skills: list[str] = []
    coverage: Coverage = Coverage()
    schedule: Schedule = Schedule()
    workload: Workload = Workload()
    contacts: Contacts = Contacts()
    active: bool = True


class StaffOut(BaseModel):
    id: str
    staff_code: str
    name: str
    role: str
    department: Optional[str] = None
    skills: list[str] = []
    coverage: Coverage = Coverage()
    schedule: Schedule = Schedule()
    workload: Workload = Workload()
    contacts: Contacts = Contacts()
    active: bool = True
    created_at: Optional[datetime] = None



class Milestone(BaseModel):
    type: str
    at: datetime
    by: str
    meta: dict = {}


class SurveyTaskOut(BaseModel):
    id: str
    task_id: str
    application_id: str
    parcel_id: str
    assigned_surveyor_id: str
    status: str
    milestones: list[Milestone] = []
    field_notes: list[str] = []
    report_uploaded: bool = False
    created_at: Optional[datetime] = None


class ReassignRequest(BaseModel):
    new_surveyor_id: str
