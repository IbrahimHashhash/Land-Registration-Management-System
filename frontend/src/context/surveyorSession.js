// Lightweight surveyor session: persists selected surveyor in localStorage so
// SurveyorTaskList / SurveyorTaskExecution can scope API calls to a real staff_id.

const STORAGE_KEY = 'lrmis.surveyor'

export function getSurveyor() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSurveyor(surveyor) {
  if (!surveyor) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyor))
}

export function getSurveyorId() {
  const s = getSurveyor()
  return s?.id || null
}
