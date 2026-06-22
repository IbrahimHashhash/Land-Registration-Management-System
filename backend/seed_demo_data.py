from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

applicants_col = db["applicants"]
parcels_col = db["parcels"]
applications_col = db["land_applications"]
logs_col = db["performance_logs"]
certificates_col = db["certificates"]

ALLOWED_NEXT = {
    "submitted": ["pre_checked", "missing_documents", "on_hold", "rejected"],
    "pre_checked": ["survey_required", "legal_review", "missing_documents", "on_hold", "rejected"],
    "survey_required": ["surveyed", "on_hold", "rejected"],
    "surveyed": ["legal_review", "on_hold", "rejected"],
    "legal_review": ["approved", "under_objection", "on_hold", "rejected"],
    "approved": ["certificate_issued", "rejected"],
    "certificate_issued": ["closed"],
    "closed": [],
    "rejected": [],
    "on_hold": ["pre_checked", "survey_required", "surveyed", "legal_review"],
    "missing_documents": ["submitted", "pre_checked", "rejected"],
    "under_objection": ["legal_review", "approved", "on_hold", "rejected"],
}

MAIN_FLOW = ["submitted", "pre_checked", "survey_required", "surveyed",
             "legal_review", "approved", "certificate_issued", "closed"]
TS_FIELD = {
    "submitted": "submitted_at", "pre_checked": "pre_checked_at",
    "survey_required": "survey_required_at", "surveyed": "surveyed_at",
    "legal_review": "legal_review_at", "approved": "approved_at",
    "certificate_issued": "certificate_issued_at", "closed": "closed_at",
}
ACTOR = {
    "submitted": ("applicant", None), "pre_checked": ("registrar", "S14"),
    "survey_required": ("system", "assignment_engine"), "surveyed": ("surveyor", "SURV-RM-04"),
    "legal_review": ("registrar", "S14"), "approved": ("registrar", "S09"),
    "certificate_issued": ("registrar", "S09"), "closed": ("system", None),
    "rejected": ("registrar", "S14"), "on_hold": ("staff", "S22"),
    "missing_documents": ("system", None), "under_objection": ("applicant", None),
}

BASE = datetime(2026, 2, 1, 9, 0, tzinfo=timezone.utc)

APPLICANTS = [
    ("APP-DEMO0001", "Nour Ahmad", "citizen", "990000001", "nour.demo@example.com", "Ramallah", "Al Tireh", "ZONE-RM-01"),
    ("APP-DEMO0002", "Khaled Mansour", "lawyer", "990000002", "khaled.demo@example.com", "Ramallah", "Al Masyoun", "ZONE-RM-02"),
    ("APP-DEMO0003", "Lina Haddad", "citizen", "990000003", "lina.demo@example.com", "Ramallah", "Ein Munjid", "ZONE-RM-01"),
    ("APP-DEMO0004", "Tariq Saleh", "authorized_representative", "990000004", "tariq.demo@example.com", "Al Bireh", "Center", "ZONE-RM-03"),
    ("APP-DEMO0005", "Omar Khalil", "company", "990000005", "omar.demo@example.com", "Ramallah", "Industrial", "ZONE-RM-02"),
    ("APP-DEMO0006", "Huda Nasser", "citizen", "990000006", "huda.demo@example.com", "Al Bireh", "Jabal", "ZONE-RM-03"),
]

PARCELS = [
    ("DEMO-RM-Z01-B12-P145", "145", "12", "3", "ZONE-RM-01", 850.5, 35.2001, 31.9021),
    ("DEMO-RM-Z02-B04-P210", "210", "04", "5", "ZONE-RM-02", 1200.0, 35.2105, 31.8950),
    ("DEMO-RM-Z01-B17-P088", "88", "17", "2", "ZONE-RM-01", 640.0, 35.1980, 31.9075),
    ("DEMO-RM-Z03-B22-P301", "301", "22", "7", "ZONE-RM-03", 980.0, 35.2200, 31.9100),
    ("DEMO-RM-Z02-B09-P057", "57", "09", "4", "ZONE-RM-02", 1500.0, 35.2150, 31.8990),
    ("DEMO-RM-Z03-B01-P012", "12", "01", "1", "ZONE-RM-03", 720.0, 35.2250, 31.9150),
]

