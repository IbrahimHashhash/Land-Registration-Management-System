# Database Schema

LRMIS uses MongoDB. Collection names, document shapes, and indexes below
match what `backend/app/database.py` creates on startup.

## Collections

| Collection             | Purpose |
|------------------------|---------|
| `applicants`           | Applicant profiles (citizens, lawyers, companies, surveyors, representatives). |
| `land_applications`    | The land registration applications and their workflow state. |
| `application_documents`| Uploaded ownership / ID / sale-contract documents per application. |
| `objections`           | Third-party or applicant disputes filed against an application. |
| `parcels`              | Cadastral parcels with GeoJSON boundaries (used for the live map and geofeeds). |
| `staff_members`        | Surveyors and registrar officers. |
| `survey_tasks`         | Field tasks created when an application is auto-assigned to a surveyor. |
| `survey_reports`       | Final survey report metadata uploaded by surveyors. |
| `certificates`         | Generated land registration certificates. |
| `performance_logs`     | Append-only audit log per application; one document per application with an `event_stream` array. |
| `notifications`        | Stub email/SMS deliveries written by `app/utils/notifications.py`. |

## Indexes

Created at startup by `database._ensure_index`:

```
applicants                identity.national_id          (unique)
application_documents     application_id
objections                application_id
performance_logs          application_id                (unique)
staff_members             staff_code                    (unique)
survey_tasks              application_id

land_applications         application_id                (unique)
land_applications         status
land_applications         application_type
land_applications         parcel.zone_id
land_applications         submission_date

parcels                   parcel_code                   (unique)
parcels                   zone_id
parcels                   geometry                      (2dsphere)

certificates              certificate_id                (unique)
```

The `2dsphere` index on `parcels.geometry` powers the `$geoNear` query in
`/analytics/geofeeds/parcels-near` and the live map.

## Sample documents

### applicants

```json
{
  "applicant_id": "APP-DEMO0001",
  "full_name": "Nour Ahmad",
  "applicant_type": "citizen",
  "verification_state": "verified",
  "identity": {
    "national_id": "990000001",
    "verified": true,
    "verification_method": "otp_stub"
  },
  "contacts": { "email": "nour@example.com", "phone": "+970599..." },
  "address": { "city": "Ramallah", "neighborhood": "Al Tireh", "zone_id": "ZONE-RM-01" },
  "preferences": {
    "preferred_contact": "email",
    "language": "ar",
    "notifications": {
      "on_status_change": true,
      "on_missing_documents": true,
      "on_certificate_ready": true
    }
  },
  "stats": { "total_applications": 1, "approved_applications": 0, "pending_applications": 1 },
  "linked_applications": [],
  "created_at": "2026-02-01T09:00:00Z"
}
```

### land_applications

```json
{
  "application_id": "LRMIS-2026-0001",
  "application_type": "ownership_transfer",
  "status": "pre_checked",
  "priority": "normal",
  "applicant_ref": {
    "applicant_id": "APP-DEMO0001",
    "applicant_type": "citizen",
    "submitted_by_representative": false
  },
  "parcel": {
    "parcel_no": "145", "block_no": "12", "basin_no": "3", "zone_id": "ZONE-RM-01",
    "geometry": { "type": "Polygon", "coordinates": [[[35.2001, 31.9021], [35.2015, 31.9021], [35.2015, 31.9030], [35.2001, 31.9030], [35.2001, 31.9021]]] }
  },
  "workflow": {
    "current_state": "pre_checked",
    "allowed_next": ["survey_required", "legal_review", "missing_documents", "on_hold", "rejected"],
    "transition_rules_version": "v1.0"
  },
  "required_documents": [
    { "document_type": "ownership_deed", "required": true, "status": "verified" },
    { "document_type": "id_copy", "required": true, "status": "verified" }
  ],
  "timestamps": {
    "submitted_at": "2026-02-01T09:00:00Z",
    "pre_checked_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-01T10:00:00Z"
  },
  "assignment": { "assigned_surveyor_id": null, "assigned_registrar_id": "S14", "assignment_policy": "zone+workload+availability" },
  "objection": { "has_objection": false, "objection_ids": [] },
  "internal": { "notes": ["Pre-check completed."], "visibility": "staff_only" }
}
```

