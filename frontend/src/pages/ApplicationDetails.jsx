import React, { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormSelect from '../components/ui/FormSelect'
import { TYPES, APPLICANT_TYPES, STATUS } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import {
  getApplication, getTimeline, transitionApplication,
  holdApplication, rejectApplication, issueCertificate,
} from '../api/applications'

function fmtDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const labelize = s => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-[11px] text-[#9aa8a2] mb-[2px]">{label}</div>
      <div className={`text-[13px] text-[#384640] ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  )
}

export default function ApplicationDetails() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [certName, setCertName] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([getApplication(id), getTimeline(id)])
      .then(([a, t]) => {
        setApp(a.data)
        setEvents(t.data)
        setTarget((a.data.workflow?.allowed_next || [])[0] || '')
      })
      .catch(() => setError('Could not load this application.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const run = async (fn, ok) => {
    setBusy(true)
    setMsg('')
    try {
      await fn()
      setMsg(ok)
      setNote(''); setReason('')
      load()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <AppShell title={id}><div className="text-[13px] text-[#5e6b65]">Loading…</div></AppShell>
  if (error || !app) return (
    <AppShell title={id}>
      <Link to="/applications" className="text-[13px] text-[#1f5f4f] hover:underline">← Back to applications</Link>
      <div className="mt-4 text-[13px] text-[#b91c1c]">{error || 'Not found'}</div>
    </AppShell>
  )

  const parcel = app.parcel || {}
  const applicant = app.applicant_ref || {}
  const allowed = app.workflow?.allowed_next || []
  const docs = app.required_documents || []
  const notes = app.internal?.notes || []
  const canCertificate = app.status === 'approved'

  return (
    <AppShell title={app.application_id} subtitle={`${TYPES[app.application_type] || app.application_type} · Submitted ${fmtDateTime(app.submission_date)}`}>
      <Link to="/applications" className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to applications
      </Link>

      <Card className="p-[22px] mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="mono text-[22px] font-bold text-[#16201c]">{app.application_id}</span>
              <StatusBadge status={app.status} />
              <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[#f0f3f1] text-[#5e6b65] capitalize">{app.priority || 'normal'} priority</span>
            </div>
            <div className="text-[13px] text-[#5e6b65]">
              {TYPES[app.application_type] || app.application_type}
              {' · '}Applicant <span className="mono">{applicant.applicant_id}</span>
              {app.assignment?.assigned_registrar_id && <> · Registrar <span className="mono">{app.assignment.assigned_registrar_id}</span></>}
            </div>
          </div>
        </div>
        {msg && <div className="mt-3 text-[12.5px] text-[#1f5f4f] bg-[#eef6f2] border border-[#d6e7df] rounded-[8px] px-3 py-2">{msg}</div>}
      </Card>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Applicant</div>
              <div className="space-y-[10px]">
                <Field label="Applicant ID" value={applicant.applicant_id} mono />
                <Field label="Type" value={APPLICANT_TYPES[applicant.applicant_type] || labelize(applicant.applicant_type)} />
                <Field label="Via representative" value={applicant.submitted_by_representative ? 'Yes' : 'No'} />
              </div>
            </Card>

            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Parcel</div>
              <div className="space-y-[10px]">
                <Field label="Parcel / Block" value={[parcel.parcel_no, parcel.block_no].filter(Boolean).join(' / ')} mono />
                <Field label="Basin" value={parcel.basin_no} mono />
                <Field label="Zone" value={parcel.zone_id} mono />
              </div>
            </Card>
          </div>

          <Card className="p-[20px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65]">Required Documents</div>
              <span className="text-[12px] text-[#5e6b65]">{docs.length} item{docs.length === 1 ? '' : 's'}</span>
            </div>
            {docs.length === 0 ? (
              <div className="text-[13px] text-[#9aa8a2]">No documents listed.</div>
            ) : (
              <div className="space-y-[10px]">
                {docs.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-[13px] bg-[#f8faf9] rounded-[9px] border border-[#e3e8e5]">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#16201c]">{labelize(d.document_type)}</div>
                      <div className="text-[11.5px] text-[#9aa8a2]">{d.required ? 'Required' : 'Optional'}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full whitespace-nowrap capitalize"
                      style={{ color: '#5e6b65', background: '#eef1f4' }}>{labelize(d.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {app.description && (
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-3">Description</div>
              <p className="text-[13px] text-[#384640] leading-relaxed">{app.description}</p>
            </Card>
          )}

          <Card className="p-[20px]">
            <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Internal Notes</div>
            {notes.length === 0 ? (
              <div className="text-[13px] text-[#9aa8a2]">No notes yet.</div>
            ) : (
              <div className="space-y-3">
                {notes.map((n, i) => (
                  <p key={i} className="text-[13px] text-[#384640] leading-relaxed bg-[#f8faf9] border border-[#e3e8e5] rounded-[9px] px-3 py-2">{n}</p>
                ))}
              </div>
            )}
            {app.rejection_reason && <div className="mt-3 text-[12.5px] text-[#b91c1c]">Rejection reason: {app.rejection_reason}</div>}
            {app.hold_reason && app.status === 'on_hold' && <div className="mt-3 text-[12.5px] text-[#b45309]">On hold: {app.hold_reason}</div>}
          </Card>
        </div>

        <div className="flex flex-col gap-5 self-start">
          <Card className="p-[20px]">
            <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Workflow Actions</div>

            {allowed.length === 0 ? (
              <div className="text-[13px] text-[#9aa8a2] mb-4">No further transitions from <b>{labelize(app.status)}</b>.</div>
            ) : (
              <>
                <div className="text-[12px] text-[#5e6b65] mb-1">Move to</div>
                <FormSelect value={target} onChange={e => setTarget(e.target.value)} className="mb-3">
                  {allowed.map(s => <option key={s} value={s}>{labelize(s)}</option>)}
                </FormSelect>
                <input
                  className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white mb-3 focus:border-[#1f5f4f] transition-colors"
                  placeholder={target === 'rejected' ? 'Rejection reason (required)' : 'Optional note'}
                  value={target === 'rejected' ? reason : note}
                  onChange={e => (target === 'rejected' ? setReason(e.target.value) : setNote(e.target.value))}
                />
                <Button
                  variant="primary" className="w-full justify-center mb-2" disabled={busy}
                  onClick={() => run(
                    () => transitionApplication(app.application_id, { to_state: target, note: note || undefined, reason: reason || undefined }),
                    `Moved to ${labelize(target)}`,
                  )}
                >Apply Transition</Button>
              </>
            )}

            <div className="border-t border-[#eef1f4] my-3" />

            <div className="text-[12px] text-[#5e6b65] mb-1">Reason (for hold / reject)</div>
            <input
              className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white mb-3 focus:border-[#1f5f4f] transition-colors"
              placeholder="Enter a reason…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="warning" size="sm" className="flex-1 justify-center" disabled={busy}
                onClick={() => run(() => holdApplication(app.application_id, { reason }), 'Application placed on hold')}>
                Hold
              </Button>
              <Button variant="danger" size="sm" className="flex-1 justify-center" disabled={busy}
                onClick={() => run(() => rejectApplication(app.application_id, { reason }), 'Application rejected')}>
                Reject
              </Button>
            </div>
          </Card>

          {canCertificate && (
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-3">Issue Certificate</div>
              <input
                className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white mb-3 focus:border-[#1f5f4f] transition-colors"
                placeholder="Full name of owner"
                value={certName}
                onChange={e => setCertName(e.target.value)}
              />
              <Button variant="success" className="w-full justify-center" disabled={busy || !certName}
                onClick={() => run(
                  () => issueCertificate(app.application_id, { full_name: certName, issued_by: 'registrar' }),
                  'Certificate issued',
                )}>Generate Certificate</Button>
            </Card>
          )}

          <Card className="p-[20px]">
            <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-5">Workflow Timeline</div>
            {events.length === 0 ? (
              <div className="text-[13px] text-[#9aa8a2]">No events recorded.</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-[#e3e8e5]" />
                <div className="space-y-0">
                  {events.map((ev, i) => (
                    <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                      <div className="w-[22px] h-[22px] rounded-full border-2 bg-[#1f5f4f] border-[#1f5f4f] flex items-center justify-center shrink-0 z-[1] mt-[1px]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-[#16201c] mb-[2px]" style={{ color: STATUS[ev.type]?.fg }}>{labelize(ev.type)}</div>
                        <div className="text-[12px] text-[#9aa8a2]">
                          {labelize(ev.by?.actor_type)}{ev.by?.actor_id && ' · '}{ev.by?.actor_id && <span className="mono">{ev.by.actor_id}</span>}
                        </div>
                        {ev.at && <div className="text-[11.5px] text-[#9aa8a2] mt-[2px]">{fmtDateTime(ev.at)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
