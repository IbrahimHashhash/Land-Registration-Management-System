import React from 'react'

const VARIANTS = {
  primary: 'bg-[#1f5f4f] text-white border-transparent hover:bg-[#184c40]',
  success: 'bg-[#1f7a4d] text-white border-transparent hover:bg-[#196040]',
  danger:  'bg-[#fdeded] text-[#b91c1c] border-[#f0c4c4] hover:bg-[#fbe6e6]',
  warning: 'bg-[#fdf6e8] text-[#b45309] border-[#f0d49b] hover:bg-[#fbeedd]',
  ghost:   'bg-white text-[#384640] border-[#e3e8e5] hover:bg-[#f4f6f5]',
}

export default function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const sz = size === 'sm'
    ? 'px-3 py-[7px] text-[12px]'
    : 'px-[14px] py-[9px] text-[13px]'
  return (
    <button
      className={`inline-flex items-center gap-1.5 border rounded-[9px] font-semibold font-[inherit] cursor-pointer transition-colors whitespace-nowrap ${sz} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
