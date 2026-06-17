import React from 'react'
import { STATUS } from '../../theme'

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, fg: '#475569', bg: '#eef1f4' }
  return (
    <span
      className="text-[11px] font-semibold px-[10px] py-1 rounded-full whitespace-nowrap"
      style={{ color: s.fg, background: s.bg }}
    >
      {s.label}
    </span>
  )
}
