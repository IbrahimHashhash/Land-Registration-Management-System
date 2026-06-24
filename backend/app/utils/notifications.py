"""
Email / SMS notification stubs.

These do not send real messages. They write a structured line to stdout and to
a `notifications` MongoDB collection, so the audit trail shows that the system
*would* have sent the notification. The real integration would replace the
`_deliver` function with an SMTP / Twilio / SendGrid call.

The applicant's `preferences.notifications` flags + `preferred_contact` are
respected: if the applicant has opted out of a category, the notification is
suppressed.
"""

from datetime import datetime, timezone

from app.database import applicants_col, db

notifications_col = db["notifications"]


def _deliver(channel: str, to: str, subject: str, body: str, meta: dict) -> None:
    record = {
        "channel": channel,
        "to": to,
        "subject": subject,
        "body": body,
        "meta": meta,
        "sent_at": datetime.now(timezone.utc),
        "status": "stubbed",
    }
    notifications_col.insert_one(record)
    print(f"[NOTIFY:{channel}] to={to} subject={subject!r}")


def _resolve_applicant(applicant_id: str) -> dict | None:
    if not applicant_id:
        return None
    return applicants_col.find_one({"applicant_id": applicant_id})


def _category_enabled(applicant: dict, category: str) -> bool:
    prefs = (applicant or {}).get("preferences", {}) or {}
    return bool((prefs.get("notifications") or {}).get(category, True))


def _send(applicant: dict, subject: str, body: str, meta: dict) -> None:
    if not applicant:
        return
    contact = (applicant.get("preferences") or {}).get("preferred_contact", "email")
    contacts = applicant.get("contacts") or {}
    if contact == "phone":
        target = contacts.get("phone")
        if target:
            _deliver("sms", target, subject, body, meta)
    else:
        target = contacts.get("email")
        if target:
            _deliver("email", target, subject, body, meta)


# ---- public entry points -------------------------------------------------

def notify_status_change(applicant_id: str, application_id: str, new_status: str) -> None:
    applicant = _resolve_applicant(applicant_id)
    if not _category_enabled(applicant, "on_status_change"):
        return
    subject = f"Application {application_id} status: {new_status}"
    body = f"Your application {application_id} has moved to '{new_status}'."
    _send(applicant, subject, body, {"application_id": application_id, "status": new_status})


def notify_missing_documents(applicant_id: str, application_id: str) -> None:
    applicant = _resolve_applicant(applicant_id)
    if not _category_enabled(applicant, "on_missing_documents"):
        return
    subject = f"Application {application_id}: documents required"
    body = f"Your application {application_id} is waiting on missing documents. Please upload them."
    _send(applicant, subject, body, {"application_id": application_id})


def notify_certificate_ready(applicant_id: str, application_id: str, certificate_id: str) -> None:
    applicant = _resolve_applicant(applicant_id)
    if not _category_enabled(applicant, "on_certificate_ready"):
        return
    subject = f"Certificate {certificate_id} issued"
    body = f"Your certificate {certificate_id} for application {application_id} is ready."
    _send(applicant, subject, body, {"application_id": application_id, "certificate_id": certificate_id})
