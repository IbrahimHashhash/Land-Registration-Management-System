import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import BackToHome from '../../components/ui/BackToHome'
import { useApplicant, buildUserFromApplicant } from '../../context/ApplicantContext'
import { getApplicantByNationalId } from '../../api/applicant'

export default function ApplicantLogin() {
  const navigate = useNavigate()
  const { setUser } = useApplicant()
  const [nationalId, setNationalId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const id = nationalId.trim()
    if (!id) {
      setError('Please enter your national ID.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const record = await getApplicantByNationalId(id)
      setUser({ ...buildUserFromApplicant(record), nationalId: id })
      navigate('/applicant')
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No applicant found with that national ID. Please register first.')
      } else {
        setError(err.response?.data?.detail || 'Could not sign you in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}
    >
      <BackToHome />
      <div
        className="w-[430px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px]"
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

        <div className="text-[21px] font-bold mb-[5px]">Applicant Portal</div>
        <div className="text-[13.5px] text-[#5e6b65] leading-relaxed mb-[26px]">
          Sign in with your national ID to submit applications, track progress, and manage requests.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          <div>
            <label className="text-[12px] font-semibold text-[#384640] block mb-[6px]">National ID</label>
            <input
              autoFocus
              value={nationalId}
              onChange={e => { setNationalId(e.target.value); if (error) setError('') }}
              placeholder="e.g. 901234567"
              className="w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13.5px] outline-none focus:border-[#1f5f4f] transition-colors mono"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div className="px-[13px] py-[10px] rounded-[9px] bg-[#fbe6e6] text-[#b91c1c] text-[12.5px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-[12px] border-none rounded-[9px] bg-[#1f5f4f] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#184c40] transition-colors disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
            style={{ fontFamily: 'inherit' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-[18px] text-center text-[12.5px] text-[#5e6b65]">
          New here?{' '}
          <Link to="/register" className="text-[#1f5f4f] font-semibold no-underline hover:underline">
            Register as applicant
          </Link>
        </div>

        <div className="mt-[24px] pt-[18px] border-t border-[#eef1ef] text-[11.5px] text-[#9aa8a2] text-center">
          COMP4382 · Land Registration Management Information System
        </div>
      </div>
    </div>
  )
}
