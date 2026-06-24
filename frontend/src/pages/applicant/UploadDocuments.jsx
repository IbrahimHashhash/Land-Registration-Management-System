import React, { useRef, useState, useEffect } from 'react'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getApplicantApplications, getApplication, uploadDocument } from '../../api/applicant'
import FormSelect from '../../components/ui/FormSelect'
import { DOC_TYPES } from '../../constants/applicationForms'
import { TYPES } from '../../theme'

const DOC_STATUS = {
  verified:       { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review: { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  rejected:       { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
  missing:        { label: 'Missing',        fg: '#b91c1c', bg: '#fbe6e6' },
}

function titleCase(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function UploadDocuments() {
  const { user } = useApplicant()
  const fileRef  = useRef(null)

  const [apps, setApps]               = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [selectedAppId, setSelectedAppId] = useState('')
  const [detail, setDetail]           = useState(null)
  const [docType,  setDocType]        = useState('sale_contract')
  const [fileName, setFileName]       = useState('')
  const [status,   setStatus]         = useState('idle') // idle | loading | success | error
  const [errMsg,   setErrMsg]         = useState('')

  // Load the applicant's real applications
  useEffect(() => {
    if (!user?.applicant_id) { setAppsLoading(false); return }
    setAppsLoading(true)
    getApplicantApplications(user.applicant_id)
      .then(list => {
        const arr = Array.isArray(list) ? list : []
        setApps(arr)
        setSelectedAppId(prev => prev || arr[0]?.application_id || '')
      })
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false))
  }, [user?.applicant_id])

  // Load the selected application's required-document checklist (review status)
  function refreshDetail(appId) {
    if (!appId) { setDetail(null); return }
    getApplication(appId).then(setDetail).catch(() => setDetail(null))
  }
  useEffect(() => { refreshDetail(selectedAppId) }, [selectedAppId])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  async function handleUpload() {
    if (!selectedAppId) return
    setStatus('loading')
    setErrMsg('')
    try {
      await uploadDocument(selectedAppId, {
        document_type: docType,
        file_name: fileName || 'document.pdf',
        file_path: `/uploads/${fileName || 'document.pdf'}`,
      })
      setStatus('success')
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
      refreshDetail(selectedAppId)
    } catch (err) {
      const detailMsg = err.response?.data?.detail
      setErrMsg(typeof detailMsg === 'string' ? detailMsg : 'Upload failed. Please try again.')
      setStatus('error')
    }
  }

  const docs = detail?.required_documents || []

  return (
    <ApplicantShell
      title="Upload Documents"
      subtitle="Add supporting documents to your application"
    >
      <div className="max-w-[680px]">
        {appsLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#9aa8a2]">
            <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] text-[13px] text-[#9aa8a2]">
            You have no applications to upload documents to.
          </div>
        ) : (
        <>
        {/* Upload form */}
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] mb-[16px]">
          <div className="text-[17px] font-bold mb-[5px]">Upload Additional Documents</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Add supporting documents to an existing application.</div>

          <div className="mb-[18px]">
            <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Application *</label>
            <FormSelect
              value={selectedAppId}
              onChange={e => { setSelectedAppId(e.target.value); setStatus('idle') }}
            >
              {apps.map(a => (
                <option key={a.application_id} value={a.application_id}>
                  {a.application_id} · {TYPES[a.application_type] || titleCase(a.application_type)}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="mb-[18px]">
            <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Document Type *</label>
            <FormSelect value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </FormSelect>
          </div>

          {/* File input / drop zone */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="border-2 border-dashed border-[#c2ccc7] rounded-[11px] p-[32px] text-center cursor-pointer mb-[18px] flex flex-col items-center hover:bg-[#f7f9f8] hover:border-[#1f5f4f] transition-colors block"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="1.5" className="mb-[10px]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {fileName ? (
              <div className="text-[14px] font-semibold text-[#1f5f4f]">{fileName}</div>
            ) : (
              <>
                <div className="text-[14px] font-semibold text-[#384640]">Drop your file here or click to browse</div>
                <div className="text-[12px] text-[#9aa8a2] mt-[5px]">PDF, JPG, PNG · Max 10 MB</div>
              </>
            )}
          </label>

          {status === 'success' ? (
            <div className="w-full py-[12px] rounded-[9px] bg-[#e2f3e9] text-[#1f7a4d] text-[14px] font-semibold text-center">
              ✓ Document Uploaded Successfully
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="mb-[12px] px-[14px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">
                  {errMsg}
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={status === 'loading'}
                className="w-full py-[12px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
                style={{ fontFamily: 'inherit' }}
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : 'Upload Document'}
              </button>
            </>
          )}
        </div>

        {/* Document review status — required documents for the selected application */}
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
          <div className="text-[14.5px] font-bold mb-[14px]">Document Review Status</div>
          {docs.length === 0 ? (
            <div className="text-[12.5px] text-[#9aa8a2]">No documents listed for this application.</div>
          ) : docs.map((d, i) => {
            const ds = DOC_STATUS[d.status] || { label: titleCase(d.status), fg: '#475569', bg: '#eef1f4' }
            return (
              <div key={i} className="flex items-center gap-[13px] py-[12px] border-b border-[#f2f4f3] last:border-b-0">
                <div className="w-[38px] h-[38px] rounded-[8px] bg-[#f0f3f1] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e6b65" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{titleCase(d.document_type)}</div>
                  <div className="text-[11.5px] text-[#5e6b65]">{d.required ? 'Required' : 'Optional'}</div>
                </div>
                <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full shrink-0" style={{ color: ds.fg, background: ds.bg }}>
                  {ds.label}
                </span>
              </div>
            )
          })}
        </div>
        </>
        )}
      </div>
    </ApplicantShell>
  )
}
