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

if __name__ == "__main__":
    db["land_applications"].delete_many({"application_id": {"$in": ["LRMIS-2026-0001", "LRMIS-2026-0002", "LRMIS-2026-0003"]}})
    db["staff_members"].delete_many({"staff_code": {"$in": ["SURV-RM-04", "REG-RM-09"]}})

    db["land_applications"].insert_many(applications)
    db["staff_members"].insert_many(staff_members)
    print("Seeded 3 applications (survey_required) and 2 staff members.")
