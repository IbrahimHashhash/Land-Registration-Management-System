import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SurveyorShell from '../../components/SurveyorShell'
import { updateMilestone, uploadSurveyReport } from '../../api/staff'
import api from '../../api/client'

const MILESTONES = ['assigned', 'visit_scheduled', 'arrived_on_site', 'survey_started', 'survey_completed', 'report_uploaded']
const SURVEYOR_ID = '675100000000000000000301'

export default function SurveyorTaskExecution() {
  const { applicationId } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportTitle, setReportTitle] = useState('')
  const [findings, setFindings] = useState('')
  const [fieldNote, setFieldNote] = useState('')

  useEffect(() => { fetchTask() }, [applicationId])

  function fetchTask() {
    api.get(`/staff/${SURVEYOR_ID}/tasks`)
      .then(res => {
        const t = res.data.find(t => t.application_id === applicationId)
        setTask(t || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function currentIndex() {
    if (!task) return -1
    const types = task.milestones.map(m => m.type)
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (types.includes(MILESTONES[i])) return i
    }
    return -1
  }

  async function advanceMilestone(type) {
    await updateMilestone(applicationId, { type, by: 'surveyor', meta: {} })
    fetchTask()
  }

  async function submitReport() {
    await uploadSurveyReport(applicationId, { report_title: reportTitle, findings, uploaded_by: 'surveyor' })
    setReportTitle('')
    setFindings('')
    fetchTask()
  }

  if (loading) return <SurveyorShell title="Task Execution"><p className="text-[13px] text-[#5e6b65]">Loading...</p></SurveyorShell>
  if (!task) return <SurveyorShell title="Task Execution"><p className="text-[13px] text-[#5e6b65]">Task not found.</p></SurveyorShell>

  const idx = currentIndex()
  const nextMilestones = MILESTONES.filter((_, i) => i > idx && i < 5)

  return (
    <SurveyorShell title="Survey Task Execution" subtitle={`Task: ${task.task_id}`}>
      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-6 mb-5">
        <h3 className="text-[15px] font-semibold text-[#16201c] mb-4">Milestones</h3>
        <div className="flex gap-2 flex-wrap mb-4">
          {MILESTONES.map((m, i) => {
            const done = i <= idx
            return (
              <span key={m} className={`text-[12px] px-3 py-1 rounded-full font-medium ${done ? 'bg-[#e2f3e9] text-[#1f7a4d]' : 'bg-[#eef1f4] text-[#475569]'}`}>
                {m.replace(/_/g, ' ')}
              </span>
            )
          })}
        </div>
        <div className="flex gap-2 flex-wrap">
          {nextMilestones.map(m => (
            <button
              key={m}
              onClick={() => advanceMilestone(m)}
              className="px-3 py-[7px] text-[12px] font-semibold border border-[#e3e8e5] rounded-[9px] bg-white text-[#16201c] hover:bg-[#f4f6f5] cursor-pointer transition-colors"
            >
              Mark: {m.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {idx >= 4 && !task.report_uploaded && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-6 mb-5">
          <h3 className="text-[15px] font-semibold text-[#16201c] mb-4">Upload Survey Report</h3>
          <input
            className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-2 text-[13px] mb-3 outline-none focus:border-[#1f5f4f]"
            placeholder="Report title"
            value={reportTitle}
            onChange={e => setReportTitle(e.target.value)}
          />
          <textarea
            className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-2 text-[13px] mb-3 outline-none focus:border-[#1f5f4f] resize-none"
            rows={3}
            placeholder="Findings"
            value={findings}
            onChange={e => setFindings(e.target.value)}
          />
          <button
            onClick={submitReport}
            disabled={!reportTitle}
            className="px-4 py-[9px] text-[13px] font-semibold rounded-[9px] bg-[#1f5f4f] text-white border-none cursor-pointer hover:bg-[#184c40] disabled:opacity-50 transition-colors"
          >
            Upload Report
          </button>
        </div>
      )}

      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-6">
        <h3 className="text-[15px] font-semibold text-[#16201c] mb-3">Field Notes</h3>
        {task.field_notes.length > 0 ? (
          <ul className="list-disc pl-5 text-[13px] text-[#384640] space-y-1 mb-3">
            {task.field_notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        ) : (
          <p className="text-[12.5px] text-[#5e6b65] mb-3">No field notes yet.</p>
        )}
      </div>
    </SurveyorShell>
  )
}
