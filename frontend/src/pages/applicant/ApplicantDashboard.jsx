import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getApplicantApplications, getTimeline } from '../../api/applicant'
import { STATUS, TYPES } from '../../theme'

const NEXT_STEP = {
  submitted:          'Awaiting pre-check',
  pre_checked:        'Awaiting survey assignment',
  missing_documents:  'Upload missing documents',
  survey_required:    'Surveyor to be assigned',
  surveyed:           'Awaiting legal review',
  legal_review:       'Awaiting registrar decision',
  under_objection:    'Objection under review',
  on_hold:            'On hold',
  approved:           'Certificate to be issued',
  certificate_issued: 'Certificate ready to collect',
  rejected:           'Application rejected',
  closed:             'Closed',
}

const EVENT_DOT = {
  submitted:           '#1e5fae',
  document_uploaded:   '#1e5fae',
  pre_checked:         '#0f766e',
  survey_required:     '#0f766e',
  surveyed:            '#0f766e',
  legal_review:        '#6d28d9',
  approved:            '#1f7a4d',
  certificate_issued:  '#1f7a4d',
  on_hold:             '#b45309',
  missing_documents:   '#b45309',
  rejected:            '#b91c1c',
  under_objection:     '#be123c',
  objection_submitted: '#be123c',
  comment_added:       '#6d28d9',
}

const EVENT_MSG = {
  submitted:           id => `Application ${id} submitted.`,
  pre_checked:         id => `Application ${id} has been pre-checked by staff.`,
  survey_required:     id => `Survey required for application ${id}.`,
  surveyed:            id => `Survey completed for application ${id}.`,
  legal_review:        id => `Application ${id} is under legal review.`,
  approved:            id => `Application ${id} has been approved.`,
  certificate_issued:  id => `Certificate issued for ${id}. Collect from the district office.`,
  on_hold:             id => `Application ${id} has been placed on hold.`,
  missing_documents:   id => `Missing documents required for application ${id}.`,
  rejected:            id => `Application ${id} has been rejected.`,
  under_objection:     id => `An objection has been filed against application ${id}.`,
  document_uploaded:   id => `Document uploaded for application ${id}.`,
  comment_added:       id => `New staff comment on application ${id}.`,
  objection_submitted: id => `Objection submitted for application ${id}.`,
}

function eventToNotif(e) {
  const msgFn = EVENT_MSG[e.type] || (id => `Update on application ${id}.`)
  return {
    message: msgFn(e.appId),
    time: new Date(e.at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }),
    dot: EVENT_DOT[e.type] || '#475569',
  }
}

