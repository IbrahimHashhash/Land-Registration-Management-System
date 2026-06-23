import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getApplicantApplications, getApplication, getTimeline, addComment } from '../../api/applicant'
import { STATUS, TYPES } from '../../theme'

const TYPE_LABELS = {
  submitted:         'Submitted',
  pre_checked:       'Pre-Checked',
  document_uploaded: 'Document Uploaded',
  comment_added:     'Comment Added',
  objection_created: 'Objection Filed',
  objection_submitted: 'Objection Filed',
  status_changed:    'Status Changed',
  missing_documents: 'Missing Document',
  survey_required:   'Survey Required',
}

const TYPE_DOTS = {
  submitted:         '#1e5fae',
  pre_checked:       '#0f766e',
  document_uploaded: '#1f5f4f',
  comment_added:     '#6d28d9',
  objection_created: '#be123c',
  objection_submitted: '#be123c',
  under_objection:   '#be123c',
  status_changed:    '#b45309',
  missing_documents: '#b45309',
  survey_required:   '#b45309',
  approved:          '#1f7a4d',
  certificate_issued:'#0e7490',
  rejected:          '#b91c1c',
}

const DOC_STATUS = {
  verified:       { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review: { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  rejected:       { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
  missing:        { label: 'Missing',        fg: '#b91c1c', bg: '#fbe6e6' },
}

const SURVEYED_STATES = new Set(['surveyed', 'legal_review', 'approved', 'certificate_issued', 'closed'])

function titleCase(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(iso, withTime) {
  if (!iso) return '—'
  const opts = withTime
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(iso).toLocaleString('en-US', opts)
}

function mapApiTimeline(events) {
  return events.map(t => ({
    event: TYPE_LABELS[t.type] || titleCase(t.type),
    actor: t.by?.actor_type === 'applicant' ? 'You · via web portal'
         : t.by?.actor_type === 'registrar' ? `Registrar · ${t.by.actor_id || 'Office'}`
         : t.by?.actor_type === 'staff'     ? `Staff · ${t.by.actor_id || 'Office'}`
         : t.by?.actor_type === 'surveyor'  ? `Surveyor · ${t.by.actor_id || 'Field team'}`
         : 'System',
    time: formatDate(t.at, true),
    dot: TYPE_DOTS[t.type] || '#9aa8a2',
    detail: t.meta?.text || t.meta?.reason || t.meta?.note || null,
  }))
}

function surveyInfo(status) {
  if (status === 'survey_required') return { label: 'Survey Required', desc: 'Awaiting surveyor assignment.', color: '#b45309' }
  if (SURVEYED_STATES.has(status))  return { label: 'Survey Completed', desc: 'Field survey has been completed.', color: '#1f7a4d' }
  return { label: 'Not Started', desc: 'Application has not reached the survey stage.', color: '#5e6b65' }
}

export default function TrackApplication() {
  const { user } = useApplicant()
  const navigate = useNavigate()
  const { id } = useParams()

  const [apps, setApps]               = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [detail, setDetail]           = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [timeline, setTimeline]       = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [commentText,   setCommentText]   = useState('')
  const [commentStatus, setCommentStatus] = useState('idle') // idle | loading | success | error

  // Load the applicant's applications from the DB
  useEffect(() => {
    if (!user?.applicant_id) { setAppsLoading(false); return }
    setAppsLoading(true)
    getApplicantApplications(user.applicant_id)
      .then(list => setApps(Array.isArray(list) ? list : []))
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false))
  }, [user?.applicant_id])

  const selectedId = id || apps[0]?.application_id
  const summary = apps.find(a => a.application_id === selectedId)

  function refreshTimeline(appId) {
    if (!appId) return
    setTimelineLoading(true)
    getTimeline(appId)
      .then(events => setTimeline(Array.isArray(events) ? mapApiTimeline(events) : []))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false))
  }

  // Load full detail + timeline for the selected application
  useEffect(() => {
    if (!selectedId) { setDetail(null); setTimeline([]); return }
    setCommentStatus('idle')
    setDetailLoading(true)
    getApplication(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
    refreshTimeline(selectedId)
  }, [selectedId])

  async function handleComment() {
    if (!commentText.trim()) return
    setCommentStatus('loading')
    try {
      await addComment(selectedId, { author_id: user.applicant_id, text: commentText.trim() })
      setCommentStatus('success')
      setCommentText('')
      refreshTimeline(selectedId)
    } catch {
      setCommentStatus('error')
    }
  }

  if (appsLoading) {
    return (
      <ApplicantShell title="Track Application" subtitle="Loading your applications…">
        <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#9aa8a2]">
          <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </ApplicantShell>
    )
  }

  if (apps.length === 0) {
    return (
      <ApplicantShell title="Track Application" subtitle="No applications found">
        <div className="text-[13px] text-[#9aa8a2] pt-8 text-center">
          You have no applications yet.{' '}
          <button
            onClick={() => navigate('/applicant/submit')}
            className="text-[#1f5f4f] font-semibold cursor-pointer bg-transparent border-none p-0 hover:underline"
            style={{ fontFamily: 'inherit' }}
          >
            Submit one now.
          </button>
        </div>
      </ApplicantShell>
    )
  }

  const status     = detail?.status || summary?.status
  const typeKey    = detail?.application_type || summary?.application_type
  const typeLabel  = TYPES[typeKey] || titleCase(typeKey)
  const st         = STATUS[status] || { label: titleCase(status), fg: '#475569', bg: '#eef1f4' }
  const parcel     = detail?.parcel
  const parcelText = parcel ? `${parcel.parcel_no} / ${parcel.block_no}` : '—'
  const zone       = parcel?.zone_id || '—'
  const submitted  = formatDate(detail?.submission_date || summary?.submission_date)
  const docs       = detail?.required_documents || []
  const notes      = detail?.internal?.visibility !== 'staff_only' ? (detail?.internal?.notes || []) : []
  const survey     = surveyInfo(status)
  const nextStep   = detail?.workflow?.allowed_next?.[0]

  return (
    <ApplicantShell title="Track Application" subtitle={`${selectedId} · ${typeLabel}`}>
      <button
        onClick={() => navigate('/applicant')}
        className="inline-flex items-center gap-[6px] text-[13px] text-[#5e6b65] font-medium mb-[16px] cursor-pointer bg-transparent border-none p-0 hover:text-[#1f5f4f] transition-colors"
        style={{ fontFamily: 'inherit' }}
      >
        ‹ Back to dashboard
      </button>

      {/* App header */}
      <div className="flex items-start gap-[12px] mb-[20px] flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[12px] flex-wrap">
            <span className="mono text-[19px] font-semibold">{selectedId}</span>
            <span className="text-[11.5px] font-semibold px-[12px] py-[5px] rounded-full" style={{ color: st.fg, background: st.bg }}>
              {st.label}
            </span>
          </div>
          <div className="text-[13.5px] text-[#5e6b65] mt-[6px]">
            {typeLabel} · Parcel {parcelText} · {zone}
          </div>
        </div>
      </div>

      {/* App selector */}
      {apps.length > 1 && (
        <div className="flex gap-[8px] mb-[20px] flex-wrap">
          {apps.map(a => (
            <button
              key={a.application_id}
              onClick={() => navigate(`/applicant/track/${a.application_id}`)}
              className="px-[12px] py-[7px] rounded-[9px] border text-[12.5px] font-semibold transition-colors cursor-pointer mono"
              style={{
                fontFamily: 'inherit',
                borderColor: a.application_id === selectedId ? '#1f5f4f' : '#e3e8e5',
                background:  a.application_id === selectedId ? '#e7f1ee'  : '#fff',
                color:       a.application_id === selectedId ? '#1f5f4f'  : '#384640',
              }}
            >
              {a.application_id}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-[16px]" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Left column */}
        <div className="flex flex-col gap-[16px]">

          {/* Status timeline */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="flex items-center justify-between mb-[18px]">
              <div className="text-[14.5px] font-bold">Status Timeline</div>
              {(timelineLoading || detailLoading) && (
                <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="relative pl-[6px]">
              {timeline.length === 0 && !timelineLoading ? (
                <div className="text-[12.5px] text-[#9aa8a2]">No timeline events yet.</div>
              ) : timeline.map((t, i) => (
                <div key={i} className="relative pl-[24px] pb-[18px] border-l-2 border-[#eef1ef] ml-[5px]">
                  <div className="absolute left-[-7px] top-[1px] w-[12px] h-[12px] rounded-full border-2 border-white" style={{ background: t.dot, boxShadow: `0 0 0 2px ${t.dot}` }} />
                  <div className="text-[13px] font-semibold mt-[-3px]">{t.event}</div>
                  <div className="text-[11.5px] text-[#5e6b65] mt-[2px]">{t.actor}</div>
                  <div className="text-[11px] text-[#9aa8a2] mono mt-[2px]">{t.time}</div>
                  {t.detail && (
                    <div className="text-[12px] text-[#384640] mt-[7px] bg-[#f7f9f8] border border-[#eef1ef] rounded-[8px] px-[11px] py-[8px] leading-relaxed">
                      {t.detail}
                    </div>
                  )}
                </div>
              ))}
              {nextStep && (
                <div className="relative pl-[24px] ml-[5px]">
                  <div className="absolute left-[-7px] top-[1px] w-[12px] h-[12px] rounded-full bg-white border-2 border-dashed border-[#c2ccc7]" />
                  <div className="text-[13px] font-semibold text-[#9aa8a2] mt-[-3px]">{titleCase(nextStep)}</div>
                  <div className="text-[11.5px] text-[#9aa8a2] mt-[2px]">Next step · pending</div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="flex items-baseline justify-between mb-[14px]">
              <div className="text-[14.5px] font-bold">Required Documents</div>
              <button
                onClick={() => navigate('/applicant/upload')}
                className="text-[12.5px] text-[#1f5f4f] font-semibold cursor-pointer bg-transparent border-none p-0 hover:underline"
                style={{ fontFamily: 'inherit' }}
              >
                Upload more
              </button>
            </div>
            {docs.length === 0 ? (
              <div className="text-[12.5px] text-[#9aa8a2]">No documents listed.</div>
            ) : docs.map((d, i) => {
              const ds = DOC_STATUS[d.status] || { label: titleCase(d.status), fg: '#475569', bg: '#eef1f4' }
              return (
                <div key={i} className="flex items-center gap-[13px] py-[11px] border-b border-[#f2f4f3] last:border-b-0">
                  <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f0f3f1] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e6b65" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{titleCase(d.document_type)}</div>
                    <div className="text-[11.5px] text-[#5e6b65]">{d.required ? 'Required' : 'Optional'}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full shrink-0" style={{ color: ds.fg, background: ds.bg }}>
                    {ds.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Registrar notes (only those visible to applicant) */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Registrar Notes</div>
            {notes.length === 0 ? (
              <div className="text-[12.5px] text-[#9aa8a2]">No registrar notes shared with you.</div>
            ) : notes.map((n, i) => (
              <div key={i} className="text-[13px] text-[#384640] leading-relaxed p-[12px] bg-[#f7f9f8] rounded-[9px] mb-[8px] last:mb-0">
                {n}
              </div>
            ))}
          </div>

          {/* Add comment */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Add Comment</div>
            {commentStatus === 'success' ? (
              <div className="text-[13px] text-[#1f7a4d] font-semibold py-1">Comment submitted.</div>
            ) : (
              <>
                <textarea
                  value={commentText}
                  onChange={e => { setCommentText(e.target.value); if (commentStatus === 'error') setCommentStatus('idle') }}
                  placeholder="Write a comment or question for the registrar…"
                  className="w-full min-h-[90px] border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none resize-y leading-relaxed focus:border-[#1f5f4f] transition-colors mb-[12px]"
                  style={{ fontFamily: 'inherit' }}
                />
                {commentStatus === 'error' && (
                  <div className="mb-[10px] text-[12px] text-[#b91c1c]">Failed to submit. Please try again.</div>
                )}
                <button
                  onClick={handleComment}
                  disabled={commentStatus === 'loading' || !commentText.trim()}
                  className="px-[18px] py-[9px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                  style={{ fontFamily: 'inherit' }}
                >
                  {commentStatus === 'loading' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : 'Submit Comment'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-[16px] self-start">
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Application Summary</div>
            <div className="flex flex-col gap-[11px] text-[12.5px]">
              {[
                ['Type',      typeLabel,  false],
                ['Parcel',    parcelText, true],
                ['Zone',      zone,       true],
                ['Submitted', submitted,  false],
                ['Priority',  titleCase(detail?.priority) || 'Normal', false],
              ].map(([k, v, mono]) => (
                <div key={k} className="flex justify-between gap-[10px]">
                  <span className="text-[#5e6b65]">{k}</span>
                  <span className={`font-semibold ${mono ? 'mono' : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Survey Status</div>
            <div className="flex items-center gap-[11px] p-[14px] bg-[#f7f9f8] rounded-[10px]">
              <div className="w-[40px] h-[40px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: survey.color + '22', color: survey.color }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: survey.color }}>{survey.label}</div>
                <div className="text-[11.5px] text-[#5e6b65] mt-0.5 leading-snug">{survey.desc}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[9px]">
            <button
              onClick={() => navigate('/applicant/upload')}
              className="w-full py-[11px] border border-[#e3e8e5] rounded-[9px] bg-white text-[#384640] text-[13px] font-semibold cursor-pointer hover:bg-[#f4f6f5] transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              Upload Documents
            </button>
            <button
              onClick={() => navigate('/applicant/objection')}
              className="w-full py-[11px] border border-[#f0c4c4] rounded-[9px] bg-white text-[#b91c1c] text-[13px] font-semibold cursor-pointer hover:bg-[#fdeded] transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              Submit Objection
            </button>
          </div>
        </div>
      </div>
    </ApplicantShell>
  )
}
