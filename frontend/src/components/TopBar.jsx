import React from 'react'

export default function TopBar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-[5] bg-[#f4f6f5]/85 backdrop-blur-[8px] border-b border-[#e3e8e5] px-[30px] py-[15px] flex items-center gap-5">
      <div className="flex-1 min-w-0">
        <div className="text-[19px] font-bold tracking-[-0.01em] text-[#16201c]">{title}</div>
        {subtitle && <div className="text-[12.5px] text-[#5e6b65] mt-px">{subtitle}</div>}
      </div>
    </header>
  )
}
