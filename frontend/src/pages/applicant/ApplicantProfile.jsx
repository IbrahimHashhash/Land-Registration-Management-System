import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicantShell from '../../components/ApplicantShell'
import { useApplicant } from '../../context/ApplicantContext'
import { getApplicant, getApplicantApplications } from '../../api/applicant'
import { STATUS } from '../../theme'

// Counts toward "approved/completed" rather than "pending"
const DONE_STATUSES = new Set(['approved', 'certificate_issued', 'closed'])

const APPLICANT_TYPE_LABELS = {
  citizen: 'Citizen',
  lawyer: 'Lawyer',
  company: 'Company',
  surveyor: 'Surveyor',
  authorized_representative: 'Authorized Representative',
}

const VERIFICATION_BADGE = {
  verified:   { label: 'Verified',   fg: '#1f7a4d', bg: '#e2f3e9' },
  suspended:  { label: 'Suspended',  fg: '#b91c1c', bg: '#fbe6e6' },
  unverified: { label: 'Unverified', fg: '#b45309', bg: '#fbeedd' },
}


export default function ApplicantProfile() {
  const { user } = useApplicant()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [apps, setApps]       = useState([])
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.applicant_id) {
      setLoading(false)
      setError('no_id')
      return
    }
    setLoading(true)
    setError(null)
    // Applications + stats come from land_applications (source of truth), not the
    // applicant doc's linked_applications/stats — those are denormalized and never updated.
    getApplicantApplications(user.applicant_id)
      .then(list => setApps(Array.isArray(list) ? list : []))
      .catch(() => setApps([]))
    getApplicant(user.applicant_id)
      .then(setProfile)
      .catch(err => setError(err.response?.data?.detail || 'Could not load your profile.'))
      .finally(() => setLoading(false))
  }, [user?.applicant_id])

  const stats = {
    total:    apps.length,
    approved: apps.filter(a => DONE_STATUSES.has(a.status)).length,
    pending:  apps.filter(a => !DONE_STATUSES.has(a.status)).length,
  }

  return (
    <ApplicantShell title="My Profile" subtitle="Your applicant account details and preferences">
      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[#9aa8a2]">
          <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
          Loading your profile…
        </div>
      ) : error === 'no_id' ? (
        <div className="bg-[#fdf6e8] border border-[#f0d49b] rounded-[13px] px-[18px] py-[16px] text-[13px] text-[#92400e] leading-relaxed max-w-[640px]">
          Your profile isn’t registered with the backend yet. This happens when the applicant
          record couldn’t be created at login. Try signing out and back in to register.
        </div>
      ) : error ? (
        <div className="bg-[#fbe6e6] border border-[#f0c4c4] rounded-[13px] px-[18px] py-[16px] text-[13px] text-[#b91c1c] max-w-[640px]">
          {error}
        </div>
      ) : profile ? (
        <div className="max-w-[720px] flex flex-col gap-[16px]">

          {/* Header card */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px] flex items-center gap-[16px]">
            <div
              className="w-[56px] h-[56px] rounded-[13px] flex items-center justify-center text-[20px] font-bold shrink-0"
              style={{ background: user?.avatarBg || '#e7f1ee', color: user?.avatarFg || '#1f5f4f' }}
            >
              {profile.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-[#16201c]">{profile.full_name}</div>
              <div className="text-[12.5px] text-[#5e6b65] mt-[3px]">
                {APPLICANT_TYPE_LABELS[profile.applicant_type] || profile.applicant_type}
                {' · '}
                <span className="mono">{profile.applicant_id}</span>
              </div>
            </div>
            {(() => {
              const b = VERIFICATION_BADGE[profile.verification_state] ||
                { label: profile.verification_state, fg: '#475569', bg: '#eef1f4' }
              return (
                <span className="text-[11.5px] font-semibold px-[12px] py-[5px] rounded-full shrink-0"
                  style={{ color: b.fg, background: b.bg }}>
                  {b.label}
                </span>
              )
            })()}
          </div>

          {/* Contact & address */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[16px]">Contact &amp; Address</div>
            <div className="grid grid-cols-2 gap-[16px]">
              <Field label="Email"        value={profile.contacts?.email} />
              <Field label="Phone"        value={profile.contacts?.phone} mono />
              <Field label="City"         value={profile.address?.city} />
              <Field label="Neighborhood" value={profile.address?.neighborhood} />
              <Field label="Zone"         value={profile.address?.zone_id} mono />
            </div>
          </div>

          {/* Applications */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[16px]">Applications</div>
            <div className="grid grid-cols-3 gap-[12px] mb-[18px]">
              <Stat label="Total"    value={stats.total}    accent="#1f5f4f" />
              <Stat label="Approved" value={stats.approved} accent="#1f7a4d" />
              <Stat label="Pending"  value={stats.pending}  accent="#b45309" />
            </div>
            {apps.length > 0 ? (
              <div className="flex flex-col gap-[8px]">
                {apps.map(a => {
                  const s = STATUS[a.status] || { label: a.status, fg: '#475569', bg: '#eef1f4' }
                  return (
                    <button
                      key={a.application_id}
                      onClick={() => navigate(`/applicant/track/${a.application_id}`)}
                      className="flex items-center gap-[10px] bg-[#f7f9f8] rounded-[9px] px-[14px] py-[10px] cursor-pointer border-none hover:bg-[#eef3f0] transition-colors text-left"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <span className="mono text-[12.5px] font-semibold text-[#16201c]">{a.application_id}</span>
                      <span className="text-[10.5px] font-semibold px-[8px] py-[2px] rounded-full" style={{ color: s.fg, background: s.bg }}>
                        {s.label}
                      </span>
                      <span className="ml-auto text-[11.5px] text-[#1f5f4f] font-semibold">Track ›</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12.5px] text-[#9aa8a2]">No applications submitted yet.</p>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-white border border-[#e3e8e5] rounded-[13px] p-[22px]">
            <div className="text-[14.5px] font-bold mb-[16px]">Preferences</div>
            <div className="grid grid-cols-2 gap-[16px]">
              <Field
                label="Preferred Contact"
                value={profile.preferences?.preferred_contact === 'phone' ? 'Phone (SMS)' : 'Email'}
              />
              <Field
                label="Language"
                value={profile.preferences?.language === 'ar' ? 'Arabic' : 'English'}
              />
            </div>
          </div>

        </div>
      ) : null}
    </ApplicantShell>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11.5px] text-[#9aa8a2] font-medium mb-[3px]">{label}</p>
      <p className={`text-[13.5px] font-semibold text-[#16201c] ${mono ? 'mono' : ''}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-[11px] p-[16px] text-center bg-[#f7f9f8] border border-[#eef1ef]">
      <p className="text-[26px] font-bold leading-none" style={{ color: accent }}>{value ?? 0}</p>
      <p className="text-[11.5px] font-medium text-[#5e6b65] mt-[7px]">{label}</p>
    </div>
  )
}
