import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  {
    label: 'Dashboard', to: '/',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    label: 'Applications', to: '/applications',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r=".5" fill="currentColor"/><circle cx="3.5" cy="12" r=".5" fill="currentColor"/><circle cx="3.5" cy="18" r=".5" fill="currentColor"/></svg>,
  },
  {
    label: 'New Application', to: '/applications/new',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  },
  {
    label: 'Certificates', to: '/certificates',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="6"/><path d="M9 14l-1.5 7 4.5-2.7L16.5 21 15 14"/></svg>,
  },
]

export default function Sidebar() {
  const location = useLocation()
  const path = location.pathname
  const isAppsActive = path === '/applications' || (path.startsWith('/applications/') && path !== '/applications/new')

  return (
    <aside className="w-[236px] shrink-0 bg-[#1a1f1d] flex flex-col px-3.5 py-[18px] sticky top-0 h-screen overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-[11px] px-2 pb-5 pt-1">
        <div className="w-[34px] h-[34px] rounded-lg bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
          <div className="w-[13px] h-[13px] border-[2.5px] border-white rounded-[3px]" />
        </div>
        <div>
          <div className="font-bold text-[15px] tracking-[.04em] text-white">LRMIS</div>
          <div className="text-[10.5px] text-[#8a988f] font-medium">Staff Console</div>
        </div>
      </div>

      <div className="text-[10.5px] font-semibold tracking-[.09em] uppercase text-[#8a988f] px-[10px] mb-1.5">
        Workspace
      </div>

      <nav className="flex-1">
        {NAV.map(({ label, to, icon }) => {
          const active = to === '/applications' ? isAppsActive : path === to
          return (
            <Link
              key={to}
              to={to}
              className={[
                'flex items-center gap-[11px] px-3 py-[10px] rounded-[9px] text-[13.5px] mb-[3px] no-underline transition-colors duration-150',
                'border-l-[3px]',
                active
                  ? 'bg-white/[.09] text-white font-semibold border-l-[#1f5f4f]'
                  : 'bg-transparent text-[#8a988f] font-medium border-l-transparent hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              {icon}
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-white/10 pt-3 flex items-center gap-[10px]">
        <div className="w-8 h-8 rounded-lg bg-[#e7f1ee] text-[#1f5f4f] flex items-center justify-center font-bold text-[13px] shrink-0">
          RH
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-white truncate">Reem Haddad</div>
          <div className="text-[11px] text-[#8a988f]">Registrar</div>
        </div>
        <Link to="/login" title="Sign out" className="text-[#8a988f] hover:text-white flex transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </Link>
      </div>
    </aside>
  )
}
