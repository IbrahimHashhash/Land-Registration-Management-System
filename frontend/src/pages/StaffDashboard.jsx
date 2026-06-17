import React from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import { STATUS } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { APPLICATIONS, BREAKDOWN } from '../data/applications'

const KPI_CARDS = [
  {
    label: 'Total Pending',
    value: 47,
    sub: '↑ 14% this week',
    accent: '#1f5f4f',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: 'Legal Review',
    value: 6,
    sub: '3 need attention',
    accent: '#6d28d9',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <polyline points="9 14 11 16 15 12"/>
      </svg>
    ),
  },
  {
    label: 'Missing Documents',
    value: 8,
    sub: '4 critical',
    accent: '#b45309',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Under Objection',
    value: 3,
    sub: '2 high priority',
    accent: '#be123c',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
]

const URGENT_STATUSES = new Set(['missing_documents', 'under_objection', 'legal_review', 'survey_required'])
const urgentApps = APPLICATIONS.filter(a => URGENT_STATUSES.has(a.status))
const maxCount = Math.max(...BREAKDOWN.map(b => b.count))

export default function StaffDashboard() {
  return (
    <AppShell title="Dashboard" subtitle="Monday, June 17, 2026 · Ramallah District Office">

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-[18px] mb-[22px]">
        {KPI_CARDS.map(({ label, value, sub, accent, icon }) => (
          <Card key={label} className="p-[22px] overflow-hidden relative">
            <div
              className="absolute top-0 left-0 right-0 h-[3.5px] rounded-t-[13px]"
              style={{ background: accent }}
            />
            <div className="flex items-start justify-between mb-4 pt-1">
              <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.06em] leading-snug">
                {label}
              </div>
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0"
                style={{ color: accent, background: accent + '1a' }}
              >
                {icon}
              </div>
            </div>
            <div className="text-[38px] font-bold leading-none text-[#16201c] mb-1.5">{value}</div>
            <div className="text-[12.5px] text-[#5e6b65]">{sub}</div>
          </Card>
        ))}
      </div>

      {/* Bottom grid: status chart + attention queue */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: '1.05fr 1.55fr' }}>

        {/* Applications by Status */}
        <Card className="p-[22px]">
          <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Applications by Status</div>
          <div className="text-[12px] text-[#5e6b65] mb-5">
            Distribution across 47 active applications
          </div>
          <div className="space-y-[12px]">
            {BREAKDOWN.map(({ key, count }) => {
              const s = STATUS[key]
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-[130px] text-[12.5px] text-[#5e6b65] shrink-0 truncate">{s.label}</div>
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
        </Card>

        {/* Needs Your Attention */}
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
            {urgentApps.length} applications require immediate action
          </div>
          <div className="divide-y divide-[#f0f3f1]">
            {urgentApps.map(app => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex items-center gap-3 py-[11px] no-underline group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-[3px]">
                    <span className="mono text-[12.5px] font-medium text-[#1f5f4f] group-hover:underline">
                      {app.id}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="text-[12.5px] text-[#5e6b65] truncate">
                    {app.applicantName} · {app.parcel} · {app.zone}
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
        </Card>

      </div>
    </AppShell>
  )
}
