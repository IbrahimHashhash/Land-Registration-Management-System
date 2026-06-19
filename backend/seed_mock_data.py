from dotenv import load_dotenv
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timezone

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

applications = [
    {
        "_id": ObjectId("675100000000000000000001"),
        "application_id": "LRMIS-2026-0001",
        "application_type": "first_registration",
        "status": "survey_required",
        "priority": "high",
        "applicant_ref": {
            "applicant_id": ObjectId("675100000000000000000101"),
            "applicant_type": "citizen",
            "submitted_by_representative": False,
        },
        "parcel_ref": {
            "parcel_id": ObjectId("675100000000000000000201"),
            "parcel_number": "145",
            "block_number": "12",
            "basin_number": "3",
            "zone_id": "ZONE-RM-01",
        },
        "workflow": {
            "current_state": "survey_required",
            "allowed_next": ["surveyed", "on_hold", "rejected"],
            "transition_rules_version": "v1.0",
        },
        "assignment": {
            "assigned_surveyor_id": None,
            "assigned_registrar_id": None,
            "assignment_policy": "zone+workload+availability",
        },
        "timestamps": {
            "submitted_at": datetime(2026, 2, 1, 9, 0, tzinfo=timezone.utc),
            "survey_required_at": datetime(2026, 2, 2, 8, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 2, 2, 8, 0, tzinfo=timezone.utc),
        },
    },
    {
        "_id": ObjectId("675100000000000000000002"),
        "application_id": "LRMIS-2026-0002",
        "application_type": "ownership_transfer",
        "status": "survey_required",
        "priority": "normal",
        "applicant_ref": {
            "applicant_id": ObjectId("675100000000000000000102"),
            "applicant_type": "lawyer",
            "submitted_by_representative": True,
        },
        "parcel_ref": {
            "parcel_id": ObjectId("675100000000000000000202"),
            "parcel_number": "210",
            "block_number": "5",
            "basin_number": "1",
            "zone_id": "ZONE-RM-02",
        },
        "workflow": {
            "current_state": "survey_required",
            "allowed_next": ["surveyed", "on_hold", "rejected"],
            "transition_rules_version": "v1.0",
        },
        "assignment": {
            "assigned_surveyor_id": None,
            "assigned_registrar_id": None,
            "assignment_policy": "zone+workload+availability",
        },
        "timestamps": {
            "submitted_at": datetime(2026, 2, 3, 10, 0, tzinfo=timezone.utc),
            "survey_required_at": datetime(2026, 2, 4, 9, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 2, 4, 9, 0, tzinfo=timezone.utc),
        },
    },
    {
        "_id": ObjectId("675100000000000000000003"),
        "application_id": "LRMIS-2026-0003",
        "application_type": "boundary_correction",
        "status": "survey_required",
        "priority": "normal",
        "applicant_ref": {
            "applicant_id": ObjectId("675100000000000000000103"),
            "applicant_type": "citizen",
            "submitted_by_representative": False,
        },
        "parcel_ref": {
            "parcel_id": ObjectId("675100000000000000000203"),
            "parcel_number": "88",
            "block_number": "3",
            "basin_number": "2",
            "zone_id": "ZONE-RM-01",
        },
        "workflow": {
            "current_state": "survey_required",
            "allowed_next": ["surveyed", "on_hold", "rejected"],
            "transition_rules_version": "v1.0",
        },
        "assignment": {
            "assigned_surveyor_id": None,
            "assigned_registrar_id": None,
            "assignment_policy": "zone+workload+availability",
        },
        "timestamps": {
            "submitted_at": datetime(2026, 2, 5, 11, 0, tzinfo=timezone.utc),
            "survey_required_at": datetime(2026, 2, 6, 8, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 2, 6, 8, 0, tzinfo=timezone.utc),
        },
    },
]

staff_members = [
    {
        "_id": ObjectId("675100000000000000000301"),
        "staff_code": "SURV-RM-04",
        "name": "Survey Team A",
        "role": "surveyor",
        "department": "Cadastral Survey",
        "skills": ["boundary_survey", "parcel_subdivision", "gps_mapping"],
        "coverage": {
            "zone_ids": ["ZONE-RM-01", "ZONE-RM-02"],
            "geo_fence": {
                "type": "Polygon",
                "coordinates": [[[35.19, 31.89], [35.22, 31.89], [35.22, 31.92], [35.19, 31.92], [35.19, 31.89]]],
            },
        },
        "schedule": {
            "timezone": "Asia/Jerusalem",
            "shifts": [
                {"day": "Mon", "start": "08:00", "end": "16:00"},
                {"day": "Tue", "start": "08:00", "end": "16:00"},
                {"day": "Wed", "start": "08:00", "end": "16:00"},
            ],
            "on_call": False,
        },
        "workload": {"active_tasks": 2, "max_tasks": 10},
        "contacts": {"phone": "+970599111111", "email": "survey_a@example.com"},
        "active": True,
        "created_at": datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc),
    },
    {
        "_id": ObjectId("675100000000000000000302"),
        "staff_code": "REG-RM-09",
        "name": "Registrar Office B",
        "role": "registrar",
        "department": "Legal Review",
        "skills": ["legal_review", "ownership_verification"],
        "coverage": {"zone_ids": ["ZONE-RM-01", "ZONE-RM-02"]},
        "schedule": {
            "timezone": "Asia/Jerusalem",
            "shifts": [
                {"day": "Sun", "start": "08:00", "end": "16:00"},
                {"day": "Mon", "start": "08:00", "end": "16:00"},
                {"day": "Tue", "start": "08:00", "end": "16:00"},
                {"day": "Wed", "start": "08:00", "end": "16:00"},
                {"day": "Thu", "start": "08:00", "end": "16:00"},
            ],
            "on_call": False,
        },
        "workload": {"active_tasks": 3, "max_tasks": 15},
        "contacts": {"phone": "+970599222222", "email": "registrar_b@example.com"},
        "active": True,
        "created_at": datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc),
    },
]

