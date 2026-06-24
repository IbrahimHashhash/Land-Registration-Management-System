import api from './client'

export const listApplications = (params) => api.get('/applications/', { params })

export const getApplication = (id) => api.get(`/applications/${id}`)

export const getTimeline = (id) => api.get(`/applications/${id}/timeline`)

export const listDocuments = (id) => api.get(`/applications/${id}/documents`)

export const createApplication = (data, idempotencyKey) =>
  api.post('/applications/', data, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined)

export const transitionApplication = (id, data) => api.patch(`/applications/${id}/transition`, data)

export const holdApplication = (id, data) => api.post(`/applications/${id}/hold`, data)

export const rejectApplication = (id, data) => api.post(`/applications/${id}/reject`, data)

export const issueCertificate = (id, data) => api.post(`/applications/${id}/certificate`, data)

export const verifyDocument = (applicationId, documentId, data) =>
  api.patch(`/applications/${applicationId}/documents/${documentId}/verify`, data, { headers: { 'X-Staff-Role': 'registrar' } })

export const listCertificates = () => api.get('/certificates/')
