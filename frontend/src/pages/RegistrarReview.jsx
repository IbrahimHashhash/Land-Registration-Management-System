import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { TYPES } from '../theme'
import {
  getApplication,
  holdApplication,
  verifyDocument,
} from '../api/applications'
import { getApplicationDocuments } from '../api/applicant'
import { getSurveyResults, registrarReview } from '../api/staff'
import { apiError } from '../utils/apiError'
import { getStaff } from '../context/staffSession'

const DOC_STATUS = {
  verified:        { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review:  { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  rejected:        { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
  missing:         { label: 'Missing',        fg: '#b91c1c', bg: '#fbe6e6' },
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function RegistrarReview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [app, setApp] = useState(null)
  const [docs, setDocs] = useState([])
  const [survey, setSurvey] = useState({ task: null, reports: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState('')
  const [docStates, setDocStates] = useState({})  // {document_id: 'verified' | 'rejected' | 'pending_review'}
  const [actionLoading, setActionLoading] = useState('')
  const [actionError, setActionError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      getApplication(id),
      getApplicationDocuments(id).catch(() => []),
      getSurveyResults(id).then(r => r.data).catch(() => ({ task: null, reports: [] })),
    ])
      .then(([appRes, docList, surveyData]) => {
        if (!active) return
        setApp(appRes.data)
        setDocs(docList || [])
        setSurvey(surveyData || { task: null, reports: [] })
        const initial = {}
        ;(docList || []).forEach(d => { initial[d.document_id] = d.verification_status || 'pending_review' })
        setDocStates(initial)
      })
      .catch(err => active && setError(apiError(err, 'Could not load application.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, reload])

  const verifiedCount = Object.values(docStates).filter(s => s === 'verified').length

  function updateDoc(docId, status) {
    // Optimistic UI update; revert if the API call fails.
    const prev = docStates[docId]
    setDocStates(p => ({ ...p, [docId]: status }))
    setActionError('')
    verifyDocument(id, docId, { verification_status: status })
      .catch(err => {
        setDocStates(p => ({ ...p, [docId]: prev }))
        setActionError(apiError(err, 'Could not update document status.'))
      })
  }

  async function doTransition(toState) {
    setActionLoading(toState)
    setActionError('')
    try {
      const staff = getStaff()
      await registrarReview(id, {
        decision: toState,
        reviewed_by: staff?.id,
        notes: decision || undefined,
      })
      setReload(r => r + 1)
      if (toState === 'approved') navigate('/certificates')
    } catch (err) {
      setActionError(apiError(err, 'Could not update application.'))
    } finally {
      setActionLoading('')
    }
  }

  async function doHold() {
    if (!decision.trim()) {
      setActionError('Please enter a reason in the notes field before placing on hold.')
      return
    }
    setActionLoading('hold')
    setActionError('')
    try {
      const staff = getStaff()
      await holdApplication(id, { reason: decision.trim(), actor_id: staff?.id })
      setReload(r => r + 1)
    } catch (err) {
      setActionError(apiError(err, 'Could not put on hold.'))
    } finally {
      setActionLoading('')
    }
  }

  async function doReject() {
    if (!decision.trim()) {
      setActionError('Please enter a reason in the notes field before rejecting.')
      return
    }
    setActionLoading('reject')
    setActionError('')
    try {
      const staff = getStaff()
      await registrarReview(id, {
        decision: 'rejected',
        reviewed_by: staff?.id,
        notes: decision.trim(),
        rejection_reason: decision.trim(),
      })
      setReload(r => r + 1)
    } catch (err) {
      setActionError(apiError(err, 'Could not reject application.'))
    } finally {
      setActionLoading('')
    }
  }

  if (loading) {
    return (
      <AppShell title="Registrar Review" subtitle="Loading…">
        <div className="py-10 text-center text-[13px] text-[#5e6b65]">Loading application…</div>
      </AppShell>
    )
  }
  if (error || !app) {
    return (
      <AppShell title="Registrar Review" subtitle="Error">
        <div className="px-[14px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[13px]">
          {error || 'Application not found.'}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Registrar Review"
      subtitle={`${app.application_id} · ${(app.status || '').replace(/_/g, ' ')}`}
    >
      <Link
        to={`/applications/${app.application_id}`}
        className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to application
      </Link>

      <Card className="p-[22px] mb-5">
        <div className="flex items-center gap-3">
          <span className="mono text-[20px] font-bold text-[#16201c]">{app.application_id}</span>
          <StatusBadge status={app.status} />
        </div>
        <div className="text-[13px] text-[#5e6b65] mt-1.5">
          {TYPES[app.application_type] || app.application_type} · {app.applicant_ref?.applicant_id || '—'} · {app.parcel?.zone_id || '—'}
        </div>
      </Card>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <div className="flex flex-col gap-5">
        <Card className="p-[22px]">
          <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Legal Document Review</div>
          <div className="text-[12.5px] text-[#5e6b65] mb-5">
            Review each document and mark its verification status.
          </div>

          {docs.length === 0 ? (
            <div className="text-[12.5px] text-[#9aa8a2] py-2">No documents uploaded for this application.</div>
          ) : (
            <div className="space-y-4">
              {docs.map(doc => {
                const currentStatus = docStates[doc.document_id] || 'pending_review'
                const ds = DOC_STATUS[currentStatus] || DOC_STATUS.pending_review
                return (
                  <div key={doc.document_id} className="border border-[#e3e8e5] rounded-[11px] p-[16px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-[#e7f1ee] rounded-[8px] flex items-center justify-center shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f5f4f" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-[#16201c] capitalize">
                          {doc.document_type?.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[12px] text-[#9aa8a2] mono">
                          {doc.file_name}{doc.size_bytes ? ` · ${fmtSize(doc.size_bytes)}` : ''}
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full whitespace-nowrap"
                        style={{ color: ds.fg, background: ds.bg }}
                      >
                        {ds.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={currentStatus === 'verified' ? 'success' : 'ghost'}
                        size="sm"
                        onClick={() => updateDoc(doc.document_id, currentStatus === 'verified' ? 'pending_review' : 'verified')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {currentStatus === 'verified' ? 'Verified' : 'Accept'}
                      </Button>
                      <Button
                        variant={currentStatus === 'rejected' ? 'danger' : 'ghost'}
                        size="sm"
                        onClick={() => updateDoc(doc.document_id, currentStatus === 'rejected' ? 'pending_review' : 'rejected')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        {currentStatus === 'rejected' ? 'Rejected' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-[22px]">
          <div className="flex items-center justify-between mb-[5px]">
            <div className="text-[14px] font-bold text-[#16201c]">Survey Results</div>
            {survey.task && (
              <span className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full capitalize"
                style={{ color: '#1f5f4f', background: '#e7f1ee' }}>
                {(survey.task.status || '').replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-[#5e6b65] mb-5">
            Field survey findings reported by the surveyor.
          </div>

          {!survey.task && survey.reports.length === 0 ? (
            <div className="text-[12.5px] text-[#9aa8a2] py-2">No survey has been carried out for this application.</div>
          ) : (
            <div className="space-y-4">
              {survey.reports.length === 0 ? (
                <div className="text-[12.5px] text-[#9aa8a2]">Survey in progress — no report uploaded yet.</div>
              ) : (
                survey.reports.map(rep => (
                  <div key={rep.id} className="border border-[#e3e8e5] rounded-[11px] p-[16px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[13.5px] font-semibold text-[#16201c]">{rep.report_title}</div>
                      {rep.uploaded_at && (
                        <span className="text-[11.5px] text-[#9aa8a2]">
                          {new Date(rep.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {rep.findings && (
                      <p className="text-[13px] text-[#384640] leading-relaxed whitespace-pre-wrap">{rep.findings}</p>
                    )}
                    <div className="text-[11.5px] text-[#9aa8a2] mt-2 mono">Uploaded by {rep.uploaded_by}</div>
                  </div>
                ))
              )}

              {survey.task?.field_notes?.length > 0 && (
                <div>
                  <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.05em] mb-2">Field Notes</div>
                  <ul className="list-disc pl-5 text-[13px] text-[#384640] space-y-1">
                    {survey.task.field_notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}

              {survey.task?.milestones?.length > 0 && (
                <div>
                  <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.05em] mb-2">Milestones</div>
                  <div className="flex gap-2 flex-wrap">
                    {survey.task.milestones.map((m, i) => (
                      <span key={i} className="text-[11.5px] px-[10px] py-[3px] rounded-full bg-[#eef1f4] text-[#475569] capitalize">
                        {(m.type || '').replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-[22px]">
            <div className="text-[14px] font-bold text-[#16201c] mb-4">Registrar Decision</div>
            <div className="space-y-[10px] mb-4">
              <div className="flex items-center justify-between py-[9px] border-b border-[#f0f3f1]">
                <span className="text-[13px] text-[#5e6b65]">Documents verified</span>
                <span className="text-[13px] font-semibold text-[#16201c]">
                  {verifiedCount} of {docs.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-[9px] border-b border-[#f0f3f1]">
                <span className="text-[13px] text-[#5e6b65]">Current status</span>
                <span className="text-[13px] font-semibold text-[#16201c] capitalize">
                  {(app.status || '').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between py-[9px]">
                <span className="text-[13px] text-[#5e6b65]">Application type</span>
                <span className="text-[13px] font-semibold text-[#16201c]">
                  {TYPES[app.application_type] || app.application_type}
                </span>
              </div>
            </div>

            <label className="block text-[12px] font-semibold text-[#5e6b65] mb-2 uppercase tracking-[.05em]">
              Decision Notes
            </label>
            <textarea
              className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white text-[#16201c] placeholder:text-[#9aa8a2] focus:border-[#1f5f4f] transition-colors resize-none"
              rows={4}
              placeholder="Enter your review notes and decision rationale…"
              value={decision}
              onChange={e => { setDecision(e.target.value); if (actionError) setActionError('') }}
            />
          </Card>

          <Card className="p-[18px]">
            <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.05em] mb-3">
              Issue Decision
            </div>
            {actionError && (
              <div className="mb-3 px-[12px] py-[9px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12px]">
                {actionError}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                variant="success"
                className="w-full justify-center"
                disabled={actionLoading !== ''}
                onClick={() => doTransition('approved')}
              >
                {actionLoading === 'approved' ? 'Approving…' : 'Approve Application'}
              </Button>
              <Button
                variant="danger"
                className="w-full justify-center"
                disabled={actionLoading !== ''}
                onClick={doReject}
              >
                {actionLoading === 'reject' ? 'Rejecting…' : 'Reject Application'}
              </Button>
              <Button
                variant="warning"
                className="w-full justify-center"
                disabled={actionLoading !== ''}
                onClick={doHold}
              >
                {actionLoading === 'hold' ? 'Putting on hold…' : 'Put On Hold'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
