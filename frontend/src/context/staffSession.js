// Staff session: persists which registrar/staff member is signed in to the
// staff console. Mirrors surveyorSession but for the registrar role.

const STORAGE_KEY = 'lrmis.staff'

export function getStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStaff(staff) {
  if (!staff) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(staff))
}

export function getStaffId() {
  return getStaff()?.id || null
}
