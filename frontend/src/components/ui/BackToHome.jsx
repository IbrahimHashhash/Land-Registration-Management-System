import React from 'react'
import { Link } from 'react-router-dom'

export default function BackToHome({ to = '/', label = 'All roles' }) {
  return (
    <Link
      to={to}
      className="no-underline fixed top-[20px] left-[24px] flex items-center gap-[7px] text-[12.5px] font-medium text-[#5e6b65] hover:text-[#16201c] transition-colors group"
      style={{ fontFamily: 'inherit' }}
    >
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none"
        className="transition-transform group-hover:-translate-x-[2px]"
      >
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  )
}
