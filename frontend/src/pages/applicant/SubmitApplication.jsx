import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import FormSelect from '../../components/ui/FormSelect'
import { APP_TYPES, FORM_STEPS, ZONES, LAND_USES, APPLICANT_TYPE_LABELS } from '../../constants/applicationForms'

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

  function next() { if (step < 4) setStep(s => s + 1) }
  function prev() { if (step > 1) setStep(s => s - 1) }
  function submit() { setConfirmed(true) }

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
                <span className="mono font-semibold text-[15px]">LRMIS-2026-0004</span>
              </div>
              <div className="border-t border-[#f2f4f3]" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Type</span>
                <span className="font-semibold">Ownership Transfer</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Status</span>
                <span className="text-[11.5px] font-semibold px-[11px] py-1 rounded-full text-[#1e5fae] bg-[#e7f0fb]">Submitted</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Submitted</span>
                <span>Feb 15, 2026 · 09:32 AM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Parcel</span>
                <span className="mono">145 / 12 · ZONE-RM-01</span>
              </div>
              <div className="border-t border-[#f2f4f3]" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6b65]">Next Step</span>
                <span className="font-semibold text-[#b45309]">Pre-check review by staff</span>
              </div>
            </div>
          </div>

          <div className="bg-[#fdf6e8] border border-[#f0d49b] rounded-[11px] px-[18px] py-[14px] mt-[14px] text-left flex gap-[12px] items-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="text-[12.5px] text-[#92400e] leading-relaxed">
              <span className="font-semibold">1 missing document:</span> Sale Contract. Upload it from your dashboard to move your application forward.
            </div>
          </div>

          <div className="flex gap-[10px] justify-center mt-[24px]">
            <BtnSecondary onClick={() => navigate('/applicant/track/LRMIS-2026-0001')}>
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
          <div className="flex justify-end mt-[22px]">
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
              <Input defaultValue={user?.name} />
            </div>
            <div>
              <FieldLabel>National ID *</FieldLabel>
              <Input defaultValue={user?.nationalId} className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" />
            </div>
            <div>
              <FieldLabel>Email *</FieldLabel>
              <Input defaultValue={user?.email} />
            </div>
            <div>
              <FieldLabel>Phone *</FieldLabel>
              <Input defaultValue={user?.phone} className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" />
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
          <div className="flex justify-between mt-[22px]">
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
              <Input placeholder="e.g. 145" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" />
            </div>
            <div>
              <FieldLabel>Block Number *</FieldLabel>
              <Input placeholder="e.g. 12" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" />
            </div>
            <div>
              <FieldLabel>Basin Number *</FieldLabel>
              <Input placeholder="e.g. 3" className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none mono" />
            </div>
            <div>
              <FieldLabel>Zone *</FieldLabel>
              <FormSelect>
                {ZONES.map(z => <option key={z}>{z}</option>)}
              </FormSelect>
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
            <div className="h-[160px] bg-[#eef3f0] border border-dashed border-[#c2ccc7] rounded-[11px] flex items-center justify-center gap-[9px] text-[#5e6b65] text-[13px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Click on map to set parcel location
            </div>
          </div>

          <div className="flex justify-between mt-[22px]">
            <BtnSecondary onClick={prev}>Back</BtnSecondary>
            <BtnPrimary onClick={next}>Continue</BtnPrimary>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[28px] max-w-[680px]">
          <div className="text-[17px] font-bold mb-[5px]">Upload Documents &amp; Submit</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">Attach the required ownership and identity documents, then submit.</div>

          <div className="flex flex-col gap-[10px] mb-[20px]">
            {[
              { label: 'Ownership Deed',   detail: 'ownership_deed.pdf · 2.4 MB', done: true },
              { label: 'National ID Copy', detail: 'id_copy.pdf · 640 KB',        done: true },
              { label: 'Sale Contract',    detail: 'Required · Click to upload',   done: false },
            ].map(doc => (
              <div
                key={doc.label}
                className={`flex items-center gap-[13px] p-[14px] rounded-[11px] border ${doc.done ? 'border-[#e3e8e5]' : 'border-dashed border-[#c2ccc7] cursor-pointer hover:bg-[#f7f9f8] hover:border-[#1f5f4f] transition-colors'}`}
              >
                <div
                  className="w-[38px] h-[38px] rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: doc.done ? '#e2f3e9' : '#f0f3f1' }}
                >
                  {doc.done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f7a4d" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold" style={{ color: doc.done ? undefined : '#5e6b65' }}>{doc.label}</div>
                  <div className="text-[11.5px]" style={{ color: doc.done ? '#5e6b65' : '#9aa8a2' }}>{doc.detail}</div>
                </div>
                <span
                  className="text-[11px] font-semibold px-[10px] py-1 rounded-full"
                  style={doc.done
                    ? { color: '#1f7a4d', background: '#e2f3e9' }
                    : { color: '#b45309', background: '#fbeedd' }
                  }
                >
                  {doc.done ? 'Uploaded' : 'Missing'}
                </span>
              </div>
            ))}
          </div>

          <div className="border border-dashed border-[#c2ccc7] rounded-[11px] p-[24px] text-center cursor-pointer mb-[20px] hover:bg-[#f7f9f8] hover:border-[#1f5f4f] transition-colors">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="1.5" className="mx-auto mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div className="text-[13px] font-semibold text-[#384640]">Drop additional files here or click to browse</div>
            <div className="text-[11.5px] text-[#9aa8a2] mt-1">PDF, JPG, PNG · Max 10 MB per file</div>
          </div>

          <div className="flex justify-between">
            <BtnSecondary onClick={prev}>Back</BtnSecondary>
            <button
              onClick={submit}
              className="px-[24px] py-[10px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[13.5px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              Submit Application
            </button>
          </div>
        </div>
      )}
    </ApplicantShell>
  )
}
