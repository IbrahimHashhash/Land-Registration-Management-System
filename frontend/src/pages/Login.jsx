import React from 'react'
import { useNavigate } from 'react-router-dom'

const ROLES = [
  {
    title: 'Applicant Portal',
    desc: 'Submit and track your land registration applications.',
    to: '/applicant/login',
    accent: '#1f5f4f',
    bg: '#e7f1ee',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
  },
  {
    title: 'Staff / Registrar Console',
    desc: 'Review applications, manage the workflow, and issue certificates.',
    to: '/staff/login',
    accent: '#1e5fae',
    bg: '#e7f0fb',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
    ),
  },
  {
    title: 'Surveyor & Analytics',
    desc: 'Field survey tasks, the live parcel map, and management dashboards.',
    to: '/surveyor',
    accent: '#b45309',
    bg: '#fbeedd',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
    ),
  },
]

export default function Login() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at 50% 0%,#eef3f0,#f4f6f5)' }}>
      <div className="w-[500px] bg-white border border-[#e3e8e5] rounded-[16px] px-[36px] py-[38px]" style={{ boxShadow: '0 24px 60px -28px rgba(20,40,32,.32)' }}>
        <div className="flex items-center gap-[11px] mb-[24px]">
          <div className="w-[40px] h-[40px] rounded-[10px] bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
            <div className="w-[15px] h-[15px] border-[2.5px] border-white rounded-[3px]" />
          </div>
          <div>
            <div className="font-bold text-[18px] tracking-[.04em]">LRMIS</div>
            <div className="text-[11.5px] text-[#5e6b65] font-medium">Land Registration Management Information System</div>
          </div>
        </div>

        <div className="text-[21px] font-bold mb-[5px]">Welcome</div>
        <div className="text-[13.5px] text-[#5e6b65] leading-relaxed mb-[24px]">
          Select your role to continue.
        </div>

        <div className="flex flex-col gap-[11px]">
          {ROLES.map(r => (
            <button
              key={r.to}
              onClick={() => navigate(r.to)}
              className="flex items-center gap-[14px] w-full text-left px-[16px] py-[15px] border border-[#e3e8e5] rounded-[12px] bg-[#fbfcfb] cursor-pointer hover:border-[#1f5f4f] hover:bg-[#f4f8f6] transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: r.bg, color: r.accent }}>
                {r.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[14.5px] text-[#16201c]">{r.title}</div>
                <div className="text-[12px] text-[#5e6b65] leading-snug">{r.desc}</div>
              </div>
              <div className="text-[#9aa8a2] text-[20px] leading-none">›</div>
            </button>
          ))}
        </div>

       
      </div>
    </div>
  )
}
