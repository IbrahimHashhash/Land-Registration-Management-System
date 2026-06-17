import React from 'react'

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-[#e3e8e5] rounded-[13px] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
