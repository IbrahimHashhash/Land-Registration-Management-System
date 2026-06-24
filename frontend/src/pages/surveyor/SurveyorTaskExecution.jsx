import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SurveyorShell from '../../components/SurveyorShell'
import { updateMilestone, uploadSurveyReport, addFieldNote, getMyTasks } from '../../api/staff'
import { getSurveyorId } from '../../context/surveyorSession'

const MILESTONES = ['assigned', 'visit_scheduled', 'arrived_on_site', 'survey_started', 'survey_completed', 'report_uploaded']

// Display metadata for each milestone: short label, the verb shown on the
// action button, and a one-line description of what it means.
const MILESTONE_META = {
  assigned:         { label: 'Assigned',         action: 'Assigned',          desc: 'Task assigned to you by the office.' },
  visit_scheduled:  { label: 'Visit Scheduled',  action: 'Schedule Visit',    desc: 'Set a date to visit the parcel.' },
  arrived_on_site:  { label: 'Arrived On Site',  action: 'Mark Arrived',      desc: 'Confirm you have reached the parcel.' },
  survey_started:   { label: 'Survey Started',   action: 'Start Survey',      desc: 'Begin the field survey.' },
  survey_completed: { label: 'Survey Completed', action: 'Complete Survey',   desc: 'All field measurements are done.' },
  report_uploaded:  { label: 'Report Uploaded',  action: 'Upload Report',     desc: 'Submit the survey report below.' },
}

function fmtTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function SurveyorTaskExecution() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const surveyorId = getSurveyorId()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')        // milestone type currently being saved
  const [error, setError] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [findings, setFindings] = useState('')
  const [fieldNote, setFieldNote] = useState('')

  useEffect(() => {
    if (!surveyorId) { navigate('/surveyor/login', { replace: true }); return }
    fetchTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, surveyorId])

  function fetchTask() {
    getMyTasks(surveyorId)
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

  function milestoneTime(type) {
    const m = (task?.milestones || []).find(m => m.type === type)
    return m ? fmtTime(m.at) : ''
  }

  async function advanceMilestone(type) {
    setBusy(type)
    setError('')
    try {
      await updateMilestone(applicationId, { type, by: surveyorId, meta: {} })
      fetchTask()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not update the milestone. Please try again.')
    } finally {
      setBusy('')
    }
  }

  async function submitReport() {
    setBusy('report_uploaded')
    setError('')
    try {
      await uploadSurveyReport(applicationId, { report_title: reportTitle, findings, uploaded_by: surveyorId })
      setReportTitle('')
      setFindings('')
      fetchTask()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not upload the report. Please try again.')
    } finally {
      setBusy('')
    }
  }

  async function submitFieldNote() {
    if (!fieldNote.trim()) return
    await addFieldNote(applicationId, { note: fieldNote.trim(), by: surveyorId })
    setFieldNote('')
    fetchTask()
  }

  if (loading) return <SurveyorShell title="Task Execution"><p className="text-[13px] text-[#5e6b65]">Loading...</p></SurveyorShell>
  if (!task) return <SurveyorShell title="Task Execution"><p className="text-[13px] text-[#5e6b65]">Task not found.</p></SurveyorShell>

  const idx = currentIndex()
  const total = MILESTONES.length
  const progressPct = Math.round(((idx + 1) / total) * 100)
  // The surveyor can only mark milestones up to survey_completed (index 4);
  // report_uploaded (index 5) is driven by the report form below.
  const nextActionable = idx + 1 <= 4 ? idx + 1 : -1

  return (
    <SurveyorShell title="Survey Task Execution" subtitle={`Task: ${task.task_id}`}>
      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-6 mb-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-semibold text-[#16201c]">Survey Progress</h3>
          <span className="text-[12px] font-semibold text-[#1f5f4f]">{progressPct}%</span>
        </div>
        <div className="text-[12.5px] text-[#5e6b65] mb-4">
          Step {Math.min(idx + 1, total)} of {total} · current stage{' '}
          <span className="font-semibold capitalize">{(MILESTONE_META[MILESTONES[Math.max(idx, 0)]]?.label || '').toLowerCase()}</span>
        </div>

        {/* progress bar */}
        <div className="h-[6px] w-full rounded-full bg-[#eef1f4] overflow-hidden mb-6">
          <div className="h-full bg-[#1f5f4f] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        {error && (
          <div className="mb-4 text-[12.5px] text-[#b91c1c] bg-[#fbe6e6] border border-[#f0c4c4] rounded-[9px] px-3 py-2">
            {error}
          </div>
        )}

        {/* vertical stepper */}
        <div className="relative">
          {MILESTONES.map((m, i) => {
            const meta = MILESTONE_META[m]
            const done = i <= idx
            const isCurrent = i === idx
            const isNext = i === nextActionable
            const isLast = i === total - 1
            const saving = busy === m

            return (
              <div key={m} className="flex gap-4 relative pb-5 last:pb-0">
                {/* connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[13px] top-[28px] w-[2px] h-[calc(100%-20px)] ${i < idx ? 'bg-[#1f5f4f]' : 'bg-[#e3e8e5]'}`}
                  />
                )}

                {/* node */}
                <div
                  className={[
                    'w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 z-[1] border-2 transition-colors',
                    done ? 'bg-[#1f5f4f] border-[#1f5f4f]' : '',
                    !done && isNext ? 'bg-white border-[#1f5f4f] ring-4 ring-[#e7f1ee]' : '',
                    !done && !isNext ? 'bg-white border-[#cdd6d2]' : '',
                  ].join(' ')}
                >
                  {done
                    ? <CheckIcon />
                    : <span className={`text-[12px] font-bold ${isNext ? 'text-[#1f5f4f]' : 'text-[#9aa8a2]'}`}>{i + 1}</span>}
                </div>

                {/* content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3 pt-[2px]">
                  <div className="min-w-0">
                    <div className={`text-[13.5px] font-semibold ${done ? 'text-[#16201c]' : isNext ? 'text-[#16201c]' : 'text-[#9aa8a2]'}`}>
                      {meta.label}
                      {isCurrent && (
                        <span className="ml-2 text-[10.5px] font-semibold uppercase tracking-[.05em] text-[#1f7a4d] bg-[#e2f3e9] rounded-full px-2 py-[1px] align-middle">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-[#9aa8a2] mt-[1px] truncate">
                      {done
                        ? <>Completed{milestoneTime(m) ? ` · ${milestoneTime(m)}` : ''}</>
                        : isNext ? meta.desc : 'Pending'}
                    </div>
                  </div>

                  {/* action button — only on the next actionable step */}
                  {isNext && (
                    <button
                      onClick={() => advanceMilestone(m)}
                      disabled={!!busy}
                      className="shrink-0 inline-flex items-center gap-1.5 px-[14px] py-[9px] text-[12.5px] font-semibold rounded-[9px] bg-[#1f5f4f] text-white border-none cursor-pointer hover:bg-[#184c40] disabled:opacity-50 disabled:cursor-wait transition-colors"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Saving…
                        </>
                      ) : (
                        <>
                          {meta.action}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {idx >= 4 && (
          <div className="mt-2 text-[12px] text-[#1f7a4d] bg-[#e2f3e9] border border-[#cfe8da] rounded-[9px] px-3 py-2">
            Field milestones complete. Upload the survey report below to finish the task.
          </div>
        )}
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
            disabled={!reportTitle || !!busy}
            className="px-4 py-[9px] text-[13px] font-semibold rounded-[9px] bg-[#1f5f4f] text-white border-none cursor-pointer hover:bg-[#184c40] disabled:opacity-50 transition-colors"
          >
            {busy === 'report_uploaded' ? 'Uploading…' : 'Upload Report'}
          </button>
        </div>
      )}

      <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-6">
        <h3 className="text-[15px] font-semibold text-[#16201c] mb-3">Field Notes</h3>
        {task.field_notes.length > 0 ? (
          <ul className="list-disc pl-5 text-[13px] text-[#384640] space-y-1 mb-4">
            {task.field_notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        ) : (
          <p className="text-[12.5px] text-[#5e6b65] mb-4">No field notes yet.</p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 border border-[#e3e8e5] rounded-[9px] px-3 py-2 text-[13px] outline-none focus:border-[#1f5f4f]"
            placeholder="Add a field note…"
            value={fieldNote}
            onChange={e => setFieldNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitFieldNote() }}
          />
          <button
            onClick={submitFieldNote}
            disabled={!fieldNote.trim()}
            className="px-4 py-[9px] text-[13px] font-semibold rounded-[9px] bg-[#1f5f4f] text-white border-none cursor-pointer hover:bg-[#184c40] disabled:opacity-50 transition-colors"
          >
            Add Note
          </button>
        </div>
      </div>
    </SurveyorShell>
  )
}
