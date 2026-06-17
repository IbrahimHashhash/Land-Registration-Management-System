import { STATUS, TYPES } from '../theme'

const RAW_APPS = {
  nour: [
    { id: 'LRMIS-2026-0001', type: 'ownership_transfer', parcel: '145 / 12', zone: 'ZONE-RM-01', status: 'pre_checked',    submitted: 'Feb 01, 2026', nextStep: 'Awaiting survey assignment' },
    { id: 'LRMIS-2026-0003', type: 'parcel_subdivision', parcel: '88 / 17',  zone: 'ZONE-RM-01', status: 'survey_required', submitted: 'Feb 04, 2026', nextStep: 'Surveyor to be assigned' },
    { id: 'LRMIS-2026-0005', type: 'ownership_transfer', parcel: '145 / 12', zone: 'ZONE-RM-01', status: 'under_objection', submitted: 'Feb 06, 2026', nextStep: 'Objection under review' },
  ],
  khaled: [
    { id: 'LRMIS-2026-0002', type: 'first_registration', parcel: '210 / 04', zone: 'ZONE-RM-02', status: 'legal_review',        submitted: 'Feb 03, 2026', nextStep: 'Legal review in progress' },
    { id: 'LRMIS-2026-0008', type: 'first_registration', parcel: '420 / 30', zone: 'ZONE-RM-02', status: 'certificate_issued', submitted: 'Feb 09, 2026', nextStep: 'Certificate ready to collect' },
  ],
  lina: [
    { id: 'LRMIS-2026-0003', type: 'parcel_subdivision', parcel: '88 / 17', zone: 'ZONE-RM-01', status: 'survey_required', submitted: 'Feb 04, 2026', nextStep: 'Surveyor to be assigned' },
  ],
}

export function getAppsForUser(userId) {
  return (RAW_APPS[userId] || []).map(a => ({
    ...a,
    typeLabel: TYPES[a.type],
    statusLabel: STATUS[a.status]?.label,
    statusFg: STATUS[a.status]?.fg,
    statusBg: STATUS[a.status]?.bg,
  }))
}

const DONE_STATUSES   = new Set(['approved', 'certificate_issued'])
const ACTION_STATUSES = new Set(['missing_documents', 'under_objection'])

export function getKpis(userId) {
  const apps = getAppsForUser(userId)
  return {
    total:    apps.length,
    pending:  apps.filter(a => !DONE_STATUSES.has(a.status)).length,
    approved: apps.filter(a => DONE_STATUSES.has(a.status)).length,
    action:   apps.filter(a => ACTION_STATUSES.has(a.status)).length,
  }
}

