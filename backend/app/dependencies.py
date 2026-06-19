from fastapi import Header, HTTPException

STAFF_ROLES = {"surveyor", "registrar"}


def require_staff_role(x_staff_role: str = Header(default=None)):
    if x_staff_role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Staff access required")
    return x_staff_role
