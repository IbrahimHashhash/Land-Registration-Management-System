import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { TYPES, APPLICANT_TYPES } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { APPLICATIONS } from '../data/applications'

const DOCS = [
  { name: 'Ownership Deed',    file: 'ownership_deed_145.pdf', size: '2.4 MB',  status: 'verified'      },
  { name: 'National ID Copy',  file: 'id_copy_nour.pdf',       size: '640 KB',  status: 'verified'      },
  { name: 'Sale Contract',     file: 'sale_contract_145.pdf',  size: '1.1 MB',  status: 'pending_review' },
]

const DOC_STATUS = {
  verified:        { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review:  { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  rejected:        { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
}

const NOTES = [
  {
    initials: 'YK',
    name: 'Yousef Karam',
    date: 'Feb 01, 2026 · 10:05',
    body: 'Initial pre-check completed. Sale contract still needs review before legal stage.',
  },
]

const TIMELINE = [
  { label: 'Submitted',           role: 'Applicant',        actor: 'Nour Ahmad',           date: 'Feb 01, 2026 · 09:00', done: true,  current: false },
  { label: 'Pre-Checked',         role: 'Registrar',        actor: 'staff_14',             date: 'Feb 01, 2026 · 10:00', done: true,  current: false },
  { label: 'Survey Assigned',     role: 'System',           actor: 'assignment_engine',    date: 'Feb 02, 2026 · 08:00', done: true,  current: false },
  { label: 'Surveyed',            role: 'Surveyor',         actor: 'SURV-RM-04',           date: 'Feb 05, 2026 · 14:30', done: true,  current: false },
  { label: 'Legal Review',        role: 'Registrar',        actor: 'staff_14',             date: null,                   done: false, current: true  },
  { label: 'Approved / Rejected', role: 'Senior Registrar', actor: null,                   date: null,                   done: false, current: false },
  { label: 'Certificate Issued',  role: 'System',           actor: null,                   date: null,                   done: false, current: false },
]

export default function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [noteText, setNoteText] = useState('')
  const noteRef = React.useRef(null)

  const app = APPLICATIONS.find(a => a.id === id) || APPLICATIONS[0]

  const initials = app.applicantName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AppShell
      title={app.id}
      subtitle={`${TYPES[app.type] || app.type} · Submitted ${app.submitted}`}
    >
      {/* Back nav */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to applications
      </Link>

      {/* App header */}
      <Card className="p-[22px] mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="mono text-[22px] font-bold text-[#16201c]">{app.id}</span>
              <StatusBadge status={app.status} />
              <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[#f0f3f1] text-[#5e6b65]">
                Normal priority
              </span>
            </div>
            <div className="text-[13px] text-[#5e6b65]">
              {TYPES[app.type] || app.type}
              {' · '}Submitted {app.submitted}
              {' · '}Assigned to{' '}
              <span className="mono">{app.registrar}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => { noteRef.current?.focus(); noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Add Note
            </Button>
            <Button variant="warning" size="sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Request Documents
            </Button>
            <Button variant="danger" size="sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/review/${app.id}`)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <polyline points="9 14 11 16 15 12"/>
              </svg>
              Review
            </Button>
          </div>
        </div>
      </Card>

      {/* 2-col layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.6fr 1fr' }}>

        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Applicant + Parcel info grid */}
          <div className="grid grid-cols-2 gap-5">

            {/* Applicant */}
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">
                Applicant
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#e7f1ee] text-[#1f5f4f] flex items-center justify-center font-bold text-[14px] shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#16201c]">{app.applicantName}</div>
                  <div className="text-[12px] text-[#5e6b65]">{APPLICANT_TYPES[app.applicantType]} · Verified</div>
                </div>
              </div>
              <div className="space-y-[10px]">
                {[
                  ['National ID', '400000000'],
                  ['Email',       'nour@example.com'],
                  ['Phone',       '+970 599 000 000'],
                  ['Address',     'Ramallah · Al Tireh'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-[11px] text-[#9aa8a2] mb-[2px]">{label}</div>
                    <div className="text-[13px] text-[#384640]">{val}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Parcel */}
            <Card className="p-[20px]">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">
                Parcel
              </div>
              <div className="mono text-[16px] font-bold text-[#16201c] mb-[3px]">RM-Z01-B12-P145</div>
              <div className="text-[12px] text-[#5e6b65] mb-4">Residential · Registered</div>
              <div className="space-y-[10px]">
                {[
                  ['Parcel / Block', app.parcel],
                  ['Basin',          '3'],
                  ['Zone',           app.zone],
                  ['Area',           '850.5 m²'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-[11px] text-[#9aa8a2] mb-[2px]">{label}</div>
                    <div className="mono text-[13px] text-[#384640]">{val}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Documents */}
          <Card className="p-[20px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65]">
                Documents
              </div>
              <span className="text-[12px] text-[#5e6b65]">{DOCS.length} files</span>
            </div>
            <div className="space-y-[10px]">
              {DOCS.map(doc => {
                const ds = DOC_STATUS[doc.status]
                return (
                  <div
                    key={doc.file}
                    className="flex items-center gap-3 p-[13px] bg-[#f8faf9] rounded-[9px] border border-[#e3e8e5]"
                  >
                    <div className="w-8 h-8 bg-[#e7f1ee] rounded-[7px] flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f5f4f" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#16201c]">{doc.name}</div>
                      <div className="text-[11.5px] text-[#9aa8a2]">{doc.file} · {doc.size}</div>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full whitespace-nowrap"
                      style={{ color: ds.fg, background: ds.bg }}
                    >
                      {ds.label}
                    </span>
                    <button className="text-[#9aa8a2] hover:text-[#384640] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Internal Notes */}
          <Card className="p-[20px]">
            <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">
              Internal Notes
            </div>
            <div className="space-y-4 mb-4">
              {NOTES.map((note, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#e7f1ee] text-[#1f5f4f] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {note.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12.5px] font-semibold text-[#16201c]">{note.name}</span>
                      <span className="text-[11.5px] text-[#9aa8a2]">{note.date}</span>
                    </div>
                    <p className="text-[13px] text-[#384640] leading-relaxed">{note.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={noteRef}
                className="flex-1 border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white text-[#16201c] placeholder:text-[#9aa8a2] focus:border-[#1f5f4f] transition-colors"
                placeholder="Add an internal note…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <Button variant="primary" size="sm">Post</Button>
            </div>
          </Card>
        </div>

        {/* Right column: Timeline */}
        <Card className="p-[20px] self-start">
          <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-5">
            Workflow Timeline
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-[#e3e8e5]" />

            <div className="space-y-0">
              {TIMELINE.map((step, i) => (
                <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                  {/* Dot */}
                  <div
                    className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 z-[1] mt-[1px] ${
                      step.done
                        ? 'bg-[#1f5f4f] border-[#1f5f4f]'
                        : step.current
                        ? 'bg-white border-[#1f5f4f]'
                        : 'bg-white border-[#cdd6d2]'
                    }`}
                  >
                    {step.done && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {step.current && (
                      <div className="w-[8px] h-[8px] rounded-full bg-[#1f5f4f]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13.5px] font-semibold mb-[2px] ${
                      step.done ? 'text-[#16201c]' : step.current ? 'text-[#1f5f4f]' : 'text-[#9aa8a2]'
                    }`}>
                      {step.label}
                      {step.current && (
                        <span className="ml-2 text-[11px] font-semibold px-[8px] py-[2px] rounded-full bg-[#e7f1ee] text-[#1f5f4f]">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#9aa8a2]">
                      {step.role}{step.actor && ` · `}
                      {step.actor && <span className="mono">{step.actor}</span>}
                    </div>
                    {step.date && (
                      <div className="text-[11.5px] text-[#9aa8a2] mt-[2px]">{step.date}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
