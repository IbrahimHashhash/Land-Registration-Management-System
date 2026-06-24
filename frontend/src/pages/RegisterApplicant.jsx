import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerApplicant } from '../api/applicant'
import { apiError } from '../utils/apiError'
import BackToHome from '../components/ui/BackToHome'

const APPLICANT_TYPES = [
  { value: 'citizen',                  label: 'Citizen' },
  { value: 'lawyer',                   label: 'Lawyer' },
  { value: 'company',                  label: 'Company' },
  { value: 'surveyor',                 label: 'Surveyor' },
  { value: 'authorized_representative',label: 'Authorized Representative' },
]

export default function RegisterApplicant() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', nationalId: '', applicantType: 'citizen',
    email: '', phone: '', city: '', address: '', zoneId: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await registerApplicant({
        name: form.name,
        applicantType: form.applicantType,
        nationalId: form.nationalId,
        verified: false,
        verificationMethod: 'otp_stub',
        email: form.email,
        phone: form.phone,
        city: form.city,
        address: form.address,
        zoneId: form.zoneId,
      })
      setResult(data)
    } catch (err) {
      setError(apiError(err, 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}
      >
        <div
          className="w-[430px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px] text-center"
          style={{ boxShadow: '0 24px 60px -28px rgba(20,40,32,.32)' }}
        >
          <div className="w-[52px] h-[52px] rounded-full bg-[#e2f3e9] flex items-center justify-center mx-auto mb-[18px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1f7a4d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-[20px] font-bold text-[#16201c] mb-[6px]">Registration Successful</div>
          <div className="text-[13px] text-[#5e6b65] mb-[22px]">
            Save your applicant ID — you'll need it to sign in.
          </div>
          <div className="bg-[#f7f9f8] border border-[#e3e8e5] rounded-[11px] px-[18px] py-[14px] mb-[22px]">
            <p className="text-[11.5px] text-[#9aa8a2] font-medium mb-[4px]">Applicant ID</p>
            <p className="text-[18px] font-bold mono text-[#1f5f4f]">{result.applicant_id}</p>
          </div>
          <button
            onClick={() => navigate('/applicant/login')}
            className="w-full py-[12px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors"
            style={{ fontFamily: 'inherit' }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}
    >
      <BackToHome />
      <div
        className="w-[520px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px]"
        style={{ boxShadow: '0 24px 60px -28px rgba(20,40,32,.32)' }}
      >
        <div className="flex items-center gap-[11px] mb-[26px]">
          <div className="w-[38px] h-[38px] rounded-[9px] bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
            <div className="w-[14px] h-[14px] border-[2.5px] border-white rounded-[3px]" />
          </div>
          <div>
            <div className="font-bold text-[17px] tracking-[.04em]">LRMIS</div>
            <div className="text-[11.5px] text-[#5e6b65] font-medium">Land Registration MIS</div>
          </div>
        </div>

        <div className="text-[21px] font-bold mb-[5px]">Create Account</div>
        <div className="text-[13.5px] text-[#5e6b65] leading-relaxed mb-[24px]">
          Register to submit land registration applications and track their progress.
        </div>

        {error && (
          <div className="px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px] mb-[16px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          <div className="grid grid-cols-2 gap-[14px]">
            <div className="col-span-2">
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Full Name</label>
              <input
                name="name" value={form.name} onChange={handleChange} required
                placeholder="Yazan Sulaiman"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">National ID</label>
              <input
                name="nationalId" value={form.nationalId} onChange={handleChange} required
                placeholder="901234567"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors mono"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Applicant Type</label>
              <select
                name="applicantType" value={form.applicantType} onChange={handleChange}
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors bg-white"
                style={{ fontFamily: 'inherit' }}
              >
                {APPLICANT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Email</label>
              <input
                name="email" value={form.email} type="email" onChange={handleChange} required
                placeholder="you@email.com"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Phone</label>
              <input
                name="phone" value={form.phone} onChange={handleChange} required
                placeholder="+97059…"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors mono"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">City</label>
              <input
                name="city" value={form.city} onChange={handleChange} required
                placeholder="Ramallah"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Neighborhood</label>
              <input
                name="address" value={form.address} onChange={handleChange} required
                placeholder="Al-Bireh"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div className="col-span-2">
              <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">Zone ID</label>
              <input
                name="zoneId" value={form.zoneId} onChange={handleChange} required
                placeholder="ZONE-RM-01"
                className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors mono"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-[12px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 mt-[2px]"
            style={{ fontFamily: 'inherit' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering…
              </>
            ) : 'Register'}
          </button>
        </form>

        <div className="mt-[18px] text-center text-[12.5px] text-[#5e6b65]">
          Already registered?{' '}
          <Link to="/applicant/login" className="text-[#1f5f4f] font-semibold no-underline hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mt-[24px] pt-[18px] border-t border-[#eef1ef] text-[11.5px] text-[#9aa8a2] text-center">
          COMP4382 · Land Registration Management Information System
        </div>
      </div>
    </div>
  )
}
