import React, { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
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
import { listStaff, reassignSurveyor, autoAssignSurveyor } from '../api/staff'
import { apiError } from '../utils/apiError'
import { getStaff } from '../context/staffSession'

const PRIORITY_STYLE = {
  high:   { color: '#b91c1c', background: '#fbe6e6' },
  normal: { color: '#5e6b65', background: '#f0f3f1' },
  low:    { color: '#1e5fae', background: '#e7f0fb' },
}

const MAIN_STEPS = [
  ['submitted', 'Submitted'],
  ['pre_checked', 'Pre-Check'],
  ['survey_required', 'Survey'],
  ['surveyed', 'Surveyed'],
  ['legal_review', 'Legal'],
  ['approved', 'Approved'],
  ['certificate_issued', 'Certificate'],
  ['closed', 'Closed'],
]

function WorkflowProgress({ status }) {
  const idx = MAIN_STEPS.findIndex(s => s[0] === status)
  if (idx === -1) {
    return (
      <div className="mt-4 text-[12px] text-[#5e6b65]">
        This application is currently <span className="font-semibold capitalize" style={{ color: STATUS[status]?.fg }}>{(status || '').replace(/_/g, ' ')}</span> — outside the main flow.
      </div>
    )
  }
  return (
    <div className="flex items-center mt-4 overflow-x-auto pb-1">
      {MAIN_STEPS.map(([key, label], i) => {
        const reached = i <= idx
        const current = i === idx
        return (
          <React.Fragment key={key}>
            {i > 0 && <div className={`h-[2px] flex-1 min-w-[12px] ${reached ? 'bg-[#1f5f4f]' : 'bg-[#e3e8e5]'}`} />}
            <div className="flex flex-col items-center gap-[5px] shrink-0">
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 ${reached ? 'bg-[#1f5f4f] border-[#1f5f4f]' : 'bg-white border-[#cdd6d2]'} ${current ? 'ring-2 ring-[#cfe3db]' : ''}`}>
                {reached && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${current ? 'text-[#1f5f4f] font-semibold' : 'text-[#9aa8a2]'}`}>{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function fmtDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const labelize = s => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function geometryCenter(geometry) {
  if (!geometry || !geometry.coordinates) return null
  if (geometry.type === 'Point') {
    const [lng, lat] = geometry.coordinates
    return [lat, lng]
  }
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] || []
    if (!ring.length) return null
    const sum = ring.reduce((a, [lng, lat]) => [a[0] + lng, a[1] + lat], [0, 0])
    return [sum[1] / ring.length, sum[0] / ring.length]
  }
  return null
}

function ParcelMap({ center }) {
  return (
    <MapContainer center={center} zoom={15} style={{ height: 320 }} scrollWheelZoom={false} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={center} radius={9} pathOptions={{ color: '#1f5f4f', fillColor: '#1f5f4f', fillOpacity: 0.6 }} />
    </MapContainer>
  )
}

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
  const [msgType, setMsgType] = useState('success')

  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [certName, setCertName] = useState('')

  const [surveyors, setSurveyors] = useState([])
  const [selectedSurveyor, setSelectedSurveyor] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([getApplication(id), getTimeline(id)])
      .then(([a, t]) => {
        setApp(a.data)
        setEvents(t.data)
        setTarget((a.data.workflow?.allowed_next || [])[0] || '')
        setSelectedSurveyor(a.data.assignment?.assigned_surveyor_id || '')
      })
      .catch((e) => setError(apiError(e, 'Could not load this application.')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    listStaff('surveyor')
      .then(res => setSurveyors(res.data || []))
      .catch(() => setSurveyors([]))
  }, [])

  const run = async (fn, ok, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setMsg('')
    try {
      await fn()
      setMsgType('success')
      setMsg(ok)
      setNote(''); setReason('')
      load()
    } catch (e) {
      setMsgType('error')
      setMsg(apiError(e, 'Action failed'))
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
  const parcelCenter = geometryCenter(parcel.geometry)
  const applicant = app.applicant_ref || {}
  const allowed = app.workflow?.allowed_next || []
  const docs = app.required_documents || []
  const notes = app.internal?.notes || []
  const canCertificate = app.status === 'approved'

  const assignedSurveyorId = app.assignment?.assigned_surveyor_id || ''
  const assignedSurveyor = surveyors.find(s => s.id === assignedSurveyorId)
  // A survey task exists only once an application has reached survey_required.
  const SURVEY_STAGES = ['survey_required', 'surveyed', 'legal_review', 'approved', 'certificate_issued', 'closed']
  const surveyStarted = SURVEY_STAGES.includes(app.status)
  const canAutoAssign = app.status === 'survey_required' && !assignedSurveyorId

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
              <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full capitalize" style={PRIORITY_STYLE[app.priority] || PRIORITY_STYLE.normal}>{app.priority || 'normal'} priority</span>
            </div>
            <div className="text-[13px] text-[#5e6b65]">
              {TYPES[app.application_type] || app.application_type}
              {' · '}Applicant <span className="mono">{applicant.applicant_id}</span>
              {app.assignment?.assigned_registrar_id && <> · Registrar <span className="mono">{app.assignment.assigned_registrar_id}</span></>}
            </div>
          </div>
        </div>
        <WorkflowProgress status={app.status} />
        {msg && <div className={`mt-3 text-[12.5px] border rounded-[8px] px-3 py-2 ${msgType === 'error' ? 'text-[#b91c1c] bg-[#fbe6e6] border-[#f0c4c4]' : 'text-[#1f7a4d] bg-[#e2f3e9] border-[#cfe8da]'}`}>{msg}</div>}
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
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65]">Parcel Location</div>
              {parcelCenter && <span className="mono text-[12px] text-[#5e6b65]">{parcelCenter[0].toFixed(5)}, {parcelCenter[1].toFixed(5)}</span>}
            </div>
            {parcelCenter ? (
              <div className="overflow-hidden rounded-[11px] border border-[#e3e8e5]">
                <ParcelMap center={parcelCenter} />
              </div>
            ) : (
              <div className="text-[12.5px] text-[#9aa8a2] bg-[#f8faf9] border border-[#e3e8e5] rounded-[11px] px-3 py-8 text-center">
                No location set for this application.
              </div>
            )}
          </Card>

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
                    () => transitionApplication(app.application_id, { to_state: target, note: note || undefined, reason: reason || undefined, actor_id: getStaff()?.id }),
                    `Moved to ${labelize(target)}`,
                  )}
                >Apply Transition</Button>
              </>
            )}

            <div className="border-t border-[#eef1f4] my-3" />

            <div className="text-[12px] text-[#5e6b65] mb-1">Reason (for hold / reject)<span className="text-[#dc2626]"> *</span></div>
            <input
              className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white mb-3 focus:border-[#1f5f4f] transition-colors"
              placeholder="Enter a reason…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="warning" size="sm" className="flex-1 justify-center" disabled={busy}
                onClick={() => run(() => holdApplication(app.application_id, { reason, actor_id: getStaff()?.id }), 'Application placed on hold')}>
                Hold
              </Button>
              <Button variant="danger" size="sm" className="flex-1 justify-center" disabled={busy}
                onClick={() => run(() => rejectApplication(app.application_id, { reason, actor_id: getStaff()?.id }), 'Application rejected',
                  `Reject ${app.application_id}? This cannot be undone.`)}>
                Reject
              </Button>
            </div>
          </Card>

          {surveyStarted && (
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Survey Assignment</div>

              <div className="mb-4">
                <div className="text-[11px] text-[#9aa8a2] mb-[2px]">Currently assigned surveyor</div>
                {assignedSurveyorId ? (
                  <div className="text-[13px] text-[#16201c]">
                    {assignedSurveyor
                      ? <>{assignedSurveyor.name} <span className="mono text-[#5e6b65]">({assignedSurveyor.staff_code})</span></>
                      : <span className="mono">{assignedSurveyorId}</span>}
                  </div>
                ) : (
                  <div className="text-[13px] text-[#9aa8a2]">No surveyor assigned yet.</div>
                )}
              </div>

              {canAutoAssign && (
                <>
                  <Button
                    variant="primary" className="w-full justify-center mb-3" disabled={busy}
                    onClick={() => run(
                      () => autoAssignSurveyor(app.application_id),
                      'Surveyor auto-assigned by policy',
                    )}
                  >Auto-Assign by Policy</Button>
                  <div className="text-[11.5px] text-[#9aa8a2] mb-3 text-center">or assign manually below</div>
                </>
              )}

              <div className="text-[12px] text-[#5e6b65] mb-1">
                {assignedSurveyorId ? 'Reassign to' : 'Assign to'}
              </div>
              <FormSelect value={selectedSurveyor} onChange={e => setSelectedSurveyor(e.target.value)} className="mb-3">
                <option value="">Select a surveyor…</option>
                {surveyors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.staff_code}) · {s.workload?.active_tasks ?? 0}/{s.workload?.max_tasks ?? 10} tasks
                  </option>
                ))}
              </FormSelect>
              <Button
                variant="ghost" className="w-full justify-center"
                disabled={busy || !selectedSurveyor || selectedSurveyor === assignedSurveyorId || !assignedSurveyorId}
                onClick={() => run(
                  () => reassignSurveyor(app.application_id, selectedSurveyor),
                  'Survey task reassigned',
                  `Reassign the survey task for ${app.application_id} to the selected surveyor?`,
                )}
              >Reassign Surveyor</Button>
              {!assignedSurveyorId && (
                <div className="text-[11.5px] text-[#9aa8a2] mt-2">
                  Manual reassignment is available once a surveyor is assigned. Use auto-assign first.
                </div>
              )}
            </Card>
          )}

          {canCertificate && (
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-3">Issue Certificate</div>
              <div className="text-[12px] text-[#5e6b65] mb-1">Owner full name<span className="text-[#dc2626]"> *</span></div>
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