def _poly(lng, lat, d=0.0014):
    return {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng + d, lat], [lng + d, lat + d], [lng, lat + d], [lng, lat]]],
    }


parcels = [
    {
        "_id": ObjectId("675100000000000000000201"),
        "parcel_code": "RM-Z01-B12-P145", "parcel_number": "145", "block_number": "12",
        "basin_number": "3", "zone_id": "ZONE-RM-01", "area_sqm": 850.5, "land_use": "residential",
        "registration_status": "registered", "geometry": _poly(35.2001, 31.9021),
        "address_hint": "Ramallah - Al Tireh", "dispute_state": "none",
    },
    {
        "_id": ObjectId("675100000000000000000202"),
        "parcel_code": "RM-Z02-B05-P210", "parcel_number": "210", "block_number": "5",
        "basin_number": "1", "zone_id": "ZONE-RM-02", "area_sqm": 1200.0, "land_use": "commercial",
        "registration_status": "pending", "geometry": _poly(35.2060, 31.9050),
        "address_hint": "Ramallah - Center", "dispute_state": "disputed",
    },
    {
        "_id": ObjectId("675100000000000000000203"),
        "parcel_code": "RM-Z01-B03-P88", "parcel_number": "88", "block_number": "3",
        "basin_number": "2", "zone_id": "ZONE-RM-01", "area_sqm": 640.0, "land_use": "residential",
        "registration_status": "pending", "geometry": _poly(35.1980, 31.9000),
        "address_hint": "Ramallah - Al Tireh", "dispute_state": "none",
    },
    {
        "_id": ObjectId("675100000000000000000204"),
        "parcel_code": "RM-Z02-B07-P301", "parcel_number": "301", "block_number": "7",
        "basin_number": "4", "zone_id": "ZONE-RM-02", "area_sqm": 980.0, "land_use": "residential",
        "registration_status": "registered", "geometry": _poly(35.2090, 31.9080),
        "address_hint": "Ramallah - Ein Munjid", "dispute_state": "none",
    },
]

extra_applications = [
    {
        "_id": ObjectId("675100000000000000000004"),
        "application_id": "LRMIS-2026-0004", "application_type": "ownership_transfer",
        "status": "approved", "priority": "normal",
        "applicant_ref": {"applicant_id": ObjectId("675100000000000000000104"), "applicant_type": "citizen", "submitted_by_representative": False},
        "parcel_ref": {"parcel_id": ObjectId("675100000000000000000204"), "parcel_number": "301", "block_number": "7", "basin_number": "4", "zone_id": "ZONE-RM-02"},
        "workflow": {"current_state": "approved", "allowed_next": ["certificate_issued"], "transition_rules_version": "v1.0"},
        "assignment": {"assigned_surveyor_id": None, "assigned_registrar_id": "REG-RM-09", "assignment_policy": "zone+workload+availability"},
        "timestamps": {"submitted_at": datetime(2026, 1, 5, 9, 0, tzinfo=timezone.utc), "approved_at": datetime(2026, 1, 20, 9, 0, tzinfo=timezone.utc), "updated_at": datetime(2026, 1, 20, 9, 0, tzinfo=timezone.utc)},
    },
    {
        "_id": ObjectId("675100000000000000000005"),
        "application_id": "LRMIS-2026-0005", "application_type": "first_registration",
        "status": "approved", "priority": "normal",
        "applicant_ref": {"applicant_id": ObjectId("675100000000000000000105"), "applicant_type": "citizen", "submitted_by_representative": False},
        "parcel_ref": {"parcel_id": ObjectId("675100000000000000000201"), "parcel_number": "145", "block_number": "12", "basin_number": "3", "zone_id": "ZONE-RM-01"},
        "workflow": {"current_state": "approved", "allowed_next": ["certificate_issued"], "transition_rules_version": "v1.0"},
        "assignment": {"assigned_surveyor_id": None, "assigned_registrar_id": "REG-RM-09", "assignment_policy": "zone+workload+availability"},
        "timestamps": {"submitted_at": datetime(2026, 2, 1, 9, 0, tzinfo=timezone.utc), "approved_at": datetime(2026, 2, 25, 9, 0, tzinfo=timezone.utc), "updated_at": datetime(2026, 2, 25, 9, 0, tzinfo=timezone.utc)},
    },
    {
        "_id": ObjectId("675100000000000000000006"),
        "application_id": "LRMIS-2026-0006", "application_type": "ownership_transfer",
        "status": "under_objection", "priority": "high",
        "applicant_ref": {"applicant_id": ObjectId("675100000000000000000106"), "applicant_type": "lawyer", "submitted_by_representative": True},
        "parcel_ref": {"parcel_id": ObjectId("675100000000000000000202"), "parcel_number": "210", "block_number": "5", "basin_number": "1", "zone_id": "ZONE-RM-02"},
        "workflow": {"current_state": "under_objection", "allowed_next": ["legal_review", "on_hold", "rejected"], "transition_rules_version": "v1.0"},
        "assignment": {"assigned_surveyor_id": None, "assigned_registrar_id": "REG-RM-09", "assignment_policy": "zone+workload+availability"},
        "timestamps": {"submitted_at": datetime(2026, 3, 2, 9, 0, tzinfo=timezone.utc), "updated_at": datetime(2026, 3, 5, 9, 0, tzinfo=timezone.utc)},
    },
]

