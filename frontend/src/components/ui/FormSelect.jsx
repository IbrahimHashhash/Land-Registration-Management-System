import React from 'react'

const ARROW = `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239aa8a2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

export default function FormSelect({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] outline-none bg-white appearance-none focus:border-[#1f5f4f] transition-colors ${className}`}
      style={{
        fontFamily: 'inherit',
        backgroundImage: ARROW,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
      }}
      {...props}
    >
      {children}
    </select>
  )
}
