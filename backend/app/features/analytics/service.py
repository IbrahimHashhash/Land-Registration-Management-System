from app.database import applications_col, staff_col, survey_tasks_col, db

certificates_col = db["certificates"]
parcels_col = db["parcels"]


def get_kpis():
    total = applications_col.count_documents({})
    pending = applications_col.count_documents({"status": {"$in": ["submitted", "pre_checked", "survey_required"]}})
    approved = applications_col.count_documents({"status": "approved"})
    rejected = applications_col.count_documents({"status": "rejected"})
    under_objection = applications_col.count_documents({"status": "under_objection"})
    return {"total": total, "pending": pending, "approved": approved, "rejected": rejected, "under_objection": under_objection}


def get_applications_by_status():
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_applications_by_zone():
    pipeline = [
        {"$match": {"status": {"$in": ["submitted", "pre_checked", "survey_required"]}}},
        {"$group": {"_id": "$parcel_ref.zone_id", "count": {"$sum": 1}}},
    ]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_surveyor_workload():
    surveyors = list(staff_col.find({"role": "surveyor"}, {"name": 1, "workload": 1, "staff_code": 1}))
    return [
        {"staff_code": s["staff_code"], "name": s["name"], "active_tasks": s["workload"]["active_tasks"], "max_tasks": s["workload"]["max_tasks"]}
        for s in surveyors
    ]


def get_applications_over_time():
    pipeline = [
        {"$match": {"timestamps.submitted_at": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$timestamps.submitted_at"}}, "count": {"$sum": 1}}},
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


def _centroid(geometry: dict):
    if not geometry or geometry.get("type") != "Polygon":
        return None
    ring = geometry["coordinates"][0]
    lng = sum(p[0] for p in ring) / len(ring)
    lat = sum(p[1] for p in ring) / len(ring)
    return [lng, lat]


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
        parcel = parcels_col.find_one({"_id": app.get("parcel_ref", {}).get("parcel_id")})
        if not parcel:
            continue
        point = _centroid(parcel.get("geometry"))
        if not point:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": point},
            "properties": {
                "application_id": app.get("application_id"),
                "status": app.get("status"),
                "application_type": app.get("application_type"),
                "zone_id": app.get("parcel_ref", {}).get("zone_id"),
                "parcel_number": app.get("parcel_ref", {}).get("parcel_number"),
                "dispute_state": parcel.get("dispute_state", "none"),
            },
        })
    return {"type": "FeatureCollection", "features": features}
