import api from './client'

const staffHeaders = (role = 'surveyor') => ({ headers: { 'X-Staff-Role': role } })

export const getStaff = (id) => api.get(`/staff/${id}`, staffHeaders())

export const listStaff = (role) => api.get('/staff/', { ...staffHeaders(), params: role ? { role } : {} })

export const getMyTasks = (surveyorId) => api.get(`/staff/${surveyorId}/tasks`, staffHeaders())

export const autoAssignSurveyor = (applicationId) =>
  api.post(`/applications/${applicationId}/auto-assign-surveyor`, null, staffHeaders())

export const reassignSurveyor = (applicationId, newSurveyorId) =>
  api.patch(`/applications/${applicationId}/reassign-surveyor`, { new_surveyor_id: newSurveyorId }, staffHeaders())

export const updateMilestone = (applicationId, data) =>
  api.patch(`/applications/${applicationId}/survey-milestone`, data, staffHeaders())

export const uploadSurveyReport = (applicationId, data) =>
  api.post(`/applications/${applicationId}/survey-report`, data, staffHeaders())

export const addFieldNote = (applicationId, data) =>
  api.post(`/applications/${applicationId}/field-note`, data, staffHeaders())

export const getSurveyResults = (applicationId) =>
  api.get(`/applications/${applicationId}/survey-results`, staffHeaders('registrar'))

export const registrarReview = (applicationId, data) =>
  api.patch(`/applications/${applicationId}/registrar-review`, data, staffHeaders('registrar'))
