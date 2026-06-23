import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApplicant } from '../context/ApplicantContext'
import { APPLICANT_NAV } from '../constants/navigation'

export default function ApplicantShell({ title, subtitle, children }) {
  const { user, setUser } = useApplicant()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/applicant/login', { replace: true })
  }, [user, navigate])

  if (!user) return null

  function isActive(nav) {
    return nav.exact
      ? location.pathname === nav.to
      : location.pathname.startsWith(nav.to)
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f5]">
      <aside className="w-[236px] shrink-0 bg-[#1a1f1d] flex flex-col px-3.5 py-[18px] sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-[11px] px-2 pb-5 pt-1">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
            <div className="w-[13px] h-[13px] border-[2.5px] border-white rounded-[3px]" />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-[.04em] text-white">LRMIS</div>
            <div className="text-[10.5px] text-[#8a988f] font-medium">Applicant Portal</div>
          </div>
        </div>

        <div className="text-[10.5px] font-semibold tracking-[.09em] uppercase text-[#8a988f] px-[10px] mb-1.5">
          Navigation
        </div>

        <nav className="flex-1">
          {APPLICANT_NAV.map(nav => {
            const active = isActive(nav)
            return (
              <Link
                key={nav.to}
                to={nav.to}
                className={[
                  'flex items-center gap-[11px] px-3 py-[10px] rounded-[9px] text-[13.5px] mb-[3px] no-underline transition-colors duration-150 border-l-[3px]',
                  active
                    ? 'bg-white/[.09] text-white font-semibold border-l-[#1f5f4f]'
                    : 'bg-transparent text-[#8a988f] font-medium border-l-transparent hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {nav.icon}
                <span>{nav.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-3 flex items-center gap-[10px]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0"
            style={{ background: user.avatarBg, color: user.avatarFg }}
          >
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-[#8a988f]">{user.type}</div>
          </div>
          <button
            onClick={() => { setUser(null); navigate('/applicant/login') }}
            title="Sign out"
            className="text-[#8a988f] hover:text-white flex transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[5] bg-[#f4f6f5]/85 backdrop-blur-[8px] border-b border-[#e3e8e5] px-[30px] py-[15px] flex items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-bold tracking-[-0.01em] text-[#16201c]">{title}</div>
            {subtitle && <div className="text-[12.5px] text-[#5e6b65] mt-px">{subtitle}</div>}
          </div>
        </header>

        <main className="flex-1 p-[26px_30px_50px]">
          {children}
        </main>
      </div>
    </div>
  )
}
