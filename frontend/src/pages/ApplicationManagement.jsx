import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { TYPES, APPLICANT_TYPES } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { APPLICATIONS } from '../data/applications'

const PAGE_SIZE = 5

const STATUSES = ['All Statuses', 'submitted', 'pre_checked', 'survey_required', 'surveyed',
  'legal_review', 'approved', 'certificate_issued', 'rejected', 'on_hold',
  'missing_documents', 'under_objection']
const TYPE_OPTS = ['All Types', ...Object.keys(TYPES)]
const ZONES = ['All Zones', 'ZONE-RM-01', 'ZONE-RM-02', 'ZONE-RM-03']

const SELECT_CLS = 'border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white text-[#384640] cursor-pointer focus:border-[#1f5f4f] transition-colors'

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function ApplicationManagement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [zoneFilter, setZoneFilter] = useState('All Zones')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = APPLICATIONS.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.id.toLowerCase().includes(q) ||
      a.applicantName.toLowerCase().includes(q) ||
      a.parcel.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All Statuses' || a.status === statusFilter
    const matchType   = typeFilter === 'All Types'      || a.type === typeFilter
    const matchZone   = zoneFilter === 'All Zones'      || a.zone === zoneFilter
    return matchSearch && matchStatus && matchType && matchZone
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const firstItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const lastItem  = Math.min(safePage * PAGE_SIZE, filtered.length)

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, typeFilter, zoneFilter])

  return (
    <AppShell
      title="Applications"
      subtitle={`${filtered.length} of ${APPLICATIONS.length} applications`}
    >
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] min-w-[280px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="border-none outline-none text-[13px] w-full bg-transparent text-[#16201c]"
            placeholder="Search ID, applicant, parcel…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className={SELECT_CLS} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All Statuses' ? s : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>

        <select className={SELECT_CLS} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPE_OPTS.map(t => <option key={t} value={t}>{t === 'All Types' ? t : TYPES[t]}</option>)}
        </select>

        <select className={SELECT_CLS} value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        <div className="flex-1" />

        <Button variant="ghost" size="sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e3e8e5]">
                {['Application ID', 'Type', 'Applicant', 'Parcel', 'Zone', 'Status', 'Submitted', ''].map(h => (
                  <th
                    key={h}
                    className="text-left text-[11.5px] font-semibold tracking-[.05em] uppercase text-[#5e6b65] px-5 py-[13px] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((app, i) => (
                <tr
                  key={app.id}
                  className={`border-b border-[#f0f3f1] hover:bg-[#f8faf9] transition-colors ${i === paginated.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-5 py-[14px]">
                    <Link
                      to={`/applications/${app.id}`}
                      className="mono text-[13px] font-medium text-[#1f5f4f] no-underline hover:underline"
                    >
                      {app.id}
                    </Link>
                  </td>
                  <td className="px-5 py-[14px] text-[13px] text-[#384640]">
                    {TYPES[app.type] || app.type}
                  </td>
                  <td className="px-5 py-[14px]">
                    <div className="text-[13px] text-[#16201c] font-medium">{app.applicantName}</div>
                    <div className="text-[11.5px] text-[#5e6b65] mt-[2px] capitalize">{APPLICANT_TYPES[app.applicantType]}</div>
                  </td>
                  <td className="px-5 py-[14px]">
                    <span className="mono text-[13px] text-[#384640]">{app.parcel}</span>
                  </td>
                  <td className="px-5 py-[14px] text-[13px] text-[#5e6b65]">{app.zone}</td>
                  <td className="px-5 py-[14px]">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-5 py-[14px] text-[12.5px] text-[#5e6b65] whitespace-nowrap">
                    {app.submitted}
                  </td>
                  <td className="px-5 py-[14px]">
                    <Link
                      to={`/applications/${app.id}`}
                      className="text-[#9aa8a2] hover:text-[#1f5f4f] transition-colors flex"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-5 py-[13px] border-t border-[#e3e8e5]">
          <div className="text-[12.5px] text-[#5e6b65]">
            {filtered.length === 0
              ? 'No applications found'
              : `Showing ${firstItem}–${lastItem} of ${filtered.length} applications`}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {pageNumbers(safePage, totalPages).map((p, i) => (
                <button
                  key={i}
                  disabled={p === '…'}
                  onClick={() => p !== '…' && setCurrentPage(p)}
                  className={`w-8 h-8 rounded-[7px] text-[13px] font-medium border transition-colors font-[inherit] ${
                    p === safePage
                      ? 'bg-[#1f5f4f] text-white border-[#1f5f4f] cursor-default'
                      : p === '…'
                      ? 'bg-white text-[#9aa8a2] border-transparent cursor-default'
                      : 'bg-white text-[#384640] border-[#e3e8e5] hover:bg-[#f4f6f5] cursor-pointer'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  )
}
