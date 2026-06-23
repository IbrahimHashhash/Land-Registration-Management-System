import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listStaff } from '../../api/staff'
import { setSurveyor } from '../../context/surveyorSession'

export default function SurveyorLogin() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(null)

  useEffect(() => {
    listStaff('surveyor')
      .then(res => setStaff(res.data || []))
      .catch(err => setError(err.response?.data?.detail || 'Could not load surveyor list.'))
      .finally(() => setLoading(false))
  }, [])

  function pick(s) {
    setSigningIn(s.id)
    setSurveyor({ id: s.id, name: s.name, role: s.role })
    navigate('/surveyor')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}
    >
      <div
        className="w-[460px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px]"
        style={{ boxShadow: '0 24px 60px -28px rgba(20,40,32,.32)' }}
      >
        <div className="flex items-center gap-[11px] mb-[26px]">
          <div className="w-[38px] h-[38px] rounded-[9px] bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
            <div className="w-[14px] h-[14px] border-[2.5px] border-white rounded-[3px]" />
          </div>
          <div>
            <div className="font-bold text-[17px] tracking-[.04em]">LRMIS</div>
            <div className="text-[11.5px] text-[#5e6b65] font-medium">Surveyor Panel</div>
          </div>
        </div>

        <div className="text-[21px] font-bold mb-[5px]">Sign in as Surveyor</div>
        <div className="text-[13.5px] text-[#5e6b65] leading-relaxed mb-[22px]">
          Choose your surveyor account to load assigned field tasks.
        </div>

        {loading && <div className="text-[13px] text-[#9aa8a2]">Loading surveyors…</div>}
        {error && (
          <div className="px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">
            {error}
          </div>
        )}
        {!loading && !error && staff.length === 0 && (
          <div className="text-[13px] text-[#9aa8a2]">No surveyors found in the directory.</div>
        )}

        <div className="flex flex-col gap-[10px] mt-2">
          {staff.map(s => {
            const initials = (s.name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
            return (
              <button
                key={s.id}
                onClick={() => pick(s)}
                disabled={signingIn !== null}
                className="flex items-center gap-[13px] w-full text-left px-[16px] py-[14px] border border-[#e3e8e5] rounded-[11px] bg-[#fbfcfb] cursor-pointer hover:border-[#1f5f4f] hover:bg-[#e7f1ee] transition-colors disabled:opacity-60 disabled:cursor-wait"
                style={{ fontFamily: 'inherit' }}
              >
                <div className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center font-bold text-[14px] shrink-0 bg-[#e7f1ee] text-[#1f5f4f]">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[14px]">{s.name}</div>
                  <div className="text-[12px] text-[#5e6b65]">
                    {s.role}{s.zone_id ? ` · ${s.zone_id}` : ''}
                  </div>
                </div>
                <div className="text-[#9aa8a2] text-[18px] leading-none">›</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