const DOC_STATUS = {
  verified:       { sLabel: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review: { sLabel: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  missing:        { sLabel: 'Missing',        fg: '#b91c1c', bg: '#fbe6e6' },
}

function enrichDocs(arr) {
  return arr.map(d => ({ ...d, ...DOC_STATUS[d.status] }))
}

const TRACK_DATA = {
  'LRMIS-2026-0001': {
    timeline: [
      { event: 'Submitted',        actor: 'You · via web portal',          time: 'Feb 01, 2026 · 09:00', dot: '#1e5fae' },
      { event: 'Pre-Checked',      actor: 'Staff · Registrar Office',      time: 'Feb 01, 2026 · 10:00', dot: '#0f766e' },
      { event: 'Missing Document', actor: 'System · Sale contract needed', time: 'Feb 01, 2026 · 10:05', dot: '#b45309' },
    ],
    docs: enrichDocs([
      { type: 'Ownership Deed',   file: 'ownership_deed_145.pdf', status: 'verified' },
      { type: 'National ID Copy', file: 'id_copy_nour.pdf',       status: 'verified' },
      { type: 'Sale Contract',    file: '—',                      status: 'missing'  },
    ]),
    notes: [
      { actor: 'S14', date: 'Feb 01, 2026', text: 'Pre-check completed. Please upload the sale contract to proceed to survey stage.' },
    ],
    survey: { label: 'Awaiting Assignment', color: '#b45309', desc: 'Survey will be scheduled after missing documents are resolved.' },
    nextStep: 'Survey Assignment',
  },
  'LRMIS-2026-0003': {
    timeline: [
      { event: 'Submitted',   actor: 'You · via web portal',     time: 'Feb 04, 2026 · 09:00', dot: '#1e5fae' },
      { event: 'Pre-Checked', actor: 'Staff · Registrar Office', time: 'Feb 04, 2026 · 11:00', dot: '#0f766e' },
    ],
    docs: enrichDocs([
      { type: 'Ownership Deed',   file: 'ownership_deed_88.pdf', status: 'verified' },
      { type: 'National ID Copy', file: 'id_copy_nour.pdf',      status: 'verified' },
    ]),
    notes: [
      { actor: 'S22', date: 'Feb 04, 2026', text: 'Documents verified. Awaiting surveyor assignment for parcel subdivision.' },
    ],
    survey: { label: 'Pending Assignment', color: '#1e5fae', desc: 'Surveyor will be assigned within 3–5 business days.' },
    nextStep: 'Survey Assignment',
  },
  'LRMIS-2026-0005': {
    timeline: [
      { event: 'Submitted',       actor: 'You · via web portal',      time: 'Feb 06, 2026 · 09:00', dot: '#1e5fae' },
      { event: 'Pre-Checked',     actor: 'Staff · Registrar Office',  time: 'Feb 06, 2026 · 10:00', dot: '#0f766e' },
      { event: 'Objection Filed', actor: 'Third party · dispute',     time: 'Feb 07, 2026 · 14:00', dot: '#be123c' },
    ],
    docs: enrichDocs([
      { type: 'Ownership Deed',   file: 'ownership_deed_145.pdf', status: 'verified' },
      { type: 'National ID Copy', file: 'id_copy_nour.pdf',       status: 'verified' },
      { type: 'Sale Contract',    file: 'sale_contract_145.pdf',  status: 'verified' },
    ]),
    notes: [
      { actor: 'S14', date: 'Feb 07, 2026', text: 'An objection has been filed against this application. Your response may be requested.' },
    ],
    survey: { label: 'On Hold', color: '#be123c', desc: 'Survey is paused until the objection is resolved.' },
    nextStep: 'Objection Resolution',
  },
  'LRMIS-2026-0002': {
    timeline: [
      { event: 'Submitted',    actor: 'You · via web portal',     time: 'Feb 03, 2026 · 09:00', dot: '#1e5fae' },
      { event: 'Pre-Checked',  actor: 'Staff · Registrar Office', time: 'Feb 03, 2026 · 11:00', dot: '#0f766e' },
      { event: 'Surveyed',     actor: 'Surveyor · Field team',    time: 'Feb 10, 2026 · 14:00', dot: '#3f6212' },
      { event: 'Legal Review', actor: 'Legal department',         time: 'Feb 12, 2026 · 09:00', dot: '#6d28d9' },
    ],
    docs: enrichDocs([
      { type: 'Ownership Deed',   file: 'ownership_deed_210.pdf', status: 'verified' },
      { type: 'National ID Copy', file: 'id_copy_khaled.pdf',     status: 'verified' },
      { type: 'Survey Report',    file: 'survey_210.pdf',         status: 'verified' },
    ]),
    notes: [
      { actor: 'S14', date: 'Feb 12, 2026', text: 'Application is under legal review. No action required from you at this time.' },
    ],
    survey: { label: 'Completed', color: '#1f7a4d', desc: 'Survey report submitted on Feb 10, 2026.' },
    nextStep: 'Final Approval',
  },
  'LRMIS-2026-0008': {
    timeline: [
      { event: 'Submitted',          actor: 'You · via web portal',     time: 'Feb 09, 2026 · 09:00', dot: '#1e5fae' },
      { event: 'Pre-Checked',        actor: 'Staff · Registrar Office', time: 'Feb 09, 2026 · 11:00', dot: '#0f766e' },
      { event: 'Surveyed',           actor: 'Surveyor · Field team',    time: 'Feb 14, 2026 · 14:00', dot: '#3f6212' },
      { event: 'Approved',           actor: 'Registrar · Final review', time: 'Feb 16, 2026 · 10:00', dot: '#1f7a4d' },
      { event: 'Certificate Issued', actor: 'Registrar Office',         time: 'Feb 17, 2026 · 09:00', dot: '#0e7490' },
    ],
    docs: enrichDocs([
      { type: 'Ownership Deed',   file: 'ownership_deed_420.pdf', status: 'verified' },
      { type: 'National ID Copy', file: 'id_copy_khaled.pdf',     status: 'verified' },
      { type: 'Survey Report',    file: 'survey_420.pdf',         status: 'verified' },
    ]),
    notes: [
      { actor: 'S09', date: 'Feb 17, 2026', text: 'Certificate has been issued. You can collect it from the district office.' },
    ],
    survey: { label: 'Completed', color: '#1f7a4d', desc: 'Survey report submitted on Feb 14, 2026.' },
    nextStep: null,
  },
}

export function getTrackData(appId) {
  return TRACK_DATA[appId] || null
}

const NOTIFICATIONS = {
  nour: [
    { message: 'Your application LRMIS-2026-0001 has been pre-checked. Please upload the missing sale contract.', time: 'Feb 01, 2026 · 10:05 AM', dot: '#b45309' },
    { message: 'A new objection has been filed against LRMIS-2026-0005. Your response may be requested.', time: 'Feb 06, 2026 · 11:30 AM', dot: '#be123c' },
    { message: 'Surveyor assignment for LRMIS-2026-0003 is in progress. You will be notified once scheduled.', time: 'Feb 05, 2026 · 08:00 AM', dot: '#1e5fae' },
  ],
  khaled: [
    { message: 'Your application LRMIS-2026-0008 certificate has been issued. Collect it from the district office.', time: 'Feb 17, 2026 · 09:00 AM', dot: '#1f7a4d' },
    { message: 'LRMIS-2026-0002 is under legal review. No action required from you at this time.', time: 'Feb 12, 2026 · 09:00 AM', dot: '#6d28d9' },
  ],
  lina: [
    { message: 'Surveyor assignment for LRMIS-2026-0003 is in progress. You will be notified once scheduled.', time: 'Feb 05, 2026 · 08:00 AM', dot: '#1e5fae' },
  ],
}

export function getNotifications(userId) {
  return NOTIFICATIONS[userId] || []
}

const OBJECTIONS_BY_USER = {
  nour: [
    {
      id: 'LRMIS-2026-0005',
      status: 'Under Review',
      statusFg: '#be123c',
      statusBg: '#fbe4ea',
      desc: 'Dispute over ownership of parcel 145/12 · Filed Feb 06, 2026',
    },
  ],
  khaled: [],
  lina:   [],
}

export function getObjectionsForUser(userId) {
  return OBJECTIONS_BY_USER[userId] || []
}

export const UPLOAD_DOCS = {
  nour: [
    { type: 'Ownership Deed',   file: 'ownership_deed_145.pdf', size: '2.4 MB', status: 'verified',       ...DOC_STATUS.verified },
    { type: 'National ID Copy', file: 'id_copy_nour.pdf',       size: '640 KB', status: 'verified',       ...DOC_STATUS.verified },
    { type: 'Sale Contract',    file: 'sale_contract_145.pdf',  size: '1.1 MB', status: 'pending_review', ...DOC_STATUS.pending_review },
  ],
  khaled: [
    { type: 'Ownership Deed',   file: 'ownership_deed_420.pdf', size: '3.1 MB', status: 'verified', ...DOC_STATUS.verified },
    { type: 'National ID Copy', file: 'id_copy_khaled.pdf',     size: '580 KB', status: 'verified', ...DOC_STATUS.verified },
    { type: 'Survey Report',    file: 'survey_420.pdf',         size: '4.2 MB', status: 'verified', ...DOC_STATUS.verified },
  ],
  lina: [
    { type: 'Ownership Deed',   file: 'ownership_deed_88.pdf', size: '2.1 MB', status: 'verified', ...DOC_STATUS.verified },
    { type: 'National ID Copy', file: 'id_copy_lina.pdf',      size: '520 KB', status: 'verified', ...DOC_STATUS.verified },
  ],
}
