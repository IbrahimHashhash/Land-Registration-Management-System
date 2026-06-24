def parcel_of(app: dict) -> dict:
    return app.get("parcel") or app.get("parcel_ref") or {}


def parcel_number_of(app: dict):
    p = parcel_of(app)
    return p.get("parcel_no") or p.get("parcel_number")


def parcel_zone_of(app: dict):
    return parcel_of(app).get("zone_id")
