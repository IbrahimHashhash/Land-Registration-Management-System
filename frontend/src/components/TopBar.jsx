import React from 'react'

export default function TopBar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-[5] bg-[#f4f6f5]/85 backdrop-blur-[8px] border-b border-[#e3e8e5] px-[30px] py-[15px] flex items-center gap-5">
      <div className="flex-1 min-w-0">
        <div className="text-[19px] font-bold tracking-[-0.01em] text-[#16201c]">{title}</div>
        {subtitle && <div className="text-[12.5px] text-[#5e6b65] mt-px">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-[9px] bg-white border border-[#e3e8e5] rounded-[9px] px-3 py-2 w-[280px]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa8a2" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="border-none outline-none text-[13px] w-full bg-transparent text-[#16201c]"
          placeholder="Search applications, parcels, applicants…"
        />
      </div>

      <button className="relative w-[38px] h-[38px] border border-[#e3e8e5] rounded-[9px] bg-white cursor-pointer flex items-center justify-center hover:bg-[#f4f6f5] transition-colors">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
        </svg>
        <span className="absolute top-[7px] right-[8px] w-[7px] h-[7px] rounded-full bg-[#be123c] border-[1.5px] border-white" />
      </button>
    </header>
  )
}
