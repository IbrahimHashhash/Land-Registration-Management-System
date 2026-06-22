import re
from datetime import datetime, timezone

_SUFFIX = re.compile(r"(\d+)$")


def _next_number(col, field: str, prefix: str) -> int:
    highest = 0
    for doc in col.find({field: {"$regex": "^" + re.escape(prefix)}}, {field: 1}):
        match = _SUFFIX.search(doc.get(field, ""))
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def next_application_id() -> str:
    from app.database import applications_col
    prefix = f"LRMIS-{datetime.now(timezone.utc).year}-"
    return f"{prefix}{_next_number(applications_col, 'application_id', prefix):04d}"


def next_certificate_id() -> str:
    from app.database import certificates_col
    prefix = f"CERT-{datetime.now(timezone.utc).year}-"
    return f"{prefix}{_next_number(certificates_col, 'certificate_id', prefix):04d}"
