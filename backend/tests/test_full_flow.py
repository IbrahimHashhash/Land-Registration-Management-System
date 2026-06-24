"""
End-to-end test suite for LRMIS.

Covers:
  Module 1  Land Applications + workflow rules
  Module 2  Applicant Portal (register, documents, comments, objections, timeline)
  Module 3  Staff (auto-assign, milestones, report, registrar-review, document verify)
  Module 4  Analytics (KPIs, geofeeds, exports)
  Cross    Access control, idempotency, certificate issuance

Requires a running MongoDB. Inserts/cleans up records prefixed TEST- so the
suite is repeatable and does not collide with seeded data.

Run:  python backend/tests/test_full_flow.py
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bson import ObjectId
from fastapi.testclient import TestClient
from app.main import app
from app.database import (
    applicants_col, applications_col, documents_col, objections_col, logs_col,
    parcels_col, staff_col, survey_tasks_col, survey_reports_col, certificates_col, db,
)

client = TestClient(app)
SURVEYOR_HDR  = {"X-Staff-Role": "surveyor"}
REGISTRAR_HDR = {"X-Staff-Role": "registrar"}

# ---- test data identifiers (prefixed TEST- for safe cleanup) -------------
TEST_NATIONAL_ID    = "TEST-NID-9001"
TEST_NATIONAL_ID_2  = "TEST-NID-9002"
TEST_STAFF_CODE     = "TEST-SURV-99"
TEST_REG_CODE       = "TEST-REG-99"
TEST_PARCEL_CODE    = "TEST-PARCEL-9001"

results = []
applicant_id = None
application_id = None


def check(name, cond, detail=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL"), "-", name, ("· " + detail) if detail and not cond else "")


def cleanup():
    # Find applicants by national_id; cascade delete their applications.
    test_applicants = list(applicants_col.find({"identity.national_id": {"$in": [TEST_NATIONAL_ID, TEST_NATIONAL_ID_2]}}))
    test_applicant_ids = [a["applicant_id"] for a in test_applicants]
    test_apps = list(applications_col.find({"applicant_ref.applicant_id": {"$in": test_applicant_ids}})) if test_applicant_ids else []
    test_app_ids = [a["application_id"] for a in test_apps]

    if test_app_ids:
        documents_col.delete_many({"application_id": {"$in": test_app_ids}})
        objections_col.delete_many({"application_id": {"$in": test_app_ids}})
        logs_col.delete_many({"application_id": {"$in": test_app_ids}})
        survey_tasks_col.delete_many({"application_id": {"$in": test_app_ids}})
        survey_reports_col.delete_many({"application_id": {"$in": test_app_ids}})
        certificates_col.delete_many({"application_id": {"$in": test_app_ids}})
        applications_col.delete_many({"application_id": {"$in": test_app_ids}})

    applicants_col.delete_many({"identity.national_id": {"$in": [TEST_NATIONAL_ID, TEST_NATIONAL_ID_2]}})
    staff_col.delete_many({"staff_code": {"$in": [TEST_STAFF_CODE, TEST_REG_CODE]}})
    parcels_col.delete_many({"parcel_code": TEST_PARCEL_CODE})


def seed_parcel():
    parcels_col.insert_one({
        "parcel_code": TEST_PARCEL_CODE,
        "parcel_number": "999",
        "block_number": "99",
        "basin_number": "9",
        "zone_id": "ZONE-TEST-99",
        "registration_status": "pending",
        "dispute_state": "none",
        "geometry": {"type": "Polygon", "coordinates": [[[35.20, 31.90], [35.21, 31.90], [35.21, 31.91], [35.20, 31.91], [35.20, 31.90]]]},
        "created_at": datetime.now(timezone.utc),
    })


# ============================================================================
# MODULE 2 — Applicant Portal
# ============================================================================
def test_applicant_module():
    global applicant_id
    print("\n--- Module 2: Applicant Portal ---")

    payload = {
        "full_name": "Test Applicant", "applicant_type": "citizen",
        "identity": {"national_id": TEST_NATIONAL_ID, "verified": False, "verification_method": "otp_stub"},
        "contacts": {"email": "test@example.com", "phone": "+970599999999"},
        "address": {"city": "Ramallah", "neighborhood": "Test", "zone_id": "ZONE-TEST-99"},
    }
    r = client.post("/applicants/", json=payload)
    check("create applicant (201)", r.status_code == 201, r.text)
    applicant_id = r.json()["applicant_id"]
    check("applicant_id format APP-XXXXXXXX", applicant_id.startswith("APP-") and len(applicant_id) == 12)
    check("verification_state defaults to unverified", r.json()["verification_state"] == "unverified")

    # Duplicate national_id returns 409 (bug fix #4)
    r = client.post("/applicants/", json=payload)
    check("duplicate national_id returns 409 (bug fix)", r.status_code == 409)

    # Lookup by national_id
    r = client.get(f"/applicants/by-national-id/{TEST_NATIONAL_ID}")
    check("lookup by national_id (200)", r.status_code == 200 and r.json()["applicant_id"] == applicant_id)

    r = client.get("/applicants/by-national-id/DOES-NOT-EXIST")
    check("lookup non-existent national_id (404)", r.status_code == 404)

    r = client.get(f"/applicants/{applicant_id}")
    check("get applicant by id (200)", r.status_code == 200 and r.json()["full_name"] == "Test Applicant")

    r = client.get(f"/applicants/{applicant_id}/applications")
    check("list applicant applications empty (200)", r.status_code == 200 and r.json() == [])

    r = client.get(f"/applicants/{applicant_id}/objections")
    check("list applicant objections empty (200)", r.status_code == 200 and r.json() == [])

    # Verification state endpoint requires staff role and accepts valid values
    r = client.patch(f"/applicants/{applicant_id}/verification-state",
                     json={"verification_state": "verified"})
    check("verification-state without staff role blocked (403)", r.status_code == 403)

    r = client.patch(f"/applicants/{applicant_id}/verification-state",
                     json={"verification_state": "verified"}, headers=REGISTRAR_HDR)
    check("verification-state -> verified (200)", r.status_code == 200 and r.json()["verification_state"] == "verified")

    r = client.patch(f"/applicants/{applicant_id}/verification-state",
                     json={"verification_state": "suspended"}, headers=REGISTRAR_HDR)
    check("verification-state -> suspended (200)", r.status_code == 200 and r.json()["verification_state"] == "suspended")

    # Reset back to verified for downstream tests
    client.patch(f"/applicants/{applicant_id}/verification-state",
                 json={"verification_state": "verified"}, headers=REGISTRAR_HDR)


# ============================================================================
# MODULE 1 — Land Applications + workflow rules
# ============================================================================
def test_application_module():
    global application_id
    print("\n--- Module 1: Land Applications + workflow rules ---")

    payload = {
        "application_type": "ownership_transfer",
        "priority": "normal",
        "applicant_ref": {"applicant_id": applicant_id, "applicant_type": "citizen"},
        "parcel": {
            "parcel_no": "999", "block_no": "99", "basin_no": "9", "zone_id": "ZONE-TEST-99",
            "geometry": {"type": "Polygon", "coordinates": [[[35.20, 31.90], [35.21, 31.90], [35.21, 31.91], [35.20, 31.91], [35.20, 31.90]]]},
        },
        "description": "Test app",
    }

    r = client.post("/applications/", json=payload, headers={"Idempotency-Key": "TEST-IDEMP-1"})
    check("create application (201)", r.status_code == 201, r.text)
    application_id = r.json()["application_id"]
    check("status starts as submitted", r.json()["status"] == "submitted")
    check("workflow.allowed_next includes pre_checked", "pre_checked" in r.json()["workflow"]["allowed_next"])

    # Idempotency: same key returns same record (no duplicate insert)
    r2 = client.post("/applications/", json=payload, headers={"Idempotency-Key": "TEST-IDEMP-1"})
    check("idempotency: same key returns same application_id", r2.status_code == 201 and r2.json()["application_id"] == application_id)

    # GET by id
    r = client.get(f"/applications/{application_id}")
    check("get application by id (200)", r.status_code == 200 and r.json()["application_id"] == application_id)

    r = client.get("/applications/DOES-NOT-EXIST")
    check("get non-existent application (404)", r.status_code == 404)

    # List with filters
    r = client.get("/applications/", params={"status": "submitted", "page": 1, "page_size": 50})
    check("list applications filtered by status (200)", r.status_code == 200 and any(a["application_id"] == application_id for a in r.json()["items"]))

    r = client.get("/applications/", params={"zone_id": "ZONE-TEST-99", "page": 1, "page_size": 50})
    check("list filtered by zone (200)", r.status_code == 200 and any(a["application_id"] == application_id for a in r.json()["items"]))

    # Date filter (submitted_from / submitted_to)
    r = client.get("/applications/", params={"submitted_from": "2030-01-01"})
    check("submitted_from future returns empty", r.status_code == 200 and not any(a["application_id"] == application_id for a in r.json()["items"]))
    r = client.get("/applications/", params={"submitted_from": "2020-01-01", "submitted_to": "2099-01-01", "page_size": 100})
    check("submitted_from/to wide window includes app", r.status_code == 200 and any(a["application_id"] == application_id for a in r.json()["items"]))

    # Now visible in applicant's applications list
    r = client.get(f"/applicants/{applicant_id}/applications")
    check("applicant's applications now lists it", r.status_code == 200 and len(r.json()) == 1)

    # Stats + linked_applications populate dynamically from get_applicant
    r = client.get(f"/applicants/{applicant_id}")
    check("applicant.stats.total_applications updates", r.json().get("stats", {}).get("total_applications") == 1)
    check("applicant.linked_applications populated", application_id in r.json().get("linked_applications", []))

    # ---- Workflow rule enforcement ----
    print("  workflow rules:")

    # submitted -> pre_checked OK
    r = client.patch(f"/applications/{application_id}/transition", json={"to_state": "pre_checked"})
    check("transition submitted -> pre_checked (200)", r.status_code == 200 and r.json()["status"] == "pre_checked")

    # Invalid skip: pre_checked -> approved (not in ALLOWED_NEXT)
    r = client.patch(f"/applications/{application_id}/transition", json={"to_state": "approved"})
    check("invalid skip pre_checked -> approved blocked (400)", r.status_code == 400)

    # pre_checked -> legal_review without docs is blocked (bug fix #1)
    r = client.patch(f"/applications/{application_id}/transition", json={"to_state": "legal_review"})
    check("legal_review without docs blocked (bug fix)", r.status_code == 400)

    # pre_checked -> survey_required (geometry present, OK)
    r = client.patch(f"/applications/{application_id}/transition", json={"to_state": "survey_required"})
    check("transition pre_checked -> survey_required (200)", r.status_code == 200 and r.json()["status"] == "survey_required")

    # surveyed without report blocked
    # (we're at survey_required, so try direct survey_required → surveyed without report)
    r = client.patch(f"/applications/{application_id}/transition", json={"to_state": "surveyed"})
    check("surveyed without report blocked (400)", r.status_code == 400)

    # reject without reason blocked
    r = client.post(f"/applications/{application_id}/reject", json={"reason": ""})
    check("reject without reason blocked (400)", r.status_code == 400)

    # hold without reason blocked
    r = client.post(f"/applications/{application_id}/hold", json={"reason": ""})
    check("hold without reason blocked (400)", r.status_code == 400)

    # certificate before approved blocked
    r = client.post(f"/applications/{application_id}/certificate", json={"full_name": "Test", "issued_by": "registrar"})
    check("certificate before approved blocked (400)", r.status_code == 400)


# ============================================================================
# MODULE 2 (continued) - documents, comments, objections, timeline
# ============================================================================
def test_documents_comments_objections():
    print("\n--- Documents / Comments / Objections / Timeline ---")

    # Upload document
    r = client.post(f"/applications/{application_id}/documents", json={
        "document_type": "ownership_deed", "file_name": "deed.pdf", "file_path": "/uploads/deed.pdf",
    })
    check("upload document (201)", r.status_code == 201)
    doc_id = r.json()["document_id"]
    check("document defaults to pending_review", r.json()["verification_status"] == "pending_review")

    # List documents
    r = client.get(f"/applications/{application_id}/documents")
    check("list documents includes uploaded one", r.status_code == 200 and any(d["document_id"] == doc_id for d in r.json()))

    # Document verify endpoint requires staff role (bug fix #5)
    r = client.patch(f"/applications/{application_id}/documents/{doc_id}/verify",
                     json={"verification_status": "verified"})
    check("verify without staff role blocked (403)", r.status_code == 403)

    r = client.patch(f"/applications/{application_id}/documents/{doc_id}/verify",
                     json={"verification_status": "verified"}, headers=REGISTRAR_HDR)
    check("verify document as registrar (200)", r.status_code == 200 and r.json()["verification_status"] == "verified")

    # Add comment
    r = client.post(f"/applications/{application_id}/comments", json={
        "author_id": applicant_id, "text": "Please review my application",
    })
    check("add comment (201)", r.status_code == 201)

    # Submit objection — should move app to under_objection
    r = client.post(f"/applications/{application_id}/objections", json={
        "author_id": applicant_id, "reason": "Disputing parcel boundary",
        "supporting_documents": [],
    })
    check("submit objection (201)", r.status_code == 201)

    r = client.get(f"/applications/{application_id}")
    check("objection moves status to under_objection", r.json()["status"] == "under_objection")
    check("application records has_objection", r.json()["objection"]["has_objection"] is True)

    # Applicant's objection list
    r = client.get(f"/applicants/{applicant_id}/objections")
    check("applicant's objections lists new one", len(r.json()) == 1)

    # Timeline
    r = client.get(f"/applications/{application_id}/timeline")
    check("timeline returns events", r.status_code == 200 and len(r.json()) > 0)
    types = [e["type"] for e in r.json()]
    check("timeline includes submitted", "submitted" in types)
    check("timeline includes document_uploaded", "document_uploaded" in types)
    check("timeline includes document_verified (bug fix)", "document_verified" in types)
    check("timeline includes objection_submitted", "objection_submitted" in types)


# ============================================================================
# MODULE 3 - Staff (auto-assign, milestones, report, registrar-review)
# ============================================================================
surveyor_id = None
registrar_id = None
test_app_id_2 = None  # second app to drive surveyor flow


def test_staff_module():
    global surveyor_id, registrar_id, test_app_id_2
    print("\n--- Module 3: Staff ---")

    # Access control: staff endpoints require X-Staff-Role
    r = client.get("/staff/")
    check("list staff without role header blocked (403)", r.status_code == 403)

    # Create surveyor
    surveyor_payload = {
        "staff_code": TEST_STAFF_CODE, "name": "Test Surveyor", "role": "surveyor",
        "skills": ["boundary_survey", "gps_mapping"],
        "coverage": {"zone_ids": ["ZONE-TEST-99"]},
        "schedule": {"shifts": [], "on_call": True},
        "workload": {"active_tasks": 0, "max_tasks": 5},
    }
    r = client.post("/staff/", json=surveyor_payload, headers=SURVEYOR_HDR)
    check("create surveyor (201)", r.status_code == 201, r.text)
    surveyor_id = r.json()["id"]

    # Create registrar
    reg_payload = {
        "staff_code": TEST_REG_CODE, "name": "Test Registrar", "role": "registrar",
        "department": "Legal Review", "skills": ["legal_review"],
        "coverage": {"zone_ids": ["ZONE-TEST-99"]},
    }
    r = client.post("/staff/", json=reg_payload, headers=REGISTRAR_HDR)
    check("create registrar (201)", r.status_code == 201)
    registrar_id = r.json()["id"]

    # List staff with role filter
    r = client.get("/staff/", params={"role": "surveyor"}, headers=SURVEYOR_HDR)
    check("list staff filtered by role surveyor", r.status_code == 200 and any(s["id"] == surveyor_id for s in r.json()))
    check("list staff filtered by role excludes registrars", not any(s["id"] == registrar_id for s in r.json()))

    # Get staff with performance summary
    r = client.get(f"/staff/{surveyor_id}", headers=SURVEYOR_HDR)
    check("get staff returns performance summary", r.status_code == 200 and "performance" in r.json())

    # Create a fresh application to drive the survey flow (the first one is now under_objection)
    payload = {
        "application_type": "first_registration",
        "priority": "high",
        "applicant_ref": {"applicant_id": applicant_id, "applicant_type": "citizen"},
        "parcel": {
            "parcel_no": "888", "block_no": "88", "basin_no": "8", "zone_id": "ZONE-TEST-99",
            "geometry": {"type": "Polygon", "coordinates": [[[35.20, 31.90], [35.21, 31.90], [35.21, 31.91], [35.20, 31.91], [35.20, 31.90]]]},
        },
    }
    r = client.post("/applications/", json=payload)
    test_app_id_2 = r.json()["application_id"]
    client.patch(f"/applications/{test_app_id_2}/transition", json={"to_state": "pre_checked"})
    client.patch(f"/applications/{test_app_id_2}/transition", json={"to_state": "survey_required"})

    # Auto-assign surveyor
    r = client.post(f"/applications/{test_app_id_2}/auto-assign-surveyor", headers=SURVEYOR_HDR)
    check("auto-assign surveyor (201)", r.status_code == 201, r.text)
    check("assigned to test surveyor", r.json()["assigned_surveyor_id"] == surveyor_id)
    check("task status = assigned", r.json()["status"] == "assigned")

    # Milestones in order
    for m in ["visit_scheduled", "arrived_on_site", "survey_started", "survey_completed"]:
        r = client.patch(f"/applications/{test_app_id_2}/survey-milestone",
                         json={"type": m, "by": surveyor_id, "meta": {}}, headers=SURVEYOR_HDR)
        check(f"milestone {m} (200)", r.status_code == 200 and r.json()["status"] == m)

    # Backwards milestone blocked
    r = client.patch(f"/applications/{test_app_id_2}/survey-milestone",
                     json={"type": "visit_scheduled", "by": surveyor_id, "meta": {}}, headers=SURVEYOR_HDR)
    check("backwards milestone blocked (400)", r.status_code == 400)

    # Field note
    r = client.post(f"/applications/{test_app_id_2}/field-note",
                    json={"note": "Boundary verified", "by": surveyor_id}, headers=SURVEYOR_HDR)
    check("add field note (201)", r.status_code == 201 and "Boundary verified" in r.json()["field_notes"])

    # Survey report
    r = client.post(f"/applications/{test_app_id_2}/survey-report",
                    json={"report_title": "Survey 888", "findings": "OK", "uploaded_by": surveyor_id}, headers=SURVEYOR_HDR)
    check("upload survey report (201)", r.status_code == 201)

    r = client.get(f"/applications/{test_app_id_2}")
    check("application moves to surveyed after report", r.json()["status"] == "surveyed")

    # Registrar review enforces ALLOWED_NEXT (bug fix #3)
    # surveyed -> approved is NOT in ALLOWED_NEXT (must go via legal_review)
    r = client.patch(f"/applications/{test_app_id_2}/registrar-review",
                     json={"decision": "approved", "reviewed_by": registrar_id}, headers=REGISTRAR_HDR)
    check("registrar-review surveyed->approved blocked (bug fix)", r.status_code == 400)

    # Move to legal_review (need a doc first - bug fix #1)
    client.post(f"/applications/{test_app_id_2}/documents", json={
        "document_type": "ownership_deed", "file_name": "deed888.pdf", "file_path": "/uploads/deed888.pdf",
    })
    r = client.patch(f"/applications/{test_app_id_2}/transition", json={"to_state": "legal_review", "actor_id": registrar_id})
    check("transition surveyed -> legal_review with doc (200)", r.status_code == 200)
    check("transition with actor_id records assigned_registrar_id",
          (r.json().get("assignment") or {}).get("assigned_registrar_id") == registrar_id)

    # Now registrar-review can approve
    r = client.patch(f"/applications/{test_app_id_2}/registrar-review",
                     json={"decision": "approved", "reviewed_by": registrar_id, "notes": "All good"}, headers=REGISTRAR_HDR)
    check("registrar-review approved (200)", r.status_code == 200 and r.json()["status"] == "approved")

    # Issue certificate
    r = client.post(f"/applications/{test_app_id_2}/certificate",
                    json={"full_name": "Test Applicant", "issued_by": registrar_id})
    check("issue certificate (201)", r.status_code == 201)
    cert_id = r.json()["certificate_id"]

    r = client.get(f"/applications/{test_app_id_2}")
    check("application auto-closes after certificate (Annex B step 10)", r.json()["status"] == "closed")
    check("application records certificate_ref", r.json().get("certificate_ref") == cert_id)

    r = client.get("/certificates/")
    check("certificate appears in list", any(c["certificate_id"] == cert_id for c in r.json()))

    # Surveyor's tasks list
    r = client.get(f"/staff/{surveyor_id}/tasks", headers=SURVEYOR_HDR)
    check("surveyor tasks lists assignment", r.status_code == 200 and any(t["application_id"] == test_app_id_2 for t in r.json()))

    # Transition with actor_id records the registrar on the application,
    # so registrar workload analytics has data.
    app_doc = applications_col.find_one({"application_id": test_app_id_2})
    check("transition records assigned_registrar_id", (app_doc.get("assignment", {}).get("assigned_registrar_id")) == registrar_id)

    # Re-uploading a survey report after the app has moved past `surveyed`
    # must NOT regress the workflow state. (App is now closed.)
    r = client.post(f"/applications/{test_app_id_2}/survey-report",
                    json={"report_title": "Resubmit", "findings": "Updated", "uploaded_by": surveyor_id}, headers=SURVEYOR_HDR)
    check("duplicate survey report still 201", r.status_code == 201)
    r = client.get(f"/applications/{test_app_id_2}")
    check("duplicate report does NOT regress workflow", r.json()["status"] == "closed")


# ============================================================================
# MODULE 4 - Analytics, Map, Visualization
# ============================================================================
def test_analytics_module():
    print("\n--- Module 4: Analytics ---")

    r = client.get("/analytics/kpis")
    check("GET /analytics/kpis (200)", r.status_code == 200)
    kpis = r.json()
    for key in ["total", "pending", "approved", "rejected", "under_objection", "certificate_issued", "approval_rate"]:
        check(f"kpis include '{key}'", key in kpis)

    r = client.get("/analytics/applications-by-status")
    check("GET /applications-by-status returns dict", r.status_code == 200 and isinstance(r.json(), dict))

    r = client.get("/analytics/applications-by-type")
    check("GET /applications-by-type (200)", r.status_code == 200 and isinstance(r.json(), dict))

    r = client.get("/analytics/applications-by-zone")
    check("GET /applications-by-zone (200)", r.status_code == 200 and isinstance(r.json(), dict))

    r = client.get("/analytics/processing-time")
    check("GET /processing-time returns list", r.status_code == 200 and isinstance(r.json(), list))

    r = client.get("/analytics/surveyors")
    check("GET /surveyors returns list", r.status_code == 200 and isinstance(r.json(), list))
    check("surveyor analytics include test surveyor", any(s.get("staff_code") == TEST_STAFF_CODE for s in r.json()))

    r = client.get("/analytics/registrars")
    check("GET /registrars returns list", r.status_code == 200 and isinstance(r.json(), list))

    r = client.get("/analytics/hotspots")
    check("GET /hotspots returns list", r.status_code == 200 and isinstance(r.json(), list))

    r = client.get("/analytics/delayed")
    check("GET /delayed returns list", r.status_code == 200 and isinstance(r.json(), list))

    r = client.get("/analytics/backlog-by-age")
    check("GET /backlog-by-age (uses $bucketAuto)", r.status_code == 200 and isinstance(r.json(), list))

    r = client.get("/analytics/applications-over-time")
    check("GET /applications-over-time (200)", r.status_code == 200)

    r = client.get("/analytics/certificates-per-month")
    check("GET /certificates-per-month (200)", r.status_code == 200)

    r = client.get("/analytics/document-status")
    check("GET /document-status (uses $unwind)", r.status_code == 200)

    # Geofeeds (GeoJSON FeatureCollection)
    r = client.get("/analytics/geofeeds/parcels")
    check("GET /geofeeds/parcels is FeatureCollection",
          r.status_code == 200 and r.json().get("type") == "FeatureCollection")

    r = client.get("/analytics/geofeeds/applications")
    check("GET /geofeeds/applications is FeatureCollection",
          r.status_code == 200 and r.json().get("type") == "FeatureCollection")

    r = client.get("/analytics/geofeeds/pending-heatmap")
    check("GET /geofeeds/pending-heatmap is FeatureCollection",
          r.status_code == 200 and r.json().get("type") == "FeatureCollection")

    # $geoNear (parcels-near a point)
    r = client.get("/analytics/geofeeds/parcels-near", params={"lng": 35.205, "lat": 31.905, "max_meters": 5000})
    check("GET /geofeeds/parcels-near (uses $geoNear)", r.status_code == 200 and isinstance(r.json(), list))

    # CSV export
    r = client.get("/analytics/export/applications.csv")
    check("CSV export (200, text/csv)", r.status_code == 200 and "text/csv" in r.headers.get("content-type", ""))
    check("CSV header has expected columns", "application_id,application_type,status" in r.text.split("\n")[0])


# ============================================================================
# ANNEX B - End-to-end happy path
# 11 numbered steps from the spec, exercised in order.
# ============================================================================
def test_annex_b_happy_path():
    print("\n--- Annex B: end-to-end workflow ---")

    # Step 1: Application Submission
    payload = {
        "application_type": "first_registration",
        "priority": "normal",
        "applicant_ref": {"applicant_id": applicant_id, "applicant_type": "citizen"},
        "parcel": {
            "parcel_no": "777", "block_no": "77", "basin_no": "7", "zone_id": "ZONE-TEST-99",
            "geometry": {"type": "Polygon", "coordinates": [[[35.20, 31.90], [35.21, 31.90], [35.21, 31.91], [35.20, 31.91], [35.20, 31.90]]]},
        },
    }
    r = client.post("/applications/", json=payload)
    check("step 1: create application -> submitted", r.status_code == 201 and r.json()["status"] == "submitted")
    aid = r.json()["application_id"]

    # Step 2: Automatic validation - log records the submitted event
    r = client.get(f"/applications/{aid}/timeline")
    check("step 2: timeline records submitted event", any(e["type"] == "submitted" for e in r.json()))

    # Step 3: Pre-Check by Staff
    r = client.patch(f"/applications/{aid}/transition", json={"to_state": "pre_checked", "actor_id": registrar_id})
    check("step 3: pre_checked", r.status_code == 200 and r.json()["status"] == "pre_checked")

    # Step 4: Survey Requirement - auto-assign should happen on transition
    r = client.patch(f"/applications/{aid}/transition", json={"to_state": "survey_required", "actor_id": registrar_id})
    check("step 4a: survey_required", r.status_code == 200 and r.json()["status"] == "survey_required")
    check("step 4b: auto-assignment populated assigned_surveyor_id",
          r.json().get("assignment", {}).get("assigned_surveyor_id") == surveyor_id)
    r = client.get(f"/staff/{surveyor_id}/tasks", headers=SURVEYOR_HDR)
    check("step 4c: survey task created for the app", any(t["application_id"] == aid for t in r.json()))

    # Step 5: Field Survey - milestones + report
    for m in ["visit_scheduled", "arrived_on_site", "survey_started", "survey_completed"]:
        client.patch(f"/applications/{aid}/survey-milestone",
                     json={"type": m, "by": surveyor_id, "meta": {}}, headers=SURVEYOR_HDR)
    r = client.post(f"/applications/{aid}/survey-report",
                    json={"report_title": "FR 777", "findings": "OK", "uploaded_by": surveyor_id}, headers=SURVEYOR_HDR)
    check("step 5: survey report uploaded", r.status_code == 201)
    r = client.get(f"/applications/{aid}")
    check("step 5: app reaches surveyed", r.json()["status"] == "surveyed")

    # Step 6: Legal Review (requires uploaded doc)
    client.post(f"/applications/{aid}/documents",
                json={"document_type": "ownership_deed", "file_name": "deed777.pdf", "file_path": "/uploads/deed777.pdf"})
    r = client.patch(f"/applications/{aid}/transition",
                     json={"to_state": "legal_review", "actor_id": registrar_id})
    check("step 6: legal_review", r.status_code == 200 and r.json()["status"] == "legal_review")

    # Step 7: Objection handling — file an objection then resolve back to legal_review
    r = client.post(f"/applications/{aid}/objections",
                    json={"author_id": applicant_id, "reason": "Boundary dispute", "supporting_documents": []})
    check("step 7a: objection submitted", r.status_code == 201)
    r = client.get(f"/applications/{aid}")
    check("step 7b: app moves to under_objection", r.json()["status"] == "under_objection")
    r = client.patch(f"/applications/{aid}/transition",
                     json={"to_state": "legal_review", "actor_id": registrar_id, "note": "Objection resolved"})
    check("step 7c: registrar resolves -> legal_review", r.status_code == 200)

    # Step 8: Approval
    r = client.patch(f"/applications/{aid}/transition",
                     json={"to_state": "approved", "actor_id": registrar_id})
    check("step 8: approved", r.status_code == 200 and r.json()["status"] == "approved")

    # Step 9 + 10: Certificate Issuance auto-closes the application
    r = client.post(f"/applications/{aid}/certificate",
                    json={"certificate_type": "ownership_certificate", "full_name": "Test Applicant", "issued_by": registrar_id})
    check("step 9: certificate issued (201)", r.status_code == 201)
    cert_id = r.json()["certificate_id"]
    r = client.get(f"/applications/{aid}")
    check("step 10: app auto-closes after certificate", r.json()["status"] == "closed")
    check("step 10: certificate_ref recorded", r.json().get("certificate_ref") == cert_id)
    check("step 10: timestamps.closed_at set", (r.json().get("timestamps") or {}).get("closed_at") is not None)

    # Step 11: Mapping & Analytics — closed app contributes to analytics
    r = client.get("/analytics/applications-by-status")
    check("step 11: closed counted in analytics", r.json().get("closed", 0) >= 1)
    r = client.get("/analytics/geofeeds/applications")
    apps_feed = r.json().get("features", [])
    check("step 11: app appears in geofeed", any(f["properties"]["application_id"] == aid for f in apps_feed))


if __name__ == "__main__":
    cleanup()
    seed_parcel()
    try:
        test_applicant_module()
        test_application_module()
        test_documents_comments_objections()
        test_staff_module()
        test_analytics_module()
        test_annex_b_happy_path()
    finally:
        passed = sum(1 for _, c in results if c)
        print(f"\n{passed}/{len(results)} checks passed")
        cleanup()
        sys.exit(0 if passed == len(results) else 1)
