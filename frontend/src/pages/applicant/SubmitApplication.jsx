import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import FormSelect from '../../components/ui/FormSelect'
import { APP_TYPES, FORM_STEPS, LAND_USES, APPLICANT_TYPE_LABELS, DOC_TYPES } from '../../constants/applicationForms'
import { submitApplication, uploadDocument } from '../../api/applicant'
import { apiError } from '../../utils/apiError'

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const TYPE_LABEL = Object.fromEntries(APP_TYPES.map(t => [t.key, t.label]))

function ClickCapture({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

function LocationPicker({ point, onPick }) {
  return (
    <MapContainer center={[31.9022, 35.2034]} zoom={14} style={{ height: 220 }} scrollWheelZoom>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onPick} />
      {point && <CircleMarker center={[point.lat, point.lng]} radius={9} pathOptions={{ color: '#1f5f4f', fillColor: '#1f5f4f', fillOpacity: 0.6 }} />}
    </MapContainer>
  )
}

function fmtDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-0 mb-[28px]">
      {FORM_STEPS.map((s, i) => {
        const idx    = i + 1
        const done   = idx < step
        const active = idx === step
        return (
          <div key={s.num} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-[9px]">
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold border-2"
                style={{
                  background:  done || active ? '#1f5f4f' : '#f0f3f1',
                  color:       done || active ? '#fff'    : '#9aa8a2',
                  borderColor: done || active ? '#1f5f4f' : '#e3e8e5',
                }}
              >
                {done ? '✓' : s.num}
              </div>
              <span
                className="text-[13px] whitespace-nowrap"
                style={{
                  fontWeight: active ? '600' : '500',
                  color:      active ? '#16201c' : '#9aa8a2',
                }}
              >
                {s.label}
              </span>
            </div>
            {i < FORM_STEPS.length - 1 && (
              <div
                className="flex-1 h-[2px] mx-[12px] min-w-[20px]"
                style={{ background: done ? '#1f5f4f' : '#e3e8e5' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">{children}</label>
  )
}

function Input(props) {
  return (
    <input
      className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none bg-white focus:border-[#1f5f4f] transition-colors"
      style={{ fontFamily: 'inherit' }}
      {...props}
    />
  )
}

function BtnPrimary({ onClick, children, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-[22px] py-[10px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[13.5px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors"
      style={{ fontFamily: 'inherit' }}
    >
      {children}
    </button>
  )
}

function BtnSecondary({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-[20px] py-[10px] border border-[#e3e8e5] rounded-[9px] bg-white text-[#384640] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f4f6f5] transition-colors"
      style={{ fontFamily: 'inherit' }}
    >
      {children}
    </button>
  )
}

export default function SubmitApplication() {
  const { user } = useApplicant()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [parcel, setParcel] = useState({ parcel_no: '', block_no: '', basin_no: '', zone_id: user?.zoneId || '' })
  const [point, setPoint] = useState(null)
  const [docs, setDocs] = useState([])
  const [busy, setBusy] = useState(false)

  const [name,       setName]       = useState(user?.name       || '')
  const [nationalId, setNationalId] = useState(user?.nationalId || '')
  const [email,      setEmail]      = useState(user?.email      || '')
  const [phone,      setPhone]      = useState(user?.phone      || '')

  const [stepError, setStepError] = useState('')
  const [error,     setError]     = useState('')
  const [result,    setResult]    = useState(null)

  function addFiles(fileList) {
    const picked = Array.from(fileList).map(f => ({ name: f.name, size: f.size, type: 'other' }))
    setDocs(d => [...d, ...picked])
  }
  function setDocType(i, type) { setDocs(d => d.map((doc, idx) => idx === i ? { ...doc, type } : doc)) }
  function removeDoc(i) { setDocs(d => d.filter((_, idx) => idx !== i)) }

  const setP = (k) => (e) => setParcel(p => ({ ...p, [k]: e.target.value }))

  function next() {
    setStepError('')
    if (step === 1 && !selectedType) {
      setStepError('Please select an application type.')
      return
    }
    if (step === 2) {
      if (!name.trim())       { setStepError('Full name is required.');  return }
      if (!nationalId.trim()) { setStepError('National ID is required.'); return }
      if (!email.trim())      { setStepError('Email is required.');       return }
    }
    if (step === 3) {
      if (!parcel.parcel_no.trim()) { setStepError('Parcel number is required.'); return }
      if (!parcel.block_no.trim())  { setStepError('Block number is required.');  return }
    }
    if (step < 4) setStep(s => s + 1)
  }
  function prev() { setStepError(''); if (step > 1) setStep(s => s - 1) }

  async function submit() {
    setError('')
    const applicantId = user?.applicant_id || user?.applicantId
    if (!applicantId) { setError('Your account is not registered. Please sign out and register again.'); return }
    setBusy(true)
    try {
      const res = await submitApplication({
        application_type: selectedType,
        priority: 'normal',
        applicant_ref: { applicant_id: applicantId, applicant_type: user?.applicantType || 'citizen' },
        parcel: {
          parcel_no: parcel.parcel_no, block_no: parcel.block_no, basin_no: parcel.basin_no || null, zone_id: parcel.zone_id,
          geometry: point ? { type: 'Point', coordinates: [point.lng, point.lat] } : null,
        },
        description: `${TYPE_LABEL[selectedType]} application by ${user?.name || applicantId}`,
      })
      for (const doc of docs) {
        try {
          await uploadDocument(res.application_id, { document_type: doc.type, file_name: doc.name, file_path: doc.name })
        } catch { /* keep going; documents are optional */ }
      }
      setResult(res)
      setConfirmed(true)
    } catch (e) {
      setError(apiError(e, 'Could not submit application'))
    } finally {
      setBusy(false)
    }
  }

  const subtitle = confirmed
    ? 'Your application has been submitted successfully'
    : `Step ${step} of 4 · New land registration application`

  if (confirmed) {
    return (
      <ApplicantShell title="Confirmation" subtitle="Your application has been submitted successfully">
        <div className="max-w-[580px] mx-auto text-center pt-5">
          <div className="w-[64px] h-[64px] rounded-full bg-[#e2f3e9] flex items-center justify-center mx-auto mb-[18px]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f7a4d" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="text-[22px] font-bold mb-[6px]">Application Submitted</div>
          <div className="text-[14px] text-[#5e6b65] leading-relaxed mb-[28px]">
            Your land registration application has been received and is pending review.
          </div>

          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[24px] text-left">
            <div className="flex flex-col gap-[14px] text-[13.5px]">
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Application ID</span>
                <span className="mono font-semibold text-[15px]">{result?.application_id}</span>
              </div>
              <div className="border-t border-[#f2f4f3]" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Type</span>
                <span className="font-semibold">{TYPE_LABEL[result?.application_type] || result?.application_type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Status</span>
                <span className="text-[11.5px] font-semibold px-[11px] py-1 rounded-full text-[#1e5fae] bg-[#e7f0fb] capitalize">{result?.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Submitted</span>
                <span>{fmtDateTime(result?.submission_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Parcel</span>
                <span className="mono">{result?.parcel?.parcel_no} / {result?.parcel?.block_no} · {result?.parcel?.zone_id}</span>
              </div>
              <div className="border-t border-[#f2f4f3]" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Next Step</span>
                <span className="font-semibold text-[#b45309]">Pre-check review by staff</span>
              </div>
            </div>
          </div>

          <div className="flex gap-[10px] justify-center mt-[24px]">
            <BtnSecondary onClick={() => navigate(`/applicant/track/${result?.application_id}`)}>
              Track Application
            </BtnSecondary>
            <BtnPrimary onClick={() => navigate('/applicant')}>
              Go to Dashboard
            </BtnPrimary>
          </div>
        </div>
      </ApplicantShell>
    )
  }

  return (
    <ApplicantShell title="Submit Application" subtitle={subtitle}>
      <StepIndicator step={step} />

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] max-w-[680px]">
          <div className="text-[17px] font-bold mb-[5px]">Select Application Type</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Choose the type of land registration service you need.</div>
          <div className="grid grid-cols-2 gap-[10px]">
            {APP_TYPES.map(at => (
              <button
                key={at.key}
                onClick={() => setSelectedType(at.key)}
                className="text-left p-[16px] rounded-[11px] cursor-pointer border-2 transition-colors"
                style={{
                  fontFamily: 'inherit',
                  borderColor: selectedType === at.key ? '#1f5f4f' : '#e3e8e5',
                  background:  selectedType === at.key ? '#e7f1ee'  : '#fbfcfb',
                }}
              >
                <div className="text-[14px] font-semibold mb-[3px]">{at.label}</div>
                <div className="text-[12px] text-[#5e6b65] leading-snug">{at.desc}</div>
              </button>
            ))}
          </div>
          {stepError && <div className="mt-[16px] px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">{stepError}</div>}
          <div className="flex justify-end mt-[16px]">
            <BtnPrimary onClick={next}>Continue</BtnPrimary>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] max-w-[680px]">
          <div className="text-[17px] font-bold mb-[5px]">Applicant Information</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Confirm or update your personal details for this application.</div>
          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <FieldLabel>Full Name *</FieldLabel>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div>
              <FieldLabel>National ID *</FieldLabel>
              <Input value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="e.g. 123456789" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono focus:border-[#1f5f4f] transition-colors bg-white" style={{ fontFamily: 'inherit' }} />
            </div>
            <div>
              <FieldLabel>Email *</FieldLabel>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +970599000000" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono focus:border-[#1f5f4f] transition-colors bg-white" style={{ fontFamily: 'inherit' }} />
            </div>
            <div>
              <FieldLabel>Applicant Type</FieldLabel>
              <FormSelect defaultValue={APPLICANT_TYPE_LABELS[user?.applicantType] || 'Citizen'}>
                {Object.values(APPLICANT_TYPE_LABELS).map(label => (
                  <option key={label}>{label}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <Input defaultValue={user?.city} />
            </div>
            <div className="col-span-2">
              <FieldLabel>Address / Neighborhood</FieldLabel>
              <Input defaultValue={user?.address} />
            </div>
          </div>
          {stepError && <div className="mt-[16px] px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">{stepError}</div>}
          <div className="flex justify-between mt-[16px]">
            <BtnSecondary onClick={prev}>Back</BtnSecondary>
            <BtnPrimary onClick={next}>Continue</BtnPrimary>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] max-w-[680px]">
          <div className="text-[17px] font-bold mb-[5px]">Parcel Information</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Enter the parcel details for this land registration.</div>
          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <FieldLabel>Parcel Number *</FieldLabel>
              <Input placeholder="e.g. 145" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" value={parcel.parcel_no} onChange={setP('parcel_no')} />
            </div>
            <div>
              <FieldLabel>Block Number *</FieldLabel>
              <Input placeholder="e.g. 12" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" value={parcel.block_no} onChange={setP('block_no')} />
            </div>
            <div>
              <FieldLabel>Basin Number</FieldLabel>
              <Input placeholder="e.g. 3" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" value={parcel.basin_no} onChange={setP('basin_no')} />
            </div>
            <div>
              <FieldLabel>Zone *</FieldLabel>
              <Input placeholder="e.g. ZONE-RM-01" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono focus:border-[#1f5f4f] transition-colors bg-white" style={{ fontFamily: 'inherit' }} value={parcel.zone_id} onChange={setP('zone_id')} />
            </div>
            <div className="col-span-2">
              <FieldLabel>Land Use</FieldLabel>
              <FormSelect>
                {LAND_USES.map(u => <option key={u}>{u}</option>)}
              </FormSelect>
            </div>
          </div>

          <div className="mt-[18px]">
            <FieldLabel>Parcel Location</FieldLabel>
            <div className="overflow-hidden rounded-[11px] border border-[#e3e8e5]">
              <LocationPicker point={point} onPick={setPoint} />
            </div>
            <div className="flex items-center gap-2 mt-2 text-[12px]">
              <span className={`w-[8px] h-[8px] rounded-full ${point ? 'bg-[#1f5f4f]' : 'bg-[#cdd6d2]'}`} />
              <span className="text-[#5e6b65]">
                {point ? <>Location set · <span className="mono">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span></> : 'Click on the map to set the parcel location (optional)'}
              </span>
              {point && <button type="button" onClick={() => setPoint(null)} className="text-[#9aa8a2] hover:text-[#b91c1c] ml-1 text-[11.5px] underline">clear</button>}
            </div>
          </div>

          {stepError && <div className="mt-[16px] px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">{stepError}</div>}
          <div className="flex justify-between mt-[16px]">
            <BtnSecondary onClick={prev}>Back</BtnSecondary>
            <BtnPrimary onClick={next}>Continue</BtnPrimary>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] max-w-[680px]">
          <div className="text-[17px] font-bold mb-[5px]">Upload Documents &amp; Submit</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Attach your ownership and identity documents, then submit.</div>

          {docs.length > 0 && (
            <div className="flex flex-col gap-[10px] mb-[16px]">
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-[13px] p-[12px] rounded-[11px] border border-[#e3e8e5]">
                  <div className="w-[36px] h-[36px] rounded-[8px] bg-[#e7f1ee] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f5f4f" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#16201c] truncate">{doc.name}</div>
                    <div className="text-[11.5px] text-[#9aa8a2]">{fmtSize(doc.size)}</div>
                  </div>
                  <div className="w-[170px] shrink-0">
                    <FormSelect value={doc.type} onChange={e => setDocType(i, e.target.value)} className="py-[7px] text-[12px]">
                      {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </FormSelect>
                  </div>
                  <button type="button" onClick={() => removeDoc(i)} className="text-[#9aa8a2] hover:text-[#b91c1c] transition-colors shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block border border-dashed border-[#c2ccc7] rounded-[11px] p-[24px] text-center cursor-pointer mb-[20px] hover:bg-[#f7f9f8] hover:border-[#1f5f4f] transition-colors">
            <input type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="1.5" className="mx-auto mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div className="text-[13px] font-semibold text-[#384640]">Click to browse and add files</div>
            <div className="text-[11.5px] text-[#9aa8a2] mt-1"> Choose a document type for each file</div>
          </label>

          {error && <div className="mb-[14px] text-[12.5px] text-[#b91c1c] bg-[#fbe6e6] border border-[#f0c4c4] rounded-[9px] px-3 py-2">{error}</div>}

          <div className="flex justify-between">
            <BtnSecondary onClick={prev}>Back</BtnSecondary>
            <button
              onClick={submit}
              disabled={busy}
              className="px-[24px] py-[10px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[13.5px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors disabled:opacity-60 disabled:cursor-wait"
              style={{ fontFamily: 'inherit' }}
            >
              {busy ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </ApplicantShell>
  )
}
