from datetime import datetime, timezone
from bson import ObjectId
from app.database import staff_col


def create_staff(data: dict) -> dict:
    data["created_at"] = datetime.now(timezone.utc)
    result = staff_col.insert_one(data)
    data["_id"] = result.inserted_id
    return data


def get_staff_by_id(staff_id: str) -> dict | None:
    return staff_col.find_one({"_id": ObjectId(staff_id)})
