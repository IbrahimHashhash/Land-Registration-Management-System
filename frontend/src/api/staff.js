import api from './client'

export const getStaff = (id) => api.get(`/staff/${id}`)

export const getMyTasks = (surveyorId) => api.get(`/staff/${surveyorId}/tasks`)

export const autoAssignSurveyor = (applicationId) =>
  api.post(`/staff/applications/${applicationId}/auto-assign-surveyor`)

export const updateMilestone = (applicationId, data) =>
  api.patch(`/staff/applications/${applicationId}/survey-milestone`, data)

export const uploadSurveyReport = (applicationId, data) =>
  api.post(`/staff/applications/${applicationId}/survey-report`, data)

export const registrarReview = (applicationId, data) =>
  api.patch(`/staff/applications/${applicationId}/registrar-review`, data)
