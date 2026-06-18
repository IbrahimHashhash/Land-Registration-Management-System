from app.database import applications_col, staff_col, survey_tasks_col, db


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
    pipeline = [{"$group": {"_id": "$parcel_ref.zone_id", "count": {"$sum": 1}}}]
    return {doc["_id"]: doc["count"] for doc in applications_col.aggregate(pipeline)}


def get_surveyor_workload():
    surveyors = list(staff_col.find({"role": "surveyor"}, {"name": 1, "workload": 1, "staff_code": 1}))
    return [{"staff_code": s["staff_code"], "name": s["name"], "active_tasks": s["workload"]["active_tasks"], "max_tasks": s["workload"]["max_tasks"]} for s in surveyors]


def get_parcels_geofeed():
    parcels = list(db["parcels"].find({"geometry": {"$exists": True}}))
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
