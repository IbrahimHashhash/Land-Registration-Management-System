import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SurveyorShell from '../../components/SurveyorShell'
import { getMyTasks } from '../../api/staff'
import { STATUS } from '../../theme'
import { getSurveyorId } from '../../context/surveyorSession'

function scheduledVisitDate(milestones) {
  const vs = (milestones || []).find(m => m.type === 'visit_scheduled')
  if (!vs) return '—'
  return vs.meta?.scheduled_date || (vs.at ? String(vs.at).split('T')[0] : '—')
}

function currentMilestone(milestones) {
  if (!milestones || !milestones.length) return '—'
  return milestones[milestones.length - 1].type.replace(/_/g, ' ')
}

export default function SurveyorTaskList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const surveyorId = getSurveyorId()

  useEffect(() => {
    if (!surveyorId) {
      navigate('/surveyor/login', { replace: true })
      return
    }
    getMyTasks(surveyorId)
      .then(res => setTasks(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Could not load tasks.'))
      .finally(() => setLoading(false))
  }, [surveyorId, navigate])

  if (!surveyorId) return null

  return (
    <SurveyorShell title="My Survey Tasks" subtitle="Assigned field survey tasks">
      {loading ? (
        <p className="text-[13px] text-[#5e6b65]">Loading…</p>
      ) : error ? (
        <p className="text-[13px] text-[#b91c1c]">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-[13px] text-[#5e6b65]">No tasks assigned.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const st = STATUS[task.status] || { label: task.status, fg: '#475569', bg: '#eef1f4' }
            return (
              <Link
                key={task.id}
                to={`/surveyor/task/${task.application_id}`}
                className="block bg-white border border-[#e3e8e5] rounded-[13px] p-5 no-underline hover:border-[#1f5f4f]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-[14px] text-[#16201c] mono">{task.task_id}</span>
                  <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full" style={{ color: st.fg, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    ['Parcel Number', task.parcel_number || '—'],
                    ['Zone', task.zone || '—'],
                    ['Priority', task.priority || '—'],
                    ['Scheduled Visit', scheduledVisitDate(task.milestones)],
                    ['Current Milestone', currentMilestone(task.milestones)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10.5px] uppercase tracking-[.06em] text-[#8a988f] font-semibold mb-0.5">{label}</div>
                      <div className="text-[13px] text-[#16201c] font-medium capitalize">{value}</div>
                    </div>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </SurveyorShell>
  )
}
