import csv
import io
import time
from app.database import applications_col, staff_col, survey_tasks_col, parcels_col, certificates_col

PENDING_STATUSES = ["submitted", "pre_checked", "survey_required", "surveyed",
                    "legal_review", "under_objection", "missing_documents", "on_hold"]
DONE_STATUSES = ["approved", "certificate_issued", "closed"]
COMPLETED_TASK = ["report_uploaded", "registrar_reviewed"]

# ---- simple in-memory TTL cache for heavy aggregations ----
_CACHE = {}
_TTL_SECONDS = 30


def _cached(key, fn):
    now = time.time()
    hit = _CACHE.get(key)
    if hit and now - hit[0] < _TTL_SECONDS:
        return hit[1]
    value = fn()
    _CACHE[key] = (now, value)
    return value


def _zone_expr():
    return {"$ifNull": ["$parcel.zone_id", "$parcel_ref.zone_id"]}


def _submitted_expr():
    return {"$ifNull": ["$timestamps.submitted_at", "$submission_date"]}


# ---- main KPIs (uses $facet) ----
def get_kpis():
    def compute():
        pipeline = [{"$facet": {
            "total": [{"$count": "n"}],
            "by_status": [{"$group": {"_id": "$status", "n": {"$sum": 1}}}],
        }}]
        doc = next(applications_col.aggregate(pipeline), {})
        by_status = {d["_id"]: d["n"] for d in doc.get("by_status", [])}
        total = (doc.get("total") or [{"n": 0}])[0].get("n", 0)
        approved = by_status.get("approved", 0)
        rejected = by_status.get("rejected", 0)
        done = sum(by_status.get(s, 0) for s in DONE_STATUSES)
        decided = done + rejected
        return {
            "total": total,
            "pending": sum(by_status.get(s, 0) for s in PENDING_STATUSES),
            "approved": approved,
            "rejected": rejected,
            "under_objection": by_status.get("under_objection", 0),
            "certificate_issued": by_status.get("certificate_issued", 0),
            "approval_rate": round(done / decided * 100, 1) if decided else 0.0,
        }
    return _cached("kpis", compute)


