import React, { useEffect, useState } from 'react'
import SurveyorShell from '../../components/SurveyorShell'
import api from '../../api/client'
import { TYPES, STATUS } from '../../theme'

const labelize = s => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function MonthlyBars({ data, color }) {
  if (!data.length) return <p className="text-[12.5px] text-[#5e6b65]">No data.</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-3 h-[140px]">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center justify-end">
          <span className="text-[11px] text-[#5e6b65] mb-1">{d.count}</span>
          <div className="w-full rounded-t-[6px]" style={{ height: `${(d.count / max) * 100}%`, background: color, minHeight: '4px' }} />
          <span className="text-[10.5px] text-[#8a988f] mt-1.5">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState(null)
  const [byZone, setByZone] = useState({})
  const [byStatus, setByStatus] = useState({})
  const [byType, setByType] = useState({})
  const [hotspots, setHotspots] = useState([])
  const [delayed, setDelayed] = useState([])
  const [surveyors, setSurveyors] = useState([])
  const [registrars, setRegistrars] = useState([])
  const [overTime, setOverTime] = useState([])
  const [processing, setProcessing] = useState([])
  const [certsPerMonth, setCertsPerMonth] = useState([])

  useEffect(() => {
    api.get('/analytics/kpis').then(r => setKpis(r.data)).catch(() => {})
    api.get('/analytics/applications-by-zone').then(r => setByZone(r.data)).catch(() => {})
    api.get('/analytics/applications-by-status').then(r => setByStatus(r.data)).catch(() => {})
    api.get('/analytics/applications-by-type').then(r => setByType(r.data)).catch(() => {})
    api.get('/analytics/hotspots').then(r => setHotspots(r.data)).catch(() => {})
    api.get('/analytics/delayed').then(r => setDelayed(r.data)).catch(() => {})
    api.get('/analytics/surveyors').then(r => setSurveyors(r.data)).catch(() => {})
    api.get('/analytics/registrars').then(r => setRegistrars(r.data)).catch(() => {})
    api.get('/analytics/applications-over-time').then(r => setOverTime(r.data)).catch(() => {})
    api.get('/analytics/processing-time').then(r => setProcessing(r.data)).catch(() => {})
    api.get('/analytics/certificates-per-month').then(r => setCertsPerMonth(r.data)).catch(() => {})
  }, [])

  const maxZone = Math.max(...Object.values(byZone), 1)
  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  const maxStatus = Math.max(...Object.values(byStatus), 1)
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1])
  const maxType = Math.max(...Object.values(byType), 1)
  const csvUrl = `${api.defaults.baseURL}/analytics/export/applications.csv`

  return (
    <SurveyorShell title="Analytics Dashboard" subtitle="Operational and spatial insights">
      <div className="flex justify-end mb-4">
        <a
          href={csvUrl}
          className="inline-flex items-center gap-1.5 border border-[#e3e8e5] rounded-[9px] bg-white text-[#384640] font-semibold text-[12px] px-3 py-[7px] hover:bg-[#f4f6f5] no-underline transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
          Export CSV
        </a>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Applications', value: kpis.total, color: '#1f5f4f' },
            { label: 'Pending', value: kpis.pending, color: '#b45309' },
            { label: 'Approved', value: kpis.approved, color: '#1f7a4d' },
            { label: 'Approval Rate', value: `${kpis.approval_rate}%`, color: '#0e7490' },
            { label: 'Under Objection', value: kpis.under_objection, color: '#be123c' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
              <div className="text-[12px] text-[#5e6b65] font-medium mb-1">{k.label}</div>
              <div className="text-[26px] font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-4">Applications Over Time</h3>
          <MonthlyBars data={overTime} color="#1f5f4f" />
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-4">Certificates Issued Per Month</h3>
          <MonthlyBars data={certsPerMonth} color="#0e7490" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-4">Applications by Status</h3>
          {statusEntries.length > 0 ? (
            <div className="space-y-2.5">
              {statusEntries.map(([st, count]) => (
                <div key={st} className="flex items-center gap-3">
                  <span className="text-[12.5px] text-[#384640] w-36 shrink-0">{STATUS[st]?.label || labelize(st)}</span>
                  <div className="flex-1 bg-[#eef1f4] rounded-full h-[10px] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / maxStatus) * 100}%`, background: STATUS[st]?.fg || '#1f5f4f' }} />
                  </div>
                  <span className="text-[12px] text-[#5e6b65] w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-[#5e6b65]">No data.</p>}
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-4">Applications by Type</h3>
          {typeEntries.length > 0 ? (
            <div className="space-y-2.5">
              {typeEntries.map(([t, count]) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="text-[12.5px] text-[#384640] w-36 shrink-0">{TYPES[t] || labelize(t)}</span>
                  <div className="flex-1 bg-[#eef1f4] rounded-full h-[10px] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1e5fae]" style={{ width: `${(count / maxType) * 100}%` }} />
                  </div>
                  <span className="text-[12px] text-[#5e6b65] w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-[#5e6b65]">No data.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Hotspot Zones</h3>
          {hotspots.length > 0 ? (
            <div className="space-y-2.5">
              {hotspots.map((h, i) => (
                <div key={h.zone_id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#fbe6e6] text-[#b91c1c] text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-[12.5px] text-[#384640] flex-1 mono">{h.zone_id}</span>
                  <span className="text-[12.5px] font-semibold text-[#16201c]">{h.count} applications</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-[#5e6b65]">No data.</p>}
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Delayed Applications <span className="text-[11.5px] font-normal text-[#9aa8a2]">(pending &gt; 14 days)</span></h3>
          {delayed.length > 0 ? (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {delayed.map(d => (
                <div key={d.application_id} className="flex items-center justify-between text-[12.5px]">
                  <span className="mono text-[#1f5f4f]">{d.application_id}</span>
                  <span className="text-[#5e6b65]">{STATUS[d.status]?.label || labelize(d.status)}</span>
                  <span className="font-semibold text-[#b45309]">{d.age_days}d</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-[#5e6b65]">No delayed applications.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Pending Applications by Zone</h3>
          {Object.keys(byZone).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(byZone).map(([zone, count]) => (
                <div key={zone} className="flex items-center gap-3">
                  <span className="text-[12.5px] text-[#384640] w-28">{zone}</span>
                  <div className="flex-1 bg-[#eef1f4] rounded-full h-[10px] overflow-hidden">
                    <div className="h-full rounded-full bg-[#b45309]" style={{ width: `${(count / maxZone) * 100}%` }} />
                  </div>
                  <span className="text-[12px] text-[#5e6b65] w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No data.</p>
          )}
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Average Processing Time</h3>
          {processing.length > 0 ? (
            <div className="space-y-2">
              {processing.map(p => (
                <div key={p.application_type} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#384640]">{TYPES[p.application_type] || p.application_type}</span>
                  <span className="font-semibold text-[#16201c]">{p.avg_days} days</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No approved applications yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Surveyor Workload</h3>
          {surveyors.length > 0 ? (
            <div className="space-y-3">
              {surveyors.map(s => (
                <div key={s.staff_code} className="flex items-center gap-4">
                  <span className="text-[13px] font-medium text-[#16201c] w-40 truncate">{s.name}</span>
                  <div className="flex-1 bg-[#eef1f4] rounded-full h-[10px] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1f5f4f]" style={{ width: `${(s.active_tasks / s.max_tasks) * 100}%` }} />
                  </div>
                  <span className="text-[12px] text-[#5e6b65] w-16 text-right">{s.active_tasks}/{s.max_tasks}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No surveyors.</p>
          )}
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Registrar Workload</h3>
          {registrars.length > 0 ? (
            <div className="space-y-3">
              {registrars.map(r => (
                <div key={r.staff_code} className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#16201c] truncate">{r.name}</span>
                  <span className="text-[#5e6b65]"><span className="font-semibold text-[#16201c]">{r.reviewed_applications}</span> reviewed</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No registrars.</p>
          )}
        </div>
      </div>
    </SurveyorShell>
  )
}