### parcels

```json
{
  "parcel_code": "RM-Z01-B12-P145",
  "parcel_number": "145", "block_number": "12", "basin_number": "3",
  "zone_id": "ZONE-RM-01", "area_sqm": 850.5, "land_use": "residential",
  "registration_status": "registered",
  "geometry": { "type": "Polygon", "coordinates": [[[35.2001, 31.9021], [35.2015, 31.9021], [35.2015, 31.9030], [35.2001, 31.9030], [35.2001, 31.9021]]] },
  "dispute_state": "none"
}
```

### staff_members

```json
{
  "staff_code": "SURV-RM-04",
  "name": "Survey Team A",
  "role": "surveyor",
  "department": "Cadastral Survey",
  "skills": ["boundary_survey", "parcel_subdivision", "gps_mapping"],
  "coverage": { "zone_ids": ["ZONE-RM-01", "ZONE-RM-02"] },
  "schedule": {
    "timezone": "Asia/Jerusalem",
    "shifts": [{ "day": "Mon", "start": "08:00", "end": "16:00" }],
    "on_call": false
  },
  "workload": { "active_tasks": 4, "max_tasks": 10 },
  "active": true
}
```

### survey_tasks

```json
{
  "task_id": "SURV-2026-0001",
  "application_id": "LRMIS-2026-0001",
  "assigned_surveyor_id": "<ObjectId of staff>",
  "status": "visit_scheduled",
  "milestones": [
    { "type": "assigned",         "at": "2026-02-02T08:00:00Z", "by": "system",   "meta": { "reason": "zone and workload match" } },
    { "type": "visit_scheduled",  "at": "2026-02-03T09:00:00Z", "by": "<surveyor_id>", "meta": { "scheduled_date": "2026-02-05" } }
  ],
  "field_notes": [],
  "report_uploaded": false
}
```

### performance_logs

One document per application; events are appended to `event_stream`.

```json
{
  "application_id": "LRMIS-2026-0001",
  "event_stream": [
    { "type": "submitted",        "by": { "actor_type": "applicant", "actor_id": "APP-DEMO0001" }, "at": "2026-02-01T09:00:00Z", "meta": { "channel": "web" } },
    { "type": "pre_checked",      "by": { "actor_type": "registrar", "actor_id": "S14" },          "at": "2026-02-01T10:00:00Z", "meta": { "missing_documents": 0 } }
  ],
  "computed_kpis": {}
}
```

### certificates

```json
{
  "certificate_id": "CERT-2026-0001",
  "application_id": "LRMIS-2026-0001",
  "certificate_type": "ownership_certificate",
  "status": "issued",
  "issued_to": { "applicant_id": "APP-DEMO0001", "full_name": "Nour Ahmad" },
  "issued_at": "2026-02-10T12:00:00Z",
  "issued_by": "registrar_09",
  "verification": { "qr_code_url": "/certificates/CERT-2026-0001/verify", "digital_signature_stub": "signed_hash_example" }
}
```

## ID conventions

| Entity         | ID format          | Source |
|----------------|--------------------|--------|
| Applicant      | `APP-XXXXXXXX`     | uuid4 (first 8 hex, uppercased), generated server-side |
| Application    | `LRMIS-YYYY-NNNN`  | year-scoped sequential, generated by `utils/ids.next_application_id()` |
| Certificate    | `CERT-YYYY-NNNN`   | year-scoped sequential, generated by `utils/ids.next_certificate_id()` |
| Survey task    | `SURV-YYYY-NNNN`   | sequential, generated by `staff/service.create_survey_task()` |
| Document       | `DOC-XXXXXXXX`     | uuid4-derived |
| Comment        | `CMT-XXXXXXXX`     | uuid4-derived |
| Objection      | `OBJ-XXXXXXXX`     | uuid4-derived |

Foreign keys between applications and applicants/parcels are stored as the
business string IDs (`applicant_id`, `application_id`) for portability;
parcels are referenced by `parcel_code` from analytics queries.

## Caching

Heavy analytics aggregations (e.g. `/analytics/kpis`) are cached in-process
for 30 seconds via `analytics/service._cached`.