def get_applications_by_status():
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_applications_by_type():
    pipeline = [{"$group": {"_id": "$application_type", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_applications_by_zone():
    pipeline = [
        {"$match": {"status": {"$in": PENDING_STATUSES}}},
        {"$group": {"_id": _zone_expr(), "count": {"$sum": 1}}},
    ]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


# ---- hotspot zones (most applications) ----
def get_hotspot_zones(limit=5):
    pipeline = [
        {"$group": {"_id": _zone_expr(), "count": {"$sum": 1}}},
        {"$match": {"_id": {"$ne": None}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    return [{"zone_id": d["_id"], "count": d["count"]} for d in applications_col.aggregate(pipeline)]


# ---- delayed applications (pending too long) ----
def get_delayed_applications(threshold_days=14):
    pipeline = [
        {"$match": {"status": {"$in": PENDING_STATUSES}}},
        {"$addFields": {"_submitted": _submitted_expr()}},
        {"$match": {"_submitted": {"$ne": None}}},
        {"$addFields": {"age_days": {"$dateDiff": {"startDate": "$_submitted", "endDate": "$$NOW", "unit": "day"}}}},
        {"$match": {"age_days": {"$gte": threshold_days}}},
        {"$sort": {"age_days": -1}},
        {"$project": {"_id": 0, "application_id": 1, "status": 1, "application_type": 1,
                      "age_days": 1, "zone_id": _zone_expr()}},
    ]
    return list(applications_col.aggregate(pipeline))


# ---- backlog distribution by age (uses $bucketAuto) ----
def get_backlog_by_age():
    pipeline = [
        {"$match": {"status": {"$in": PENDING_STATUSES}}},
        {"$addFields": {"_submitted": _submitted_expr()}},
        {"$match": {"_submitted": {"$ne": None}}},
        {"$addFields": {"age_days": {"$dateDiff": {"startDate": "$_submitted", "endDate": "$$NOW", "unit": "day"}}}},
        {"$bucketAuto": {"groupBy": "$age_days", "buckets": 4}},
    ]
    return [{"min_days": b["_id"]["min"], "max_days": b["_id"]["max"], "count": b["count"]}
            for b in applications_col.aggregate(pipeline)]


# ---- surveyor workload (uses $lookup) ----
def get_surveyor_workload():
    pipeline = [
        {"$match": {"role": "surveyor"}},
        {"$lookup": {"from": "survey_tasks", "localField": "_id", "foreignField": "assigned_surveyor_id", "as": "tasks"}},
        {"$project": {
            "_id": 0, "staff_code": 1, "name": 1,
            "max_tasks": "$workload.max_tasks",
            "active_tasks": {"$size": {"$filter": {"input": "$tasks", "as": "t", "cond": {"$not": [{"$in": ["$$t.status", COMPLETED_TASK]}]}}}},
            "completed_tasks": {"$size": {"$filter": {"input": "$tasks", "as": "t", "cond": {"$in": ["$$t.status", COMPLETED_TASK]}}}},
        }},
        {"$sort": {"name": 1}},
    ]
    return list(staff_col.aggregate(pipeline))


def get_registrar_workload():
    registrars = list(staff_col.find({"role": "registrar"}, {"name": 1, "staff_code": 1}))
    result = []
    for r in registrars:
        ids = [i for i in [r.get("staff_code"), str(r["_id"])] if i]
        reviewed = applications_col.count_documents({"assignment.assigned_registrar_id": {"$in": ids}})
        result.append({"staff_code": r.get("staff_code"), "name": r.get("name"), "reviewed_applications": reviewed})
    return result


# ---- document verification status (uses $unwind) ----
def get_document_status():
    pipeline = [
        {"$unwind": "$required_documents"},
        {"$group": {"_id": "$required_documents.status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_applications_over_time():
    pipeline = [
        {"$addFields": {"_submitted": _submitted_expr()}},
        {"$match": {"_submitted": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$_submitted"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    return [{"month": doc["_id"], "count": doc["count"]} for doc in applications_col.aggregate(pipeline)]


def get_processing_time():
    pipeline = [
        {"$match": {"timestamps.submitted_at": {"$ne": None}, "timestamps.approved_at": {"$ne": None}}},
        {"$project": {
            "application_type": 1,
            "days": {"$divide": [{"$subtract": ["$timestamps.approved_at", "$timestamps.submitted_at"]}, 1000 * 60 * 60 * 24]},
        }},
        {"$group": {"_id": "$application_type", "avg_days": {"$avg": "$days"}}},
        {"$sort": {"_id": 1}},
    ]
    return [{"application_type": doc["_id"], "avg_days": round(doc["avg_days"], 1)} for doc in applications_col.aggregate(pipeline)]


def get_certificates_per_month():
    pipeline = [
        {"$match": {"issued_at": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$issued_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    return [{"month": doc["_id"], "count": doc["count"]} for doc in certificates_col.aggregate(pipeline)]


# ---- geospatial feeds ----
def _to_point(geometry: dict):
    if not geometry:
        return None
    if geometry.get("type") == "Point":
        return geometry.get("coordinates")
    if geometry.get("type") == "Polygon":
        ring = geometry["coordinates"][0]
        lng = sum(p[0] for p in ring) / len(ring)
        lat = sum(p[1] for p in ring) / len(ring)
        return [lng, lat]
    return None


def get_parcels_geofeed():
    parcels = list(parcels_col.find({"geometry": {"$exists": True}}))
    features = []
    for p in parcels:
        features.append({
            "type": "Feature",
            "geometry": p["geometry"],
            "properties": {
                "parcel_code": p.get("parcel_code"),
                "zone_id": p.get("zone_id"),
                "status": p.get("registration_status"),
                "dispute_state": p.get("dispute_state", "none"),
            },
        })
    return {"type": "FeatureCollection", "features": features}


def get_applications_geofeed():
    features = []
    for app in applications_col.find({}):
        parcel_block = app.get("parcel") or app.get("parcel_ref") or {}
        geometry = parcel_block.get("geometry")
        parcel_doc = None
        if not geometry:
            parcel_id = parcel_block.get("parcel_id")
            parcel_doc = parcels_col.find_one({"_id": parcel_id}) if parcel_id else None
            geometry = parcel_doc.get("geometry") if parcel_doc else None
        point = _to_point(geometry)
        if not point:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": point},
            "properties": {
                "application_id": app.get("application_id"),
                "status": app.get("status"),
                "application_type": app.get("application_type"),
                "zone_id": parcel_block.get("zone_id"),
                "parcel_number": parcel_block.get("parcel_no") or parcel_block.get("parcel_number"),
                "dispute_state": (parcel_doc or {}).get("dispute_state", "none"),
            },
        })
    return {"type": "FeatureCollection", "features": features}


def get_pending_heatmap():
    features = []
    for app in applications_col.find({"status": {"$in": PENDING_STATUSES}}):
        parcel_block = app.get("parcel") or app.get("parcel_ref") or {}
        geometry = parcel_block.get("geometry")
        if not geometry:
            parcel_id = parcel_block.get("parcel_id")
            parcel_doc = parcels_col.find_one({"_id": parcel_id}) if parcel_id else None
            geometry = parcel_doc.get("geometry") if parcel_doc else None
        point = _to_point(geometry)
        if not point:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": point},
            "properties": {"weight": 1, "zone_id": parcel_block.get("zone_id"), "status": app.get("status")},
        })
    return {"type": "FeatureCollection", "features": features}


# ---- parcels near a point (uses $geoNear geospatial query) ----
def get_parcels_near(lng: float, lat: float, max_meters: int = 5000):
    pipeline = [
        {"$geoNear": {"near": {"type": "Point", "coordinates": [lng, lat]}, "distanceField": "distance_m",
                      "maxDistance": max_meters, "spherical": True}},
        {"$limit": 20},
        {"$project": {"_id": 0, "parcel_code": 1, "zone_id": 1, "geometry": 1, "distance_m": {"$round": ["$distance_m", 0]}}},
    ]
    return list(parcels_col.aggregate(pipeline))


# ---- CSV export (management report) ----
def export_applications_csv() -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["application_id", "application_type", "status", "priority",
                     "applicant_id", "parcel_no", "block_no", "zone_id", "submission_date"])
    for a in applications_col.find({}).sort("submission_date", -1):
        parcel = a.get("parcel") or a.get("parcel_ref") or {}
        submitted = a.get("submission_date") or (a.get("timestamps") or {}).get("submitted_at")
        writer.writerow([
            a.get("application_id"), a.get("application_type"), a.get("status"), a.get("priority"),
            (a.get("applicant_ref") or {}).get("applicant_id"),
            parcel.get("parcel_no") or parcel.get("parcel_number"),
            parcel.get("block_no") or parcel.get("block_number"),
            parcel.get("zone_id"),
            submitted.isoformat() if hasattr(submitted, "isoformat") else submitted,
        ])
    return output.getvalue()
