import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  APPLICANT_USERS,
  useApplicant,
  getStoredApplicantId,
  storeApplicantId,
} from '../../context/ApplicantContext'
import { registerApplicant } from '../../api/applicant'

const USER_LIST = [
  { key: 'nour',   ...APPLICANT_USERS.nour },
  { key: 'khaled', ...APPLICANT_USERS.khaled },
  { key: 'lina',   ...APPLICANT_USERS.lina },
]

export default function ApplicantLogin() {
  const navigate = useNavigate()
  const { setUser } = useApplicant()
  const [loading, setLoading] = useState(null) // key of loading user

  async function login(key) {
    const localUser = APPLICANT_USERS[key]
    setLoading(key)

    let applicantId = getStoredApplicantId(localUser.nationalId)

    if (!applicantId) {
      try {
        const result = await registerApplicant(localUser)
        applicantId = result.applicant_id
        storeApplicantId(localUser.nationalId, applicantId)
      } catch (err) {
        // 409 = already registered but we don't have the ID; proceed without it
        // Other errors: also proceed with local-only mode
        applicantId = null
      }
    }

    setUser({ ...localUser, applicant_id: applicantId })
    setLoading(null)
    navigate('/applicant')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}
    >
      <div
        className="w-[430px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px]"
        style={{ boxShadow: '0 24px 60px -28px rgba(20,40,32,.32)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-[11px] mb-[26px]">
          <div className="w-[38px] h-[38px] rounded-[9px] bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
            <div className="w-[14px] h-[14px] border-[2.5px] border-white rounded-[3px]" />
          </div>
          <div>
            <div className="font-bold text-[17px] tracking-[.04em]">LRMIS</div>
            <div className="text-[11.5px] text-[#5e6b65] font-medium">Land Registration MIS</div>
          </div>
        </div>

        <div className="text-[21px] font-bold mb-[5px]">Applicant Portal</div>
        <div className="text-[13.5px] text-[#5e6b65] leading-relaxed mb-[26px]">
          Sign in to submit applications, track progress, and manage your land registration requests.
        </div>

        <div className="flex flex-col gap-[10px]">
          {USER_LIST.map(u => {
            const isLoading = loading === u.key
            return (
              <button
                key={u.key}
                onClick={() => !loading && login(u.key)}
                disabled={!!loading}
                className="flex items-center gap-[13px] w-full text-left px-[16px] py-[14px] border border-[#e3e8e5] rounded-[11px] bg-[#fbfcfb] cursor-pointer hover:border-[#1f5f4f] hover:bg-[#e7f1ee] transition-colors disabled:opacity-60 disabled:cursor-wait"
                style={{ fontFamily: 'inherit' }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center font-bold text-[14px] shrink-0"
                  style={{ background: u.avatarBg, color: u.avatarFg }}
                >
                  {u.initials}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[14px]">{u.name}</div>
                  <div className="text-[12px] text-[#5e6b65]">{u.type}</div>
                </div>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#1f5f4f] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="text-[#9aa8a2] text-[18px] leading-none">›</div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-[24px] pt-[18px] border-t border-[#eef1ef] text-[11.5px] text-[#9aa8a2] text-center">
          COMP4382 · Land Registration Management Information System
        </div>
      </div>
    </div>
  )
}
