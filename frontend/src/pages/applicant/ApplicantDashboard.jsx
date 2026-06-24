import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getApplicantApplications } from '../../api/applicant'
import { STATUS, TYPES } from '../../theme'

const FILE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DONE_STATUSES   = new Set(['approved', 'certificate_issued'])
const ACTION_STATUSES = new Set(['missing_documents', 'under_objection'])

export default function ApplicantDashboard() {
  const { user } = useApplicant()
  const navigate = useNavigate()

  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!user?.applicant_id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    getApplicantApplications(user.applicant_id)
      .then(apiApps => {
        const mapped = (apiApps || []).map(a => {
          const st = STATUS[a.status] || { label: a.status, fg: '#475569', bg: '#eef1f4' }
          return {
            id:          a.application_id,
            type:        a.application_type,
            typeLabel:   TYPES[a.application_type] || a.application_type,
            status:      a.status,
            statusLabel: st.label,
            statusFg:    st.fg,
            statusBg:    st.bg,
            submitted:   formatDate(a.submission_date),
          }
        })
        setApps(mapped)
      })
      .catch(err => setError(err.response?.data?.detail || 'Could not load your applications.'))
      .finally(() => setLoading(false))
  }, [user?.applicant_id])

  const kpis = {
    total:    apps.length,
    pending:  apps.filter(a => !DONE_STATUSES.has(a.status)).length,
    approved: apps.filter(a =>  DONE_STATUSES.has(a.status)).length,
    action:   apps.filter(a =>  ACTION_STATUSES.has(a.status)).length,
  }

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
        ) : error ? (
          <div className="text-[13px] text-[#b91c1c] py-6 text-center">{error}</div>
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
                <div className="text-[13px] text-[#384640] mt-1">{a.typeLabel}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] text-[#5e6b65]">{a.submitted}</div>
              </div>
              <div className="text-[#c2ccc7] text-[18px] leading-none">›</div>
            </div>
          ))
        )}
      </div>
    </ApplicantShell>
  )
}
