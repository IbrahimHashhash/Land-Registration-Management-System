import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getAppsForUser, getObjectionsForUser } from '../../data/applicantApps'
import { submitObjection } from '../../api/applicant'
import FormSelect from '../../components/ui/FormSelect'

export default function SubmitObjection() {
  const { user } = useApplicant()
  const navigate = useNavigate()
  const apps = getAppsForUser(user?.id)
  const existingObjections = getObjectionsForUser(user?.id)

  const [selectedAppIdx, setSelectedAppIdx] = useState(0)
  const [reason,  setReason]  = useState('')
  const [status,  setStatus]  = useState('idle') // idle | loading | success | error
  const [errMsg,  setErrMsg]  = useState('')
  const [attachments, setAttachments] = useState([]) // file names (metadata only)
  const fileRef = useRef(null)

  const selectedApp = apps[selectedAppIdx]

  function handleFileChange(e) {
    const names = Array.from(e.target.files || []).map(f => f.name)
    if (names.length) setAttachments(prev => [...new Set([...prev, ...names])])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeAttachment(name) {
    setAttachments(prev => prev.filter(n => n !== name))
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      setErrMsg('Please describe your objection.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrMsg('')
    try {
      await submitObjection(selectedApp.id, {
        author_id: user.applicant_id || user.id,
        reason: reason.trim(),
        supporting_documents: attachments,
      })
      setStatus('success')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 404) {
        setErrMsg('Application not found in registry. Ensure the application exists before filing an objection.')
      } else if (err.response?.status === 400) {
        setErrMsg(typeof detail === 'string' ? detail : 'This application cannot accept objections in its current state.')
      } else {
        setErrMsg(typeof detail === 'string' ? detail : 'Submission failed. Please try again.')
      }
      setStatus('error')
    }
  }

  return (
    <ApplicantShell
      title="Submit Objection"
      subtitle="File a dispute against a registration decision"
    >
      <div className="max-w-[680px]">
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] mb-[16px]">
          <div className="text-[17px] font-bold mb-[5px]">Submit Objection</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">
            File a formal objection against a land registration application or parcel decision.
          </div>

          <div className="flex flex-col gap-[16px]">
            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Application *</label>
              <FormSelect
                value={selectedAppIdx}
                onChange={e => { setSelectedAppIdx(Number(e.target.value)); setStatus('idle') }}
              >
                {apps.map((a, i) => (
                  <option key={a.id} value={i}>{a.id} · {a.typeLabel} · Parcel {a.parcel}</option>
                ))}
              </FormSelect>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Objection Reason *</label>
              <textarea
                value={reason}
                onChange={e => { setReason(e.target.value); if (status === 'error') setStatus('idle') }}
                placeholder="Describe your objection in detail…"
                className="w-full min-h-[120px] border border-[#e3e8e5] rounded-[9px] px-[14px] py-[12px] text-[13px] outline-none resize-y leading-relaxed focus:border-[#1f5f4f] transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[8px]">Supporting Documents</label>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="objection-files"
              />
              <label
                htmlFor="objection-files"
                className="border-2 border-dashed border-[#c2ccc7] rounded-[11px] p-[24px] text-center cursor-pointer hover:bg-[#f7f9f8] hover:border-[#1f5f4f] transition-colors flex flex-col items-center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="1.5" className="mb-[6px]">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="text-[13px] font-semibold text-[#384640]">Attach evidence</div>
                <div className="text-[11.5px] text-[#9aa8a2] mt-[3px]">PDF, JPG, PNG · Max 10 MB per file</div>
              </label>

              {attachments.length > 0 && (
                <div className="flex flex-col gap-[8px] mt-[12px]">
                  {attachments.map(name => (
                    <div key={name} className="flex items-center gap-[11px] px-[13px] py-[10px] bg-[#f7f9f8] border border-[#eef1ef] rounded-[9px]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5e6b65" strokeWidth="2" className="shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="flex-1 min-w-0 truncate text-[12.5px] text-[#384640]">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(name)}
                        className="text-[#9aa8a2] hover:text-[#be123c] transition-colors cursor-pointer bg-transparent border-none p-0 shrink-0"
                        title="Remove"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {status === 'success' ? (
            <div className="mt-[22px] p-[16px] bg-[#e2f3e9] border border-[#a7e0c1] rounded-[11px] flex items-center gap-[12px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f7a4d" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div className="text-[13px] font-semibold text-[#1f7a4d]">
                Objection submitted. You will be notified when it is reviewed.
              </div>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="mt-[16px] px-[14px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">
                  {errMsg}
                </div>
              )}
              <div className="flex gap-[10px] mt-[22px]">
                <button
                  onClick={() => navigate('/applicant')}
                  className="flex-1 py-[11px] border border-[#e3e8e5] rounded-[9px] bg-white text-[#384640] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f4f6f5] transition-colors"
                  style={{ fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  className="flex-1 py-[11px] border-none rounded-[9px] bg-[#be123c] text-white text-[13.5px] font-semibold cursor-pointer hover:bg-[#9f1239] transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
                  style={{ fontFamily: 'inherit' }}
                >
                  {status === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : 'Submit Objection'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Existing objections */}
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
          <div className="text-[14.5px] font-bold mb-[14px]">My Objections</div>
          {existingObjections.length === 0 ? (
            <div className="text-[13px] text-[#9aa8a2] py-[8px]">No objections filed yet.</div>
          ) : existingObjections.map(obj => (
            <div key={obj.id} className="flex items-center gap-[13px] p-[14px] border border-[#eef1ef] rounded-[11px]">
              <div className="w-[40px] h-[40px] rounded-[9px] bg-[#fbe4ea] flex items-center justify-center shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[9px]">
                  <span className="mono text-[13px] font-semibold">{obj.id}</span>
                  <span
                    className="text-[10.5px] font-semibold px-[9px] py-[3px] rounded-full"
                    style={{ color: obj.statusFg, background: obj.statusBg }}
                  >
                    {obj.status}
                  </span>
                </div>
                <div className="text-[12.5px] text-[#5e6b65] mt-1">{obj.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ApplicantShell>
  )
}
