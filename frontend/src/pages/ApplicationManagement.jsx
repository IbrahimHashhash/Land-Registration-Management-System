import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { TYPES } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { listApplications } from '../api/applications'
import { apiError } from '../utils/apiError'

const PRIORITY_DOT = { high: '#dc2626', normal: '#9aa8a2', low: '#1e5fae' }

const DONE_STATES = ['approved', 'certificate_issued', 'closed']

function KpiCard({ label, value, color }) {
  return (
    <Card className="px-[18px] py-[15px]">
      <div className="text-[12px] text-[#5e6b65] mb-1">{label}</div>
      <div className="text-[24px] font-bold leading-none" style={{ color: color || '#16201c' }}>{value}</div>
    </Card>
  )
}

const PAGE_SIZE = 8

const STATUSES = ['All Statuses', 'submitted', 'pre_checked', 'survey_required', 'surveyed',
  'legal_review', 'approved', 'certificate_issued', 'closed', 'rejected', 'on_hold',
  'missing_documents', 'under_objection']
const TYPE_OPTS = ['All Types', ...Object.keys(TYPES)]
const ZONES = ['All Zones', 'ZONE-RM-01', 'ZONE-RM-02', 'ZONE-RM-03']

const SELECT_CLS = 'border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white text-[#384640] cursor-pointer focus:border-[#1f5f4f] transition-colors'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function parcelLabel(app) {
  const p = app.parcel || {}
  return [p.parcel_no, p.block_no].filter(Boolean).join(' / ') || '—'
}

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
  const [submittedFrom, setSubmittedFrom] = useState('')
  const [submittedTo, setSubmittedTo] = useState('')
  const [page, setPage] = useState(1)

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter, zoneFilter, submittedFrom, submittedTo])

  useEffect(() => {
    let active = true
    listApplications({ page: 1, page_size: 500 })
      .then(res => {
        if (!active) return
        const by = {}
        res.data.items.forEach(a => { by[a.status] = (by[a.status] || 0) + 1 })
        setStats({ total: res.data.total, by })
      })
      .catch(() => active && setStats(null))
    return () => { active = false }
  }, [reloadKey])

  const kpis = useMemo(() => {
    if (!stats) return null
    const by = stats.by
    const sum = keys => keys.reduce((n, k) => n + (by[k] || 0), 0)
    return {
      total: stats.total,
      done: sum(DONE_STATES),
      inProgress: stats.total - sum([...DONE_STATES, 'rejected']),
      rejected: by.rejected || 0,
    }
  }, [stats])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const params = {
      page, page_size: PAGE_SIZE,
      status: statusFilter, application_type: typeFilter, zone_id: zoneFilter,
      search: search || undefined,
      submitted_from: submittedFrom || undefined,
      submitted_to: submittedTo || undefined,
    }
    listApplications(params)
      .then(res => {
        if (!active) return
        setItems(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
      })
      .catch((e) => active && setError(apiError(e, 'Could not load applications.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, statusFilter, typeFilter, zoneFilter, submittedFrom, submittedTo, page, reloadKey])

  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)

  return (
    <AppShell title="Applications" subtitle={`${total} application${total === 1 ? '' : 's'}`}>
      {kpis && (
        <div className="grid grid-cols-4 gap-4 mb-5">
          <KpiCard label="Total Applications" value={kpis.total} />
          <KpiCard label="In Progress" value={kpis.inProgress} color="#b45309" />
          <KpiCard label="Approved / Issued" value={kpis.done} color="#1f7a4d" />
          <KpiCard label="Rejected" value={kpis.rejected} color="#b91c1c" />
        </div>
      )}

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

        <input
          type="date"
          value={submittedFrom}
          onChange={e => setSubmittedFrom(e.target.value)}
          className={SELECT_CLS}
          title="Submitted from"
        />
        <input
          type="date"
          value={submittedTo}
          onChange={e => setSubmittedTo(e.target.value)}
          className={SELECT_CLS}
          title="Submitted to"
        />
        {(submittedFrom || submittedTo) && (
          <button
            type="button"
            onClick={() => { setSubmittedFrom(''); setSubmittedTo('') }}
            className="text-[12px] text-[#5e6b65] underline cursor-pointer bg-transparent border-none"
            style={{ fontFamily: 'inherit' }}
          >
            clear dates
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e3e8e5]">
                {['Application ID', 'Type', 'Applicant', 'Parcel', 'Zone', 'Status', 'Submitted', ''].map(h => (
                  <th key={h} className="text-left text-[11.5px] font-semibold tracking-[.05em] uppercase text-[#5e6b65] px-5 py-[13px] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && items.map((app, i) => (
                <tr
                  key={app.application_id}
                  onClick={() => navigate(`/applications/${app.application_id}`)}
                  className={`border-b border-[#f0f3f1] hover:bg-[#f8faf9] transition-colors cursor-pointer ${i === items.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-5 py-[14px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-[7px] h-[7px] rounded-full shrink-0"
                        style={{ background: PRIORITY_DOT[app.priority] || PRIORITY_DOT.normal }}
                        title={`${app.priority || 'normal'} priority`}
                      />
                      <span className="mono text-[13px] font-medium text-[#1f5f4f] hover:underline">{app.application_id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-[14px] text-[13px] text-[#384640]">{TYPES[app.application_type] || app.application_type}</td>
                  <td className="px-5 py-[14px]">
                    <span className="mono text-[12.5px] text-[#16201c]">{app.applicant_ref?.applicant_id || '—'}</span>
                  </td>
                  <td className="px-5 py-[14px]"><span className="mono text-[13px] text-[#384640]">{parcelLabel(app)}</span></td>
                  <td className="px-5 py-[14px] text-[13px] text-[#5e6b65]">{app.parcel?.zone_id || '—'}</td>
                  <td className="px-5 py-[14px]"><StatusBadge status={app.status} /></td>
                  <td className="px-5 py-[14px] text-[12.5px] text-[#5e6b65] whitespace-nowrap">{fmtDate(app.submission_date)}</td>
                  <td className="px-5 py-[14px]">
                    <Link to={`/applications/${app.application_id}`} className="text-[#9aa8a2] hover:text-[#1f5f4f] transition-colors flex">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && <div className="px-5 py-10 text-center text-[13px] text-[#5e6b65]">Loading applications…</div>}
          {!loading && error && (
            <div className="px-5 py-10 flex flex-col items-center gap-3">
              <div className="text-[13px] text-[#b91c1c] text-center max-w-[460px]">{error}</div>
              <Button variant="ghost" size="sm" onClick={() => setReloadKey(k => k + 1)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Retry
              </Button>
            </div>
          )}
          {!loading && !error && items.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#5e6b65]">No applications found</div>}
        </div>

        <div className="flex items-center justify-between px-5 py-[13px] border-t border-[#e3e8e5]">
          <div className="text-[12.5px] text-[#5e6b65]">
            {total === 0 ? 'No applications' : `Showing ${firstItem}–${lastItem} of ${total} applications`}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {pageNumbers(page, totalPages).map((p, i) => (
                <button
                  key={i}
                  disabled={p === '…'}
                  onClick={() => p !== '…' && setPage(p)}
                  className={`w-8 h-8 rounded-[7px] text-[13px] font-medium border transition-colors font-[inherit] ${
                    p === page
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
