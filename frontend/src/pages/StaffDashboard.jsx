import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import { STATUS } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { getKpis, getByStatus } from '../api/analytics'
import { listApplications } from '../api/applications'

const URGENT_STATUSES = ['missing_documents', 'under_objection', 'legal_review', 'survey_required']

function todayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function StaffDashboard() {
  const [kpis, setKpis] = useState(null)
  const [byStatus, setByStatus] = useState(null)
  const [urgent, setUrgent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      getKpis(),
      getByStatus(),
      Promise.all(URGENT_STATUSES.map(s =>
        listApplications({ status: s, page: 1, page_size: 5 }).catch(() => ({ data: { items: [] } }))
      )),
    ])
      .then(([kpiRes, byStatusRes, urgentResults]) => {
        if (!active) return
        setKpis(kpiRes.data)
        setByStatus(byStatusRes.data)
        const allUrgent = []
        urgentResults.forEach(r => allUrgent.push(...(r.data?.items || [])))
        setUrgent(allUrgent.slice(0, 8))
      })
      .catch(err => active && setError(err.response?.data?.detail || 'Could not load dashboard.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const KPI_CARDS = kpis ? [
    { label: 'Total Pending',     value: kpis.pending,            sub: 'in progress',           accent: '#1f5f4f' },
    { label: 'Approved',          value: kpis.approved,           sub: 'completed',             accent: '#1f7a4d' },
    { label: 'Certificates Issued', value: kpis.certificate_issued, sub: 'issued to applicants', accent: '#0e7490' },
    { label: 'Under Objection',   value: kpis.under_objection,    sub: 'disputes',              accent: '#be123c' },
  ] : []

  const breakdownEntries = byStatus ? Object.entries(byStatus) : []
  const maxCount = breakdownEntries.length ? Math.max(...breakdownEntries.map(([, c]) => c)) : 1

  return (
    <AppShell title="Dashboard" subtitle={`${todayString()} · Ramallah District Office`}>
      {loading && (
        <div className="py-10 text-center text-[13px] text-[#5e6b65]">Loading dashboard…</div>
      )}
      {error && (
        <div className="px-[14px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px] mb-5">
          {error}
        </div>
      )}

      {!loading && kpis && (
        <>
          <div className="grid grid-cols-4 gap-[18px] mb-[22px]">
            {KPI_CARDS.map(({ label, value, sub, accent }) => (
              <Card key={label} className="p-[22px] overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 right-0 h-[3.5px] rounded-t-[13px]"
                  style={{ background: accent }}
                />
                <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.06em] leading-snug mt-1">
                  {label}
                </div>
                <div className="text-[38px] font-bold leading-none text-[#16201c] mb-1.5 mt-3">{value}</div>
                <div className="text-[12.5px] text-[#5e6b65]">{sub}</div>
              </Card>
            ))}
          </div>

          <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1.05fr 1.55fr' }}>
            <Card className="p-[22px]">
              <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Applications by Status</div>
              <div className="text-[12px] text-[#5e6b65] mb-5">
                Distribution across {kpis.total} application{kpis.total === 1 ? '' : 's'}
              </div>
              {breakdownEntries.length === 0 ? (
                <div className="text-[12.5px] text-[#9aa8a2] py-2">No data.</div>
              ) : (
                <div className="space-y-[12px]">
                  {breakdownEntries.map(([key, count]) => {
                    const s = STATUS[key] || { label: key.replace(/_/g, ' '), fg: '#475569' }
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-[130px] text-[12.5px] text-[#5e6b65] shrink-0 truncate capitalize">{s.label}</div>
                        <div className="flex-1 bg-[#eef1f4] rounded-full h-[7px]">
                          <div
                            className="h-[7px] rounded-full"
                            style={{ width: `${pct}%`, background: s.fg }}
                          />
                        </div>
                        <div className="w-5 text-right text-[12.5px] font-semibold text-[#384640] shrink-0">
                          {count}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className="p-[22px]">
              <div className="flex items-center justify-between mb-[5px]">
                <div className="text-[14px] font-bold text-[#16201c]">Needs Your Attention</div>
                <Link
                  to="/applications"
                  className="text-[12.5px] font-semibold text-[#1f5f4f] no-underline hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="text-[12px] text-[#5e6b65] mb-4">
                {urgent.length} application{urgent.length === 1 ? '' : 's'} require immediate action
              </div>
              {urgent.length === 0 ? (
                <div className="text-[12.5px] text-[#9aa8a2] py-2">Nothing urgent right now.</div>
              ) : (
                <div className="divide-y divide-[#f0f3f1]">
                  {urgent.map(app => (
                    <Link
                      key={app.application_id}
                      to={`/applications/${app.application_id}`}
                      className="flex items-center gap-3 py-[11px] no-underline group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-[3px]">
                          <span className="mono text-[12.5px] font-medium text-[#1f5f4f] group-hover:underline">
                            {app.application_id}
                          </span>
                          <StatusBadge status={app.status} />
                        </div>
                        <div className="text-[12.5px] text-[#5e6b65] truncate">
                          {app.applicant_ref?.applicant_id || '—'} · {app.parcel?.parcel_no || '—'}/{app.parcel?.block_no || '—'} · {app.parcel?.zone_id || '—'}
                        </div>
                      </div>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#9aa8a2" strokeWidth="2"
                        className="shrink-0 group-hover:stroke-[#1f5f4f] transition-colors"
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </AppShell>
  )
}
