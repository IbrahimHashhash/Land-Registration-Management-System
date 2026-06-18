import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SurveyorShell from '../../components/SurveyorShell'
import { getMyTasks } from '../../api/staff'
import { STATUS } from '../../theme'

const SURVEYOR_ID = '675100000000000000000301'

export default function SurveyorTaskList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTasks(SURVEYOR_ID)
      .then(res => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SurveyorShell title="My Survey Tasks" subtitle="Assigned field survey tasks">
      {loading ? (
        <p className="text-[13px] text-[#5e6b65]">Loading...</p>
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
                className="block bg-white border border-[#e3e8e5] rounded-[13px] p-5 no-underline hover:border-[#1f5f4f]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[14px] text-[#16201c]">{task.task_id}</span>
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ color: st.fg, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <div className="flex gap-6 text-[12.5px] text-[#5e6b65]">
                  <span>Application: <span className="text-[#16201c] font-medium">{task.application_id}</span></span>
                  <span>Milestones: {task.milestones.length}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </SurveyorShell>
  )
}