const FILE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicantDashboard() {
  const { user } = useApplicant()
  const navigate = useNavigate()

  const [apps, setApps]       = useState([])
  const [kpis, setKpis]       = useState({ total: 0, pending: 0, approved: 0, action: 0 })
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.applicant_id) return
    setLoading(true)
    getApplicantApplications(user.applicant_id)
      .then(async apiApps => {
        if (!Array.isArray(apiApps) || apiApps.length === 0) return

        const merged = apiApps.map(a => {
          const st     = STATUS[a.status] || { label: a.status, fg: '#475569', bg: '#eef1f4' }
          const parcel = a.parcel || {}
          return {
            id:          a.application_id,
            type:        a.application_type,
            typeLabel:   TYPES[a.application_type] || a.application_type,
            status:      a.status,
            statusLabel: st.label,
            statusFg:    st.fg,
            statusBg:    st.bg,
            parcel:      parcel.parcel_no && parcel.block_no ? `${parcel.parcel_no} / ${parcel.block_no}` : '—',
            zone:        parcel.zone_id || '—',
            nextStep:    NEXT_STEP[a.status] || '—',
            submitted:   formatDate(a.submission_date) || '—',
          }
        })

        const DONE_STATUSES   = new Set(['approved', 'certificate_issued'])
        const ACTION_STATUSES = new Set(['missing_documents', 'under_objection'])
        setApps(merged)
        setKpis({
          total:    merged.length,
          pending:  merged.filter(a => !DONE_STATUSES.has(a.status)).length,
          approved: merged.filter(a =>  DONE_STATUSES.has(a.status)).length,
          action:   merged.filter(a =>  ACTION_STATUSES.has(a.status)).length,
        })

        const results = await Promise.allSettled(
          apiApps.map(a =>
            getTimeline(a.application_id).then(events => ({ appId: a.application_id, events }))
          )
        )
        const liveNotifs = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value.events.map(e => ({ ...e, appId: r.value.appId })))
          .sort((a, b) => new Date(b.at) - new Date(a.at))
          .slice(0, 10)
          .map(eventToNotif)
        if (liveNotifs.length > 0) setNotifs(liveNotifs)
      })
      .catch(() => { /* fall back to local data already set */ })
      .finally(() => setLoading(false))
  }, [user?.applicant_id])

  const KPI_CARDS = [
    { label: 'Total Applications', value: kpis.total,    sub: 'all time',             accent: '#1f5f4f' },
    { label: 'Pending',            value: kpis.pending,  sub: 'in progress',          accent: '#1e5fae' },
    { label: 'Approved',           value: kpis.approved, sub: 'completed',            accent: '#1f7a4d' },
    { label: 'Action Required',    value: kpis.action,   sub: 'needs your attention', accent: '#b45309' },
  ]

  return (
    <ApplicantShell
      title="My Dashboard"
      subtitle="Track your land registration applications and tasks"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-[16px] mb-[20px]">
        {KPI_CARDS.map(({ label, value, sub, accent }) => (
          <div
            key={label}
            className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]"
            style={{ borderTop: `3px solid ${accent}` }}
          >
            <div className="text-[12.5px] text-[#5e6b65] font-medium mb-[10px]">{label}</div>
            <div className="text-[32px] font-bold leading-none tracking-[-0.02em]">{value}</div>
            <div className="text-[11.5px] mt-[9px] font-medium" style={{ color: accent }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Applications list */}
      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
        <div className="flex items-baseline justify-between mb-[16px]">
          <div className="text-[14.5px] font-bold">My Applications</div>
          <button
            onClick={() => navigate('/applicant/submit')}
            className="text-[12.5px] text-[#1f5f4f] font-semibold cursor-pointer bg-transparent border-none p-0 hover:underline"
            style={{ fontFamily: 'inherit' }}
          >
            + New Application
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-[13px] text-[#9aa8a2]">
            <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : apps.length === 0 ? (
          <div className="text-[13px] text-[#9aa8a2] py-6 text-center">No applications yet.</div>
        ) : (
          apps.map(a => (
            <div
              key={a.id}
              onClick={() => navigate(`/applicant/track/${a.id}`)}
              className="flex items-center gap-[14px] px-[12px] py-[14px] rounded-[10px] cursor-pointer border-b border-[#f2f4f3] hover:bg-[#f7f9f8] transition-colors last:border-b-0"
            >
              <div
                className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: a.statusBg, color: a.statusFg }}
              >
                {FILE_ICON}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[9px] flex-wrap">
                  <span className="mono text-[13px] font-semibold">{a.id}</span>
                  <span
                    className="text-[11px] font-semibold px-[10px] py-1 rounded-full"
                    style={{ color: a.statusFg, background: a.statusBg }}
                  >
                    {a.statusLabel}
                  </span>
                </div>
                <div className="text-[13px] text-[#384640] mt-1">
                  {a.typeLabel} · Parcel {a.parcel} · {a.zone}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] text-[#5e6b65]">{a.submitted}</div>
                <div className="text-[11px] text-[#9aa8a2] mt-0.5">{a.nextStep}</div>
              </div>
              <div className="text-[#c2ccc7] text-[18px] leading-none">›</div>
            </div>
          ))
        )}
      </div>

      {/* Recent notifications */}
      {notifs.length > 0 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px] mt-[16px]">
          <div className="text-[14.5px] font-bold mb-[14px]">Recent Notifications</div>
          {notifs.map((n, i) => (
            <div key={i} className="flex gap-[12px] py-[11px] border-b border-[#f2f4f3] last:border-b-0">
              <div
                className="w-2 h-2 rounded-full mt-[5px] shrink-0"
                style={{ background: n.dot }}
              />
              <div className="flex-1">
                <div className="text-[13px] text-[#16201c] leading-relaxed">{n.message}</div>
                <div className="text-[11px] text-[#9aa8a2] mt-[3px]">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ApplicantShell>
  )
}