certificates = [
    {
        "_id": ObjectId("675100000000000000000601"),
        "certificate_id": "CERT-2026-0001", "application_id": ObjectId("675100000000000000000004"),
        "parcel_id": ObjectId("675100000000000000000204"), "certificate_type": "ownership_certificate",
        "status": "issued", "issued_to": {"applicant_id": ObjectId("675100000000000000000104"), "full_name": "Mock Owner 4"},
        "issued_at": datetime(2026, 1, 22, 12, 0, tzinfo=timezone.utc), "issued_by": "REG-RM-09",
    },
    {
        "_id": ObjectId("675100000000000000000602"),
        "certificate_id": "CERT-2026-0002", "application_id": ObjectId("675100000000000000000005"),
        "parcel_id": ObjectId("675100000000000000000201"), "certificate_type": "ownership_certificate",
        "status": "issued", "issued_to": {"applicant_id": ObjectId("675100000000000000000105"), "full_name": "Mock Owner 5"},
        "issued_at": datetime(2026, 2, 27, 12, 0, tzinfo=timezone.utc), "issued_by": "REG-RM-09",
    },
]

survey_tasks = [
    {
        "_id": ObjectId("675100000000000000000401"),
        "task_id": "SURV-2026-0001",
        "application_id": "LRMIS-2026-0001",
        "parcel_id": ObjectId("675100000000000000000201"),
        "assigned_surveyor_id": ObjectId("675100000000000000000301"),
        "status": "visit_scheduled",
        "milestones": [
            {"type": "assigned", "at": datetime(2026, 2, 2, 8, 0, tzinfo=timezone.utc), "by": "system", "meta": {"reason": "zone and workload match"}},
            {"type": "visit_scheduled", "at": datetime(2026, 2, 3, 9, 0, tzinfo=timezone.utc), "by": "surveyor", "meta": {"scheduled_date": "2026-02-05"}},
        ],
        "field_notes": [],
        "report_uploaded": False,
        "created_at": datetime(2026, 2, 2, 8, 0, tzinfo=timezone.utc),
    },
    {
        "_id": ObjectId("675100000000000000000402"),
        "task_id": "SURV-2026-0002",
        "application_id": "LRMIS-2026-0003",
        "parcel_id": ObjectId("675100000000000000000203"),
        "assigned_surveyor_id": ObjectId("675100000000000000000301"),
        "status": "assigned",
        "milestones": [
            {"type": "assigned", "at": datetime(2026, 2, 6, 8, 30, tzinfo=timezone.utc), "by": "system", "meta": {"reason": "zone and workload match"}},
        ],
        "field_notes": [],
        "report_uploaded": False,
        "created_at": datetime(2026, 2, 6, 8, 30, tzinfo=timezone.utc),
    },
]

if __name__ == "__main__":
    app_ids = ["LRMIS-2026-0001", "LRMIS-2026-0002", "LRMIS-2026-0003", "LRMIS-2026-0004", "LRMIS-2026-0005", "LRMIS-2026-0006"]
    db["land_applications"].delete_many({"application_id": {"$in": app_ids}})
    db["staff_members"].delete_many({"staff_code": {"$in": ["SURV-RM-04", "REG-RM-09"]}})
    db["parcels"].delete_many({"parcel_code": {"$in": [p["parcel_code"] for p in parcels]}})
    db["certificates"].delete_many({"certificate_id": {"$in": [c["certificate_id"] for c in certificates]}})
    db["survey_tasks"].delete_many({"task_id": {"$in": [t["task_id"] for t in survey_tasks]}})

    db["land_applications"].insert_many(applications + extra_applications)
    db["staff_members"].insert_many(staff_members)
    db["parcels"].insert_many(parcels)
    db["certificates"].insert_many(certificates)
    db["survey_tasks"].insert_many(survey_tasks)
    print(f"Seeded {len(applications) + len(extra_applications)} applications, {len(staff_members)} staff, {len(parcels)} parcels, {len(certificates)} certificates, {len(survey_tasks)} survey tasks.")
