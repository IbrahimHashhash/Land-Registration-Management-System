import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import {
  getApplicantApplications,
  getTimeline,
  getApplicationDocuments,
  addComment,
} from '../../api/applicant'
import { STATUS, TYPES } from '../../theme'

const TYPE_LABELS = {
  submitted:         'Submitted',
  pre_checked:       'Pre-Checked',
  document_uploaded: 'Document Uploaded',
  comment_added:     'Comment Added',
  objection_created: 'Objection Filed',
  status_changed:    'Status Changed',
  missing_document:  'Missing Document',
  survey_required:   'Survey Required',
}

const TYPE_DOTS = {
  submitted:         '#1e5fae',
  pre_checked:       '#0f766e',
  document_uploaded: '#1f5f4f',
  comment_added:     '#6d28d9',
  objection_created: '#be123c',
  status_changed:    '#b45309',
  missing_document:  '#b45309',
  survey_required:   '#b45309',
}

const DOC_STATUS_BADGE = {
  verified:       { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review: { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  missing:        { label: 'Missing',        fg: '#b91c1c', bg: '#fbe6e6' },
  rejected:       { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapTimeline(events) {
  return (events || []).map(t => ({
    event: TYPE_LABELS[t.type] || t.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    actor: t.by?.actor_type === 'applicant' ? 'You · via web portal'
         : t.by?.actor_type === 'staff'     ? `Staff · ${t.by?.actor_id || 'Registrar Office'}`
         : t.by?.actor_type === 'surveyor'  ? 'Surveyor · Field team'
         : 'System',
    time: formatDateTime(t.at),
    dot: TYPE_DOTS[t.type] || '#9aa8a2',
    detail: t.meta?.text || t.meta?.reason || null,
  }))
}

export default function TrackApplication() {
  const { user } = useApplicant()
  const navigate = useNavigate()
  const { id } = useParams()

  const [apps, setApps] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [timeline, setTimeline] = useState([])
  const [docs, setDocs] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [docsLoading, setDocsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentStatus, setCommentStatus] = useState('idle')

  // Load applicant's applications
  useEffect(() => {
    if (!user?.applicant_id) { setAppsLoading(false); return }
    setAppsLoading(true)
    getApplicantApplications(user.applicant_id)
      .then(list => setApps(list || []))
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false))
  }, [user?.applicant_id])

  const targetId = id || apps[0]?.application_id
  const app = apps.find(a => a.application_id === targetId) || apps[0]

  function refreshTimeline() {
    if (!app?.application_id) return
    setTimelineLoading(true)
    getTimeline(app.application_id)
      .then(events => setTimeline(mapTimeline(events)))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false))
  }

  function refreshDocs() {
    if (!app?.application_id) return
    setDocsLoading(true)
    getApplicationDocuments(app.application_id)
      .then(list => setDocs(list || []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }

  useEffect(() => {
    if (!app?.application_id) { setTimeline([]); setDocs([]); return }
    refreshTimeline()
    refreshDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.application_id])

  async function handleComment() {
    if (!commentText.trim()) return
    setCommentStatus('loading')
    try {
      await addComment(app.application_id, {
        author_id: user?.applicant_id,
        text: commentText.trim(),
      })
      setCommentStatus('success')
      setCommentText('')
      refreshTimeline()
    } catch {
      setCommentStatus('error')
    }
  }

  if (appsLoading) {
    return (
      <ApplicantShell title="Track Application" subtitle="Loading…">
        <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#9aa8a2]">
          <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </ApplicantShell>
    )
  }

  if (!app) {
    return (
      <ApplicantShell title="Track Application" subtitle="No applications found">
        <div className="text-[13px] text-[#9aa8a2] pt-8 text-center">
          You have no applications to track.{' '}
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

  const st = STATUS[app.status] || { label: app.status, fg: '#475569', bg: '#eef1f4' }
  const typeLabel = TYPES[app.application_type] || app.application_type

  return (
    <ApplicantShell title="Track Application" subtitle={`${app.application_id} · ${typeLabel}`}>
      <button
        onClick={() => navigate('/applicant')}
        className="inline-flex items-center gap-[6px] text-[13px] text-[#5e6b65] font-medium mb-[16px] cursor-pointer bg-transparent border-none p-0 hover:text-[#1f5f4f] transition-colors"
        style={{ fontFamily: 'inherit' }}
      >
        ‹ Back to dashboard
      </button>

      <div className="flex items-start gap-[12px] mb-[20px] flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[12px] flex-wrap">
            <span className="mono text-[19px] font-semibold">{app.application_id}</span>
            <span
              className="text-[11.5px] font-semibold px-[12px] py-[5px] rounded-full"
              style={{ color: st.fg, background: st.bg }}
            >
              {st.label}
            </span>
          </div>
          <div className="text-[13.5px] text-[#5e6b65] mt-[6px]">
            {typeLabel} · Submitted {formatDate(app.submission_date)}
          </div>
        </div>
      </div>

      {apps.length > 1 && (
        <div className="flex gap-[8px] mb-[20px] flex-wrap">
          {apps.map(a => (
            <button
              key={a.application_id}
              onClick={() => navigate(`/applicant/track/${a.application_id}`)}
              className="px-[12px] py-[7px] rounded-[9px] border text-[12.5px] font-semibold transition-colors cursor-pointer"
              style={{
                fontFamily: 'inherit',
                borderColor: a.application_id === app.application_id ? '#1f5f4f' : '#e3e8e5',
                background:  a.application_id === app.application_id ? '#e7f1ee'  : '#fff',
                color:       a.application_id === app.application_id ? '#1f5f4f'  : '#384640',
              }}
            >
              {a.application_id}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-[16px]" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="flex flex-col gap-[16px]">
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="flex items-center justify-between mb-[18px]">
              <div className="text-[14.5px] font-bold">Status Timeline</div>
              {timelineLoading && (
                <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {timeline.length === 0 && !timelineLoading ? (
              <div className="text-[12.5px] text-[#9aa8a2]">No timeline events yet.</div>
            ) : (
              <div className="relative pl-[6px]">
                {timeline.map((t, i) => (
                  <div key={i} className="relative pl-[24px] pb-[18px] border-l-2 border-[#eef1ef] ml-[5px]">
                    <div
                      className="absolute left-[-7px] top-[1px] w-[12px] h-[12px] rounded-full border-2 border-white"
                      style={{ background: t.dot, boxShadow: `0 0 0 2px ${t.dot}` }}
                    />
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
              </div>
            )}
          </div>

          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="flex items-baseline justify-between mb-[14px]">
              <div className="text-[14.5px] font-bold">Documents</div>
              <button
                onClick={() => navigate('/applicant/upload')}
                className="text-[12.5px] text-[#1f5f4f] font-semibold cursor-pointer bg-transparent border-none p-0 hover:underline"
                style={{ fontFamily: 'inherit' }}
              >
                Upload more
              </button>
            </div>
            {docsLoading ? (
              <div className="text-[12.5px] text-[#9aa8a2] py-2">Loading documents…</div>
            ) : docs.length === 0 ? (
              <div className="text-[12.5px] text-[#9aa8a2] py-2">No documents uploaded yet.</div>
            ) : docs.map((d, i) => {
              const badge = DOC_STATUS_BADGE[d.verification_status] ||
                { label: d.verification_status, fg: '#475569', bg: '#eef1f4' }
              return (
                <div key={d.document_id || i} className="flex items-center gap-[13px] py-[11px] border-b border-[#f2f4f3] last:border-b-0">
                  <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f0f3f1] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e6b65" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{d.document_type?.replace(/_/g, ' ')}</div>
                    <div className="text-[11.5px] text-[#5e6b65] mono">{d.file_name}</div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-[10px] py-1 rounded-full shrink-0"
                    style={{ color: badge.fg, background: badge.bg }}
                  >
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>

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

        <div className="flex flex-col gap-[16px] self-start">
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Application Summary</div>
            <div className="flex flex-col gap-[11px] text-[12.5px]">
              {[
                ['Type',      typeLabel,                       false],
                ['Status',    st.label,                        false],
                ['Submitted', formatDate(app.submission_date), false],
              ].map(([k, v, mono]) => (
                <div key={k} className="flex justify-between gap-[10px]">
                  <span className="text-[#5e6b65]">{k}</span>
                  <span className={`font-semibold ${mono ? 'mono' : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[9px]">
            <button
              onClick={() => navigate('/applicant/upload')}
              className="w-full py-[11px] border border-[#e3e8e5] rounded-[9px] bg-white text-[#384640] text-[13px] font-semibold cursor-pointer hover:bg-[#f4f6f5] transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              Upload Missing Documents
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
