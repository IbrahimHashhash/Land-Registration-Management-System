import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { TYPES } from '../theme'
import { APPLICATIONS } from '../data/applications'

const REV_DOCS = [
  { name: 'Ownership Deed',  file: 'deed_khaled_210.pdf',        status: 'verified',       size: '3.1 MB' },
  { name: 'Survey Report',   file: 'survey_RM02_0002.pdf',       status: 'verified',       size: '1.8 MB' },
  { name: 'Title Statement', file: 'title_statement_210.pdf',    status: 'pending_review', size: '900 KB' },
]

const DOC_STATUS = {
  verified:        { label: 'Verified',       fg: '#1f7a4d', bg: '#e2f3e9' },
  pending_review:  { label: 'Pending Review', fg: '#b45309', bg: '#fbeedd' },
  rejected:        { label: 'Rejected',       fg: '#b91c1c', bg: '#fbe6e6' },
}

const CHECKLIST = [
  { label: 'Documents verified', value: null },
  { label: 'Survey report',      value: 'Received' },
  { label: 'Open objections',    value: 'None' },
]

export default function RegistrarReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [docStates, setDocStates] = useState({ 0: 'verified', 1: 'verified', 2: 'pending_review' })
  const [decision, setDecision] = useState('')

  const app = APPLICATIONS.find(a => a.id === id) || APPLICATIONS[0]
  const verifiedCount = Object.values(docStates).filter(s => s === 'verified').length

  const updateDoc = (i, status) => setDocStates(prev => ({ ...prev, [i]: status }))

  return (
    <AppShell
      title="Registrar Review"
      subtitle={`${app.id} · Legal Review stage`}
    >
      {/* Back nav */}
      <Link
        to={`/applications/${app.id}`}
        className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to application
      </Link>

      {/* App header */}
      <Card className="p-[22px] mb-5">
        <div className="flex items-center gap-3">
          <span className="mono text-[20px] font-bold text-[#16201c]">{app.id}</span>
          <StatusBadge status={app.status} />
        </div>
        <div className="text-[13px] text-[#5e6b65] mt-1.5">
          {TYPES[app.type] || app.type} · {app.applicantName} · {app.zone}
        </div>
      </Card>

      {/* 2-col layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.55fr 1fr' }}>

        {/* Legal Document Review */}
        <Card className="p-[22px]">
          <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Legal Document Review</div>
          <div className="text-[12.5px] text-[#5e6b65] mb-5">
            Review each document and mark as accepted or rejected before issuing a decision.
          </div>

          <div className="space-y-4">
            {REV_DOCS.map((doc, i) => {
              const currentStatus = docStates[i] || doc.status
              const ds = DOC_STATUS[currentStatus]
              return (
                <div key={doc.file} className="border border-[#e3e8e5] rounded-[11px] p-[16px]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-[#e7f1ee] rounded-[8px] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f5f4f" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-[#16201c]">{doc.name}</div>
                      <div className="text-[12px] text-[#9aa8a2]">{doc.file} · {doc.size}</div>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-[10px] py-[3px] rounded-full whitespace-nowrap"
                      style={{ color: ds.fg, background: ds.bg }}
                    >
                      {ds.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={currentStatus === 'verified' ? 'success' : 'ghost'}
                      size="sm"
                      onClick={() => updateDoc(i, 'verified')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Accept
                    </Button>
                    <Button
                      variant={currentStatus === 'rejected' ? 'danger' : 'ghost'}
                      size="sm"
                      onClick={() => updateDoc(i, 'rejected')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Reject
                    </Button>
                    <Button variant="ghost" size="sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Registrar Decision */}
          <Card className="p-[22px]">
            <div className="text-[14px] font-bold text-[#16201c] mb-4">Registrar Decision</div>

            {/* Checklist */}
            <div className="space-y-[10px] mb-4">
              {CHECKLIST.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-[9px] border-b border-[#f0f3f1] last:border-b-0">
                  <span className="text-[13px] text-[#5e6b65]">{label}</span>
                  <span className="text-[13px] font-semibold text-[#16201c]">
                    {label === 'Documents verified' ? `${verifiedCount} of ${REV_DOCS.length}` : value}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-[#5e6b65] mb-2 uppercase tracking-[.05em]">
                Decision Notes
              </label>
              <textarea
                className="w-full border border-[#e3e8e5] rounded-[9px] px-3 py-[9px] text-[13px] font-[inherit] outline-none bg-white text-[#16201c] placeholder:text-[#9aa8a2] focus:border-[#1f5f4f] transition-colors resize-none"
                rows={4}
                placeholder="Enter your review notes and decision rationale…"
                value={decision}
                onChange={e => setDecision(e.target.value)}
              />
            </div>
          </Card>

          {/* Action buttons */}
          <Card className="p-[18px]">
            <div className="text-[12px] font-semibold text-[#5e6b65] uppercase tracking-[.05em] mb-3">
              Issue Decision
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="success"
                className="w-full justify-center"
                onClick={() => navigate('/certificates')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve Application
              </Button>
              <Button variant="danger" className="w-full justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Reject Application
              </Button>
              <Button variant="warning" className="w-full justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Put On Hold
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
