from bson import ObjectId
from fastapi import HTTPException
from app.database import certificates_col


def _clean(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items()}
    return value


def list_certificates() -> list:
    return [_clean(dict(c)) for c in certificates_col.find().sort("issued_at", -1)]


def get_certificate(certificate_id: str) -> dict:
    cert = certificates_col.find_one({"certificate_id": certificate_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return _clean(dict(cert))