# (status, type, priority, applicant_idx, parcel_idx)
APPS = [
    ("submitted", "first_registration", "normal", 0, 0),
    ("pre_checked", "ownership_transfer", "high", 1, 1),
    ("survey_required", "parcel_subdivision", "normal", 2, 2),
    ("surveyed", "parcel_merge", "normal", 5, 5),
    ("legal_review", "first_registration", "high", 1, 1),
    ("approved", "certificate_request", "normal", 4, 4),
    ("certificate_issued", "first_registration", "normal", 1, 1),
    ("closed", "ownership_transfer", "low", 0, 0),
    ("rejected", "boundary_correction", "normal", 3, 3),
    ("on_hold", "parcel_subdivision", "normal", 2, 2),
    ("missing_documents", "boundary_correction", "high", 3, 3),
    ("under_objection", "ownership_transfer", "high", 0, 0),
]

DOCS_BY_TYPE = {
    "first_registration": ["ownership_deed", "id_copy"],
    "ownership_transfer": ["ownership_deed", "id_copy", "sale_contract"],
    "parcel_subdivision": ["ownership_deed", "survey_report"],
    "parcel_merge": ["ownership_deed", "survey_report"],
    "boundary_correction": ["ownership_deed", "survey_report"],
    "certificate_request": ["id_copy"],
}


def reached(status):
    if status in MAIN_FLOW:
        return MAIN_FLOW[: MAIN_FLOW.index(status) + 1]
    if status in ("rejected", "on_hold", "missing_documents", "under_objection"):
        return ["submitted", "pre_checked", status]
    return ["submitted"]


def clear_demo():
    for col in (applicants_col, parcels_col, applications_col, logs_col, certificates_col):
        col.delete_many({"seed_demo": True})


def seed_applicants():
    for aid, name, atype, nid, email, city, hood, zone in APPLICANTS:
        applicants_col.update_one(
            {"applicant_id": aid},
            {"$set": {
                "seed_demo": True,
                "applicant_id": aid,
                "full_name": name,
                "applicant_type": atype,
                "verification_state": "verified",
                "identity": {"national_id": nid, "verified": True, "verification_method": "otp_stub"},
                "contacts": {"email": email, "phone": "+97059900" + nid[-4:]},
                "address": {"city": city, "neighborhood": hood, "zone_id": zone},
                "preferences": {"preferred_contact": "email", "language": "ar",
                                "notifications": {"on_status_change": True, "on_missing_documents": True, "on_certificate_ready": True}},
                "stats": {"total_applications": 1, "approved_applications": 0, "pending_applications": 1},
                "linked_applications": [],
                "created_at": BASE,
            }},
            upsert=True,
        )


def seed_parcels():
    for code, pno, bno, basin, zone, area, lng, lat in PARCELS:
        ring = [[lng, lat], [lng + 0.0014, lat], [lng + 0.0014, lat + 0.0009], [lng, lat + 0.0009], [lng, lat]]
        parcels_col.update_one(
            {"parcel_code": code},
            {"$set": {
                "seed_demo": True,
                "parcel_code": code,
                "parcel_number": pno, "block_number": bno, "basin_number": basin, "zone_id": zone,
                "area_sqm": area, "land_use": "residential", "registration_status": "registered",
                "geometry": {"type": "Polygon", "coordinates": [ring]},
                "dispute_state": "none",
                "created_at": BASE, "updated_at": BASE,
            }},
            upsert=True,
        )


