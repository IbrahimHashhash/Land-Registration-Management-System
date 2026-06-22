TRANSITION_RULES_VERSION = "v1.0"

ALLOWED_NEXT = {
    "submitted":          ["pre_checked", "missing_documents", "on_hold", "rejected"],
    "pre_checked":        ["survey_required", "legal_review", "missing_documents", "on_hold", "rejected"],
    "survey_required":    ["surveyed", "on_hold", "rejected"],
    "surveyed":           ["legal_review", "on_hold", "rejected"],
    "legal_review":       ["approved", "under_objection", "on_hold", "rejected"],
    "approved":           ["certificate_issued", "rejected"],
    "certificate_issued": ["closed"],
    "closed":             [],
    "rejected":           [],
    "on_hold":            ["pre_checked", "survey_required", "surveyed", "legal_review"],
    "missing_documents":  ["submitted", "pre_checked", "rejected"],
    "under_objection":    ["legal_review", "approved", "on_hold", "rejected"],
}

TIMESTAMP_FIELD = {
    "pre_checked":        "pre_checked_at",
    "survey_required":    "survey_required_at",
    "surveyed":           "surveyed_at",
    "legal_review":       "legal_review_at",
    "approved":           "approved_at",
    "certificate_issued": "certificate_issued_at",
    "closed":             "closed_at",
}


def allowed_next(state: str) -> list:
    return ALLOWED_NEXT.get(state, [])


def can_transition(current: str, target: str) -> bool:
    return target in ALLOWED_NEXT.get(current, [])
