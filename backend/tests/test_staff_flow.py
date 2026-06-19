import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bson import ObjectId
from fastapi.testclient import TestClient
from app.main import app
from app.database import applications_col, staff_col, survey_tasks_col, survey_reports_col, logs_col, db

client = TestClient(app)

SURVEYOR_HDR = {"X-Staff-Role": "surveyor"}
REGISTRAR_HDR = {"X-Staff-Role": "registrar"}

APP_ID = "LRMIS-TEST-9001"
TEST_PARCEL_ID = ObjectId("675100000000000000009201")
TEST_STAFF_CODE = "TEST-SURV-99"
parcels_col = db["parcels"]


def cleanup():
    staff = staff_col.find_one({"staff_code": TEST_STAFF_CODE})
    if staff:
        survey_tasks_col.delete_many({"assigned_surveyor_id": staff["_id"]})
        staff_col.delete_one({"_id": staff["_id"]})
    survey_tasks_col.delete_many({"application_id": APP_ID})
    survey_reports_col.delete_many({"application_id": APP_ID})
    applications_col.delete_one({"application_id": APP_ID})
    parcels_col.delete_one({"_id": TEST_PARCEL_ID})
    logs_col.delete_one({"application_id": APP_ID})


def seed():
    parcels_col.insert_one({
        "_id": TEST_PARCEL_ID, "parcel_code": "TEST-Z99-P1", "parcel_number": "999",
        "zone_id": "ZONE-TEST-99", "registration_status": "pending", "dispute_state": "none",
        "geometry": {"type": "Polygon", "coordinates": [[[35.2, 31.9], [35.21, 31.9], [35.21, 31.91], [35.2, 31.91], [35.2, 31.9]]]},
    })
    applications_col.insert_one({
        "_id": ObjectId(), "application_id": APP_ID, "application_type": "first_registration",
        "status": "survey_required", "priority": "high",
        "parcel_ref": {"parcel_id": TEST_PARCEL_ID, "parcel_number": "999", "zone_id": "ZONE-TEST-99"},
        "assignment": {"assigned_surveyor_id": None, "assigned_registrar_id": None},
        "timestamps": {"submitted_at": datetime(2026, 5, 1, tzinfo=timezone.utc)},
    })


def run():
    cleanup()
    seed()
    results = []

    def check(name, cond):
        results.append((name, cond))
        print(("PASS" if cond else "FAIL"), "-", name)

    r = client.get(f"/staff/{TEST_STAFF_CODE}")
    check("access control blocks missing header (403)", r.status_code == 403)
    r = client.post(f"/applications/{APP_ID}/auto-assign-surveyor")
    check("access control blocks app-scoped action without header (403)", r.status_code == 403)

    payload = {
        "staff_code": TEST_STAFF_CODE, "name": "Test Surveyor", "role": "surveyor",
        "skills": ["boundary_survey", "gps_mapping"],
        "coverage": {"zone_ids": ["ZONE-TEST-99"]},
        "schedule": {"shifts": [], "on_call": True},
        "workload": {"active_tasks": 0, "max_tasks": 5},
    }
    r = client.post("/staff/", json=payload, headers=SURVEYOR_HDR)
    check("create surveyor (201)", r.status_code == 201)
    staff_id = r.json()["id"]

    r = client.get(f"/staff/{staff_id}", headers=SURVEYOR_HDR)
    check("get staff returns performance summary", r.status_code == 200 and r.json().get("performance") is not None)

    r = client.post(f"/applications/{APP_ID}/auto-assign-surveyor", headers=SURVEYOR_HDR)
    check("auto-assign surveyor (201)", r.status_code == 201)
    check("assigned surveyor matches test surveyor", r.json().get("assigned_surveyor_id") == staff_id)
    check("task application_id is business string", r.json().get("application_id") == APP_ID)
    check("task status is assigned", r.json().get("status") == "assigned")

    r = client.patch(f"/applications/{APP_ID}/survey-milestone", json={"type": "visit_scheduled", "by": "surveyor", "meta": {"scheduled_date": "2026-05-05"}}, headers=SURVEYOR_HDR)
    check("milestone visit_scheduled (200)", r.status_code == 200 and r.json()["status"] == "visit_scheduled")

    r = client.patch(f"/applications/{APP_ID}/survey-milestone", json={"type": "visit_scheduled", "by": "surveyor", "meta": {}}, headers=SURVEYOR_HDR)
    check("milestone cannot repeat/go backward (400)", r.status_code == 400)

    for m in ["arrived_on_site", "survey_started", "survey_completed"]:
        client.patch(f"/applications/{APP_ID}/survey-milestone", json={"type": m, "by": "surveyor", "meta": {}}, headers=SURVEYOR_HDR)

    r = client.post(f"/applications/{APP_ID}/field-note", json={"note": "Boundary marker found at NE corner", "by": "surveyor"}, headers=SURVEYOR_HDR)
    check("add field note (201)", r.status_code == 201 and "Boundary marker found at NE corner" in r.json()["field_notes"])

    r = client.post(f"/applications/{APP_ID}/survey-report", json={"report_title": "Field Survey 999", "findings": "All clear", "uploaded_by": "surveyor"}, headers=SURVEYOR_HDR)
    check("upload survey report (201)", r.status_code == 201 and r.json()["application_id"] == APP_ID)
    check("application moved to surveyed", applications_col.find_one({"application_id": APP_ID})["status"] == "surveyed")

    r = client.get(f"/staff/{staff_id}/tasks", headers=SURVEYOR_HDR)
    task = r.json()[0]
    check("task enriched with parcel_number/zone/priority", task["parcel_number"] == "999" and task["zone"] == "ZONE-TEST-99" and task["priority"] == "high")

    r = client.patch(f"/applications/{APP_ID}/registrar-review", json={"decision": "rejected", "reviewed_by": "REG-TEST"}, headers=REGISTRAR_HDR)
    check("registrar review rejection requires reason (400)", r.status_code == 400)

    r = client.patch(f"/applications/{APP_ID}/registrar-review", json={"decision": "approved", "reviewed_by": "REG-TEST", "notes": "Looks good"}, headers=REGISTRAR_HDR)
    check("registrar review approved (200)", r.status_code == 200 and r.json()["status"] == "approved")

    log = logs_col.find_one({"application_id": APP_ID})
    event_types = [e["type"] for e in log["event_stream"]] if log else []
    check("audit log keyed by business string application_id", log is not None)
    check("audit log records survey_assigned", "survey_assigned" in event_types)
    check("audit log records report_uploaded", "report_uploaded" in event_types)
    check("audit log records registrar_reviewed", "registrar_reviewed" in event_types)

    cleanup()

    passed = sum(1 for _, c in results if c)
    print(f"\n{passed}/{len(results)} checks passed")
    return passed == len(results)


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