def seed_applications():
    cert_seq = 0
    for i, (status, atype, priority, ai, pi) in enumerate(APPS):
        application_id = f"LRMIS-2026-{101 + i:04d}"
        applicant = APPLICANTS[ai]
        parcel = PARCELS[pi]
        submitted = BASE + timedelta(days=i)
        path = reached(status)

        timestamps = {f: None for f in TS_FIELD.values()}
        timestamps["updated_at"] = submitted
        events = []
        for step, st in enumerate(path):
            at = submitted + timedelta(hours=step * 6)
            if st in TS_FIELD:
                timestamps[TS_FIELD[st]] = at
            timestamps["updated_at"] = at
            actor_type, actor_id = ACTOR[st]
            meta = {}
            if st == "rejected":
                meta = {"reason": "Ownership documents could not be verified"}
            if st == "missing_documents":
                meta = {"note": "Sale contract is missing"}
            events.append({"type": st, "by": {"actor_type": actor_type, "actor_id": actor_id}, "at": at, "meta": meta})

        required_documents = [
            {"document_type": dt, "required": True, "status": "verified" if status in ("approved", "certificate_issued", "closed") else "pending_review"}
            for dt in DOCS_BY_TYPE.get(atype, ["id_copy"])
        ]

        doc = {
            "seed_demo": True,
            "application_id": application_id,
            "idempotency_key": None,
            "application_type": atype,
            "priority": priority,
            "status": status,
            "applicant_ref": {"applicant_id": applicant[0], "applicant_type": applicant[2], "submitted_by_representative": False},
            "parcel": {"parcel_no": parcel[1], "block_no": parcel[2], "basin_no": parcel[3], "zone_id": parcel[4],
                       "geometry": {"type": "Polygon", "coordinates": [[[parcel[6], parcel[7]], [parcel[6] + 0.0014, parcel[7]],
                                    [parcel[6] + 0.0014, parcel[7] + 0.0009], [parcel[6], parcel[7] + 0.0009], [parcel[6], parcel[7]]]]}},
            "description": f"{atype.replace('_', ' ').title()} application for parcel {parcel[1]} / {parcel[2]}.",
            "tags": [atype],
            "required_documents": required_documents,
            "workflow": {"current_state": status, "allowed_next": ALLOWED_NEXT[status], "transition_rules_version": "v1.0"},
            "assignment": {"assigned_surveyor_id": None, "assigned_registrar_id": "S14", "assignment_policy": "zone+workload+availability"},
            "objection": {"has_objection": status == "under_objection", "objection_ids": []},
            "internal": {"notes": ["Initial pre-check completed."] if status != "submitted" else [], "visibility": "staff_only"},
            "timestamps": {"submitted_at": submitted, **timestamps},
            "submission_date": submitted,
            "comments": [],
        }
        if status == "rejected":
            doc["rejection_reason"] = "Ownership documents could not be verified"
        if status == "on_hold":
            doc["hold_reason"] = "Awaiting updated survey schedule"
            doc["previous_state"] = "survey_required"

        if status in ("certificate_issued", "closed"):
            cert_seq += 1
            certificate_id = f"CERT-2026-{100 + cert_seq:04d}"
            doc["certificate_ref"] = certificate_id
            certificates_col.update_one(
                {"certificate_id": certificate_id},
                {"$set": {
                    "seed_demo": True,
                    "certificate_id": certificate_id,
                    "application_id": application_id,
                    "parcel_id": parcel[0],
                    "certificate_type": "ownership_certificate",
                    "status": "issued",
                    "issued_to": {"applicant_id": applicant[0], "full_name": applicant[1]},
                    "issued_at": submitted + timedelta(days=2),
                    "issued_by": "registrar_09",
                    "verification": {"qr_code_url": f"/certificates/{certificate_id}/verify", "digital_signature_stub": "signed_hash_example"},
                }},
                upsert=True,
            )

        applications_col.update_one({"application_id": application_id}, {"$set": doc}, upsert=True)
        logs_col.update_one(
            {"application_id": application_id},
            {"$set": {"seed_demo": True, "application_id": application_id, "event_stream": events, "computed_kpis": {}}},
            upsert=True,
        )


if __name__ == "__main__":
    clear_demo()
    seed_applicants()
    seed_parcels()
    seed_applications()
    print("Demo data inserted:")
    print("  applicants:   ", applicants_col.count_documents({"seed_demo": True}))
    print("  parcels:      ", parcels_col.count_documents({"seed_demo": True}))
    print("  applications: ", applications_col.count_documents({"seed_demo": True}))
    print("  certificates: ", certificates_col.count_documents({"seed_demo": True}))
    print("  logs:         ", logs_col.count_documents({"seed_demo": True}))
    print("Application IDs: LRMIS-2026-0101 .. LRMIS-2026-0112")
