from pymongo import MongoClient, ASCENDING, GEOSPHERE
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

applicants_col   = db["applicants"]
documents_col    = db["application_documents"]
objections_col   = db["objections"]
logs_col         = db["performance_logs"]
applications_col = db["land_applications"]
staff_col        = db["staff_members"]
survey_tasks_col = db["survey_tasks"]
survey_reports_col = db["survey_reports"]
parcels_col      = db["parcels"]
certificates_col = db["certificates"]


def _ensure_index(col, keys, **kwargs):
    try:
        col.create_index(keys, **kwargs)
    except Exception:
        pass


_ensure_index(applicants_col, "identity.national_id", unique=True)
_ensure_index(documents_col, "application_id")
_ensure_index(objections_col, "application_id")
_ensure_index(logs_col, "application_id", unique=True)
_ensure_index(staff_col, "staff_code", unique=True)
_ensure_index(survey_tasks_col, "application_id")

_ensure_index(applications_col, "application_id", unique=True)
_ensure_index(applications_col, "status")
_ensure_index(applications_col, "application_type")
_ensure_index(applications_col, "parcel.zone_id")
_ensure_index(applications_col, "submission_date")

_ensure_index(parcels_col, "parcel_code", unique=True)
_ensure_index(parcels_col, "zone_id")
_ensure_index(parcels_col, [("geometry", GEOSPHERE)])

_ensure_index(certificates_col, "certificate_id", unique=True)
