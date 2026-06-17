import React, { useState, useMemo } from 'react'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { TYPES } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'

const READY = [
  {
    id: 'LRMIS-2026-0006',
    status: 'approved',
    applicant: 'Omar Khalil',
    type: 'certificate_request',
    parcel: '57 / 09',
    zone: 'ZONE-RM-03',
    canGenerate: true,
    certNo: 'CERT-2026-0002',
    parcelRef: 'RM-Z03-B09-P057',
    date: 'Feb 12, 2026',
    issuedBy: 'registrar_09',
  },
  {
    id: 'LRMIS-2026-0008',
    status: 'certificate_issued',
    applicant: 'Sami Darwish',
    type: 'first_registration',
    parcel: '420 / 30',
    zone: 'ZONE-RM-01',
    canGenerate: false,
    certNo: 'CERT-2026-0003',
    parcelRef: 'RM-Z01-B30-P420',
    date: 'Feb 14, 2026',
    issuedBy: 'registrar_14',
  },
]

function QRPlaceholder({ seed }) {
  const size = 9
  const cells = useMemo(() => {
    let s = seed
    return Array.from({ length: size * size }, () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff
      return (s >>> 0) / 0xffffffff > 0.45
    })
  }, [seed])
  return (
    <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, 10px)` }}>
      {cells.map((filled, i) => (
        <div
          key={i}
          className={`w-[10px] h-[10px] rounded-[2px] ${filled ? 'bg-[#16201c]' : 'bg-[#f4f6f5]'}`}
        />
      ))}
    </div>
  )
}

export default function CertificateIssuance() {
  const [selected, setSelected] = useState('LRMIS-2026-0006')
  const cert = READY.find(a => a.id === selected) || READY[0]

  return (
    <AppShell title="Certificates" subtitle="Issue and manage land ownership certificates">

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.15fr 1fr' }}>

        {/* Ready for Certificate */}
        <Card className="p-[22px]">
          <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Ready for Certificate</div>
          <div className="text-[12.5px] text-[#5e6b65] mb-5">
            Approved applications awaiting certificate issuance
          </div>

          <div className="space-y-3">
            {READY.map(app => (
              <button
                key={app.id}
                onClick={() => setSelected(app.id)}
                className={`w-full text-left p-[15px] rounded-[11px] border transition-colors cursor-pointer font-[inherit] ${
                  selected === app.id
                    ? 'border-[#1f5f4f] bg-[#f0f7f4]'
                    : 'border-[#e3e8e5] bg-white hover:bg-[#f8faf9]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="mono text-[13px] font-semibold text-[#1f5f4f]">{app.id}</span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="text-[13px] text-[#16201c] font-medium mb-1">{app.applicant}</div>
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-[#5e6b65]">
                    {TYPES[app.type] || app.type} · <span className="mono">{app.parcel}</span>
                  </div>
                  {app.canGenerate ? (
                    <Button variant="primary" size="sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="6"/>
                        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                      </svg>
                      Generate
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Certificate Preview */}
        <div className="flex flex-col gap-5">
          <Card className="p-[22px]">
            <div className="text-[14px] font-bold text-[#16201c] mb-5">Certificate Preview</div>

            {/* Certificate document */}
            <div className="bg-[#fafcfb] border border-[#e3e8e5] rounded-[11px] p-[24px]">

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-[22px] h-[22px] rounded-md bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
                      <div className="w-[8px] h-[8px] border-[1.5px] border-white rounded-[2px]" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[.1em] text-[#5e6b65] uppercase">LRMIS</span>
                  </div>
                  <div className="text-[10.5px] text-[#9aa8a2] leading-snug max-w-[160px]">
                    Land Registration Management<br />Information System
                  </div>
                </div>
                <QRPlaceholder seed={cert.id.charCodeAt(cert.id.length - 1)} />
              </div>

              {/* Title */}
              <div className="border-t border-b border-[#e3e8e5] py-3 mb-4 text-center">
                <div className="text-[10.5px] font-semibold uppercase tracking-[.12em] text-[#5e6b65]">
                  Certificate of Land Ownership
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-[10px]">
                {[
                  ['Certificate No.',    cert.certNo,    true ],
                  ['Issued to',          cert.applicant, false],
                  ['Parcel Reference',   cert.parcelRef, true ],
                  ['Application',        cert.id,        true ],
                  ['Issue Date',         cert.date,      false],
                  ['Issued by',          cert.issuedBy,  true ],
                ].map(([label, value, mono]) => (
                  <div key={label} className="flex justify-between items-baseline gap-3">
                    <span className="text-[11.5px] text-[#9aa8a2] shrink-0">{label}</span>
                    <span className={`text-[12.5px] font-semibold text-[#16201c] text-right ${mono ? 'mono' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-[#e3e8e5] flex items-center justify-between">
                <div>
                  <div className="w-[80px] h-[1.5px] bg-[#cdd6d2] mb-1" />
                  <div className="text-[10.5px] text-[#9aa8a2]">Registrar Signature</div>
                </div>
                <span className="text-[11px] font-semibold px-[10px] py-[4px] rounded-full bg-[#dcf0f5] text-[#0e7490]">
                  Issued
                </span>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <Card className="p-[18px]">
            <div className="flex flex-col gap-2">
              <Button variant="primary" className="w-full justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="8 17 12 21 16 17"/>
                  <line x1="12" y1="3" x2="12" y2="21"/>
                </svg>
                Download PDF
              </Button>
              <Button variant="ghost" className="w-full justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Certificate
              </Button>
              <Button variant="ghost" className="w-full justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
