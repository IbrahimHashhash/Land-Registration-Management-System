import React, { useEffect, useState } from 'react'
import SurveyorShell from '../../components/SurveyorShell'
import api from '../../api/client'

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState(null)
  const [byStatus, setByStatus] = useState({})
  const [byZone, setByZone] = useState({})
  const [surveyors, setSurveyors] = useState([])

  useEffect(() => {
    api.get('/analytics/kpis').then(r => setKpis(r.data)).catch(() => {})
    api.get('/analytics/applications-by-status').then(r => setByStatus(r.data)).catch(() => {})
    api.get('/analytics/applications-by-zone').then(r => setByZone(r.data)).catch(() => {})
    api.get('/analytics/surveyors').then(r => setSurveyors(r.data)).catch(() => {})
  }, [])

  return (
    <SurveyorShell title="Analytics Dashboard" subtitle="Operational insights and KPIs">
      {kpis && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Applications', value: kpis.total, color: '#1f5f4f' },
            { label: 'Pending', value: kpis.pending, color: '#b45309' },
            { label: 'Approved', value: kpis.approved, color: '#1f7a4d' },
            { label: 'Under Objection', value: kpis.under_objection, color: '#be123c' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
              <div className="text-[12px] text-[#5e6b65] font-medium mb-1">{k.label}</div>
              <div className="text-[28px] font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Applications by Status</h3>
          {Object.keys(byStatus).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#384640] capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-[#16201c]">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No data.</p>
          )}
        </div>

        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
          <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Pending by Zone</h3>
          {Object.keys(byZone).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(byZone).map(([zone, count]) => (
                <div key={zone} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#384640]">{zone}</span>
                  <span className="font-semibold text-[#16201c]">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#5e6b65]">No data.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-5">
        <h3 className="text-[14px] font-semibold text-[#16201c] mb-3">Surveyor Workload</h3>
        {surveyors.length > 0 ? (
          <div className="space-y-3">
            {surveyors.map(s => (
              <div key={s.staff_code} className="flex items-center gap-4">
                <span className="text-[13px] font-medium text-[#16201c] w-40">{s.name}</span>
                <div className="flex-1 bg-[#eef1f4] rounded-full h-[10px] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1f5f4f]"
                    style={{ width: `${(s.active_tasks / s.max_tasks) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] text-[#5e6b65] w-16 text-right">{s.active_tasks}/{s.max_tasks}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-[#5e6b65]">No surveyors.</p>
        )}
      </div>
    </SurveyorShell>
  )
}
