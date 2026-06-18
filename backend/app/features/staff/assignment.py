from datetime import datetime, timezone
from app.database import staff_col

SKILL_MAP = {
    "first_registration": ["boundary_survey", "gps_mapping"],
    "ownership_transfer": ["boundary_survey"],
    "parcel_subdivision": ["parcel_subdivision", "gps_mapping"],
    "parcel_merge": ["parcel_subdivision"],
    "boundary_correction": ["boundary_survey", "gps_mapping"],
    "certificate_request": [],
}

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _is_available_today(schedule: dict) -> bool:
    now = datetime.now(timezone.utc)
    day_abbr = DAYS[now.weekday()]
    for shift in schedule.get("shifts", []):
        if shift["day"] == day_abbr:
            return True
    return schedule.get("on_call", False)


def _skill_score(surveyor_skills: list, application_type: str) -> int:
    needed = SKILL_MAP.get(application_type, [])
    if not needed:
        return 1
    return sum(1 for s in needed if s in surveyor_skills)


def find_best_surveyor(zone_id: str, application_type: str, priority: str) -> dict | None:
    candidates = list(staff_col.find({
        "role": "surveyor",
        "active": True,
        "coverage.zone_ids": zone_id,
    }))

    available = [c for c in candidates if _is_available_today(c.get("schedule", {}))]
    if not available:
        available = candidates

    eligible = [c for c in available if c["workload"]["active_tasks"] < c["workload"]["max_tasks"]]
    if not eligible:
        return None

    def score(s):
        skill = _skill_score(s.get("skills", []), application_type)
        workload_ratio = s["workload"]["active_tasks"] / max(s["workload"]["max_tasks"], 1)
        priority_bonus = 1 if priority == "high" and skill > 0 else 0
        return (skill + priority_bonus, -workload_ratio)

    eligible.sort(key=score, reverse=True)
    return eligible[0]
