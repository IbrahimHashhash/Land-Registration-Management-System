import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getAppsForUser, getTrackData } from '../../data/applicantApps'
import { getTimeline, addComment } from '../../api/applicant'

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

function mapApiTimeline(events) {
  return events.map(t => ({
    event: TYPE_LABELS[t.type] || t.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    actor: t.by.actor_type === 'applicant' ? 'You · via web portal'
         : t.by.actor_type === 'staff'     ? `Staff · ${t.by.actor_id || 'Registrar Office'}`
         : t.by.actor_type === 'surveyor'  ? 'Surveyor · Field team'
         : 'System',
    time: new Date(t.at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    dot: TYPE_DOTS[t.type] || '#9aa8a2',
    detail: t.meta?.text || t.meta?.reason || null,
  }))
}

export default function TrackApplication() {
  const { user } = useApplicant()
  const navigate = useNavigate()
  const { id } = useParams()

  const apps      = getAppsForUser(user?.id)
  const targetId  = id || apps[0]?.id
  const app       = apps.find(a => a.id === targetId) || apps[0]
  const staticData = app ? getTrackData(app.id) : null

  const [timeline, setTimeline]         = useState(staticData?.timeline || [])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [commentText,   setCommentText]   = useState('')
  const [commentStatus, setCommentStatus] = useState('idle') // idle | loading | success | error

  function refreshTimeline() {
    if (!app?.id) return
    setTimelineLoading(true)
    getTimeline(app.id)
      .then(events => {
        if (Array.isArray(events) && events.length > 0) {
          setTimeline(mapApiTimeline(events))
        }
      })
      .catch(() => { /* keep static timeline */ })
      .finally(() => setTimelineLoading(false))
  }

  async function handleComment() {
    if (!commentText.trim()) return
    setCommentStatus('loading')
    try {
      await addComment(app.id, {
        author_id: user?.applicant_id || user?.id,
        text: commentText.trim(),
      })
      setCommentStatus('success')
      setCommentText('')
      refreshTimeline()
    } catch {
      setCommentStatus('error')
    }
  }

  useEffect(() => {
    setTimeline(staticData?.timeline || [])
    refreshTimeline()
  }, [app?.id])

  if (!app || !staticData) {
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

  return (
    <ApplicantShell title="Track Application" subtitle={`${app.id} · ${app.typeLabel}`}>
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
            <span className="mono text-[19px] font-semibold">{app.id}</span>
            <span
              className="text-[11.5px] font-semibold px-[12px] py-[5px] rounded-full"
              style={{ color: app.statusFg, background: app.statusBg }}
            >
              {app.statusLabel}
            </span>
          </div>
          <div className="text-[13.5px] text-[#5e6b65] mt-[6px]">
            {app.typeLabel} · Parcel {app.parcel} · {app.zone}
          </div>
        </div>
      </div>

      {/* App selector (if multiple apps) */}
      {apps.length > 1 && (
        <div className="flex gap-[8px] mb-[20px] flex-wrap">
          {apps.map(a => (
            <button
              key={a.id}
              onClick={() => navigate(`/applicant/track/${a.id}`)}
              className="px-[12px] py-[7px] rounded-[9px] border text-[12.5px] font-semibold transition-colors cursor-pointer"
              style={{
                fontFamily: 'inherit',
                borderColor: a.id === app.id ? '#1f5f4f' : '#e3e8e5',
                background:  a.id === app.id ? '#e7f1ee'  : '#fff',
                color:       a.id === app.id ? '#1f5f4f'  : '#384640',
              }}
            >
              {a.id}
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
              {timelineLoading && (
                <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
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
              {staticData.nextStep && (
                <div className="relative pl-[24px] ml-[5px]">
                  <div className="absolute left-[-7px] top-[1px] w-[12px] h-[12px] rounded-full bg-white border-2 border-dashed border-[#c2ccc7]" />
                  <div className="text-[13px] font-semibold text-[#9aa8a2] mt-[-3px]">{staticData.nextStep}</div>
                  <div className="text-[11.5px] text-[#9aa8a2] mt-[2px]">Next step · pending</div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
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
            {staticData.docs.map((d, i) => (
              <div key={i} className="flex items-center gap-[13px] py-[11px] border-b border-[#f2f4f3] last:border-b-0">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f0f3f1] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e6b65" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{d.type}</div>
                  <div className="text-[11.5px] text-[#5e6b65]">{d.file}</div>
                </div>
                <span
                  className="text-[11px] font-semibold px-[10px] py-1 rounded-full shrink-0"
                  style={{ color: d.fg, background: d.bg }}
                >
                  {d.sLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Registrar notes */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[14px]">Registrar Notes</div>
            {staticData.notes.map((n, i) => (
              <div key={i} className="flex gap-[11px] p-[12px] bg-[#f7f9f8] rounded-[9px]">
                <div className="w-[30px] h-[30px] rounded-[7px] bg-[#eef1f4] text-[#475569] flex items-center justify-center font-bold text-[11px] shrink-0">
                  {n.actor}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px]">
                    <span className="font-semibold">Staff #{n.actor.replace('S', '')}</span>
                    <span className="text-[#9aa8a2]"> · {n.date}</span>
                  </div>
                  <div className="text-[13px] text-[#384640] mt-1 leading-relaxed">{n.text}</div>
                </div>
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
                ['Type',      app.typeLabel,  false],
                ['Parcel',    app.parcel,     true],
                ['Zone',      app.zone,       false],
                ['Submitted', app.submitted,  false],
                ['Priority',  'Normal',       false],
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
              <div
                className="w-[40px] h-[40px] rounded-[9px] flex items-center justify-center shrink-0"
                style={{ background: staticData.survey.color + '22', color: staticData.survey.color }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: staticData.survey.color }}>
                  {staticData.survey.label}
                </div>
                <div className="text-[11.5px] text-[#5e6b65] mt-0.5 leading-snug">{staticData.survey.desc}</div>
              </div>
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
