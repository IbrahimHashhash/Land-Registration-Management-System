import api from './client'

export async function registerApplicant(user) {
  const res = await api.post('/applicants/', {
    full_name: user.name,
    applicant_type: user.applicantType,
    identity: { 
      national_id: user.nationalId,
      verified: user.verified,
      verification_method: user.verificationMethod,
    },
    contacts: { email: user.email, phone: user.phone },
    address: { city: user.city, neighborhood: user.address, zone_id: user.zoneId },
    preferences: {
      preferred_contact: 'email',
      language: 'en',
      notifications: { on_status_change: true, on_missing_documents: true, on_certificate_ready: true },
    },
    profile_public: false,
  })
  return res.data
}

export async function submitApplication(payload) {
  const res = await api.post('/applications/', payload)
  return res.data
}

export async function getApplicant(applicantId) {
  const res = await api.get(`/applicants/${applicantId}`)
  return res.data
}

export async function getApplicantByNationalId(nationalId) {
  const res = await api.get(`/applicants/by-national-id/${encodeURIComponent(nationalId)}`)
  return res.data
}

export async function getApplicantObjections(applicantId) {
  const res = await api.get(`/applicants/${applicantId}/objections`)
  return res.data
}

export async function getApplicationDocuments(applicationId) {
  const res = await api.get(`/applications/${applicationId}/documents`)
  return res.data
}

export async function getApplicantApplications(applicantId) {
  const res = await api.get(`/applicants/${applicantId}/applications`)
  return res.data
}

export async function getTimeline(applicationId) {
  const res = await api.get(`/applications/${applicationId}/timeline`)
  return res.data
}

export async function uploadDocument(applicationId, payload) {
  const res = await api.post(`/applications/${applicationId}/documents`, payload)
  return res.data
}

export async function submitObjection(applicationId, payload) {
  const res = await api.post(`/applications/${applicationId}/objections`, payload)
  return res.data
}

export async function addComment(applicationId, payload) {
  const res = await api.post(`/applications/${applicationId}/comments`, payload)
  return res.data
}
