import React, { useState, useEffect, useMemo, useCallback } from 'react'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { TYPES } from '../theme'
import StatusBadge from '../components/ui/StatusBadge'
import { listApplications, listCertificates, issueCertificate } from '../api/applications'
import { apiError } from '../utils/apiError'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function QRPlaceholder({ seed }) {
  const size = 9
  const cells = useMemo(() => {
    let s = seed || 7
    return Array.from({ length: size * size }, () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff
      return (s >>> 0) / 0xffffffff > 0.45
    })
  }, [seed])
  return (
    <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, 10px)` }}>
      {cells.map((filled, i) => (
        <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${filled ? 'bg-[#16201c]' : 'bg-[#f4f6f5]'}`} />
      ))}
    </div>
  )
}

export default function CertificateIssuance() {
  const [approved, setApproved] = useState([])
  const [certificates, setCertificates] = useState([])
  const [selected, setSelected] = useState(null)
  const [names, setNames] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [nameErr, setNameErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([listApplications({ status: 'approved', page: 1, page_size: 50 }), listCertificates()])
      .then(([apps, certs]) => {
        setApproved(apps.data.items)
        setCertificates(certs.data)
      })
      .catch((e) => setError(apiError(e, 'Could not load certificates.')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const generate = async (app) => {
    const full_name = (names[app.application_id] || '').trim()
    if (!full_name) {
      setNameErr(app.application_id)
      setMsgType('error')
      setMsg(`Enter the owner full name for ${app.application_id} before generating.`)
      return
    }
    setNameErr('')
    setBusy(true)
    setMsg('')
    try {
      const res = await issueCertificate(app.application_id, { full_name, issued_by: 'registrar' })
      setMsgType('success')
      setMsg(`Certificate ${res.data.certificate_id} issued for ${app.application_id}.`)
      setSelected(res.data.certificate_id)
      load()
    } catch (e) {
      setMsgType('error')
      setMsg(apiError(e, 'Could not issue certificate'))
    } finally {
      setBusy(false)
    }
  }

  const cert = certificates.find(c => c.certificate_id === selected) || certificates[0]

  return (
    <AppShell title="Certificates" subtitle="Issue and manage land ownership certificates">
      {loading ? (
        <div className="text-[13px] text-[#5e6b65]">Loading…</div>
      ) : error ? (
        <div className="text-[13px] text-[#b91c1c]">{error}</div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
          <div className="flex flex-col gap-5">
            <Card className="p-[22px]">
              <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Ready for Certificate</div>
              <div className="text-[12.5px] text-[#5e6b65] mb-5">Approved applications awaiting certificate issuance</div>
              {approved.length === 0 ? (
                <div className="text-[13px] text-[#9aa8a2]">No approved applications waiting.</div>
              ) : (
                <div className="space-y-3">
                  {approved.map(app => (
                    <div key={app.application_id} className="p-[15px] rounded-[11px] border border-[#e3e8e5] bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="mono text-[13px] font-semibold text-[#1f5f4f]">{app.application_id}</span>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="text-[12px] text-[#5e6b65] mb-3">
                        {TYPES[app.application_type] || app.application_type} · <span className="mono">{app.applicant_ref?.applicant_id}</span>
                      </div>
                      <div className="text-[12px] text-[#5e6b65] mb-1">Owner full name<span className="text-[#dc2626]"> *</span></div>
                      <div className="flex gap-2">
                        <input
                          className={`flex-1 border rounded-[9px] px-3 py-[8px] text-[12.5px] font-[inherit] outline-none bg-white transition-colors ${nameErr === app.application_id ? 'border-[#dc2626] focus:border-[#dc2626]' : 'border-[#e3e8e5] focus:border-[#1f5f4f]'}`}
                          placeholder="Owner full name"
                          value={names[app.application_id] || ''}
                          onChange={e => {
                            if (nameErr === app.application_id) setNameErr('')
                            setNames(n => ({ ...n, [app.application_id]: e.target.value }))
                          }}
                        />
                        <Button variant="primary" size="sm" disabled={busy} onClick={() => generate(app)}>Generate</Button>
                      </div>
                      {nameErr === app.application_id && (
                        <div className="text-[11.5px] text-[#b91c1c] mt-[6px]">Owner full name is required to generate the certificate.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-[22px]">
              <div className="text-[14px] font-bold text-[#16201c] mb-[5px]">Issued Certificates</div>
              <div className="text-[12.5px] text-[#5e6b65] mb-5">{certificates.length} issued</div>
              {certificates.length === 0 ? (
                <div className="text-[13px] text-[#9aa8a2]">No certificates issued yet.</div>
              ) : (
                <div className="space-y-2">
                  {certificates.map(c => (
                    <button
                      key={c.certificate_id}
                      onClick={() => setSelected(c.certificate_id)}
                      className={`w-full text-left p-[13px] rounded-[10px] border transition-colors cursor-pointer font-[inherit] ${
                        (cert && cert.certificate_id === c.certificate_id) ? 'border-[#1f5f4f] bg-[#f0f7f4]' : 'border-[#e3e8e5] bg-white hover:bg-[#f8faf9]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="mono text-[13px] font-semibold text-[#0e7490]">{c.certificate_id}</span>
                        <span className="text-[11.5px] text-[#9aa8a2]">{fmtDate(c.issued_at)}</span>
                      </div>
                      <div className="text-[12px] text-[#5e6b65] mt-1">{c.issued_to?.full_name} · <span className="mono">{c.application_id}</span></div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            {msg && <div className={`text-[12.5px] border rounded-[8px] px-3 py-2 ${msgType === 'error' ? 'text-[#b91c1c] bg-[#fbe6e6] border-[#f0c4c4]' : 'text-[#1f7a4d] bg-[#e2f3e9] border-[#cfe8da]'}`}>{msg}</div>}
            <Card className="p-[22px]">
              <div className="text-[14px] font-bold text-[#16201c] mb-5">Certificate Preview</div>
              {!cert ? (
                <div className="text-[13px] text-[#9aa8a2]">Select or generate a certificate to preview it.</div>
              ) : (
                <div className="bg-[#fafcfb] border border-[#e3e8e5] rounded-[11px] p-[24px]">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-[22px] h-[22px] rounded-md bg-[#1f5f4f] flex items-center justify-center rotate-45 shrink-0">
                          <div className="w-[8px] h-[8px] border-[1.5px] border-white rounded-[2px]" />
                        </div>
                        <span className="text-[11px] font-bold tracking-[.1em] text-[#5e6b65] uppercase">LRMIS</span>
                      </div>
                      <div className="text-[10.5px] text-[#9aa8a2] leading-snug max-w-[160px]">Land Registration Management<br />Information System</div>
                    </div>
                    <QRPlaceholder seed={cert.certificate_id.charCodeAt(cert.certificate_id.length - 1)} />
                  </div>

                  <div className="border-t border-b border-[#e3e8e5] py-3 mb-4 text-center">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[.12em] text-[#5e6b65]">Certificate of Land Ownership</div>
                  </div>

                  <div className="space-y-[10px]">
                    {[
                      ['Certificate No.', cert.certificate_id, true],
                      ['Issued to', cert.issued_to?.full_name, false],
                      ['Parcel Reference', cert.parcel_id || '—', true],
                      ['Application', cert.application_id, true],
                      ['Issue Date', fmtDate(cert.issued_at), false],
                      ['Issued by', cert.issued_by, true],
                    ].map(([label, value, mono]) => (
                      <div key={label} className="flex justify-between items-baseline gap-3">
                        <span className="text-[11.5px] text-[#9aa8a2] shrink-0">{label}</span>
                        <span className={`text-[12.5px] font-semibold text-[#16201c] text-right ${mono ? 'mono' : ''}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#e3e8e5] flex items-center justify-between">
                    <div>
                      <div className="w-[80px] h-[1.5px] bg-[#cdd6d2] mb-1" />
                      <div className="text-[10.5px] text-[#9aa8a2]">Registrar Signature</div>
                    </div>
                    <span className="text-[11px] font-semibold px-[10px] py-[4px] rounded-full bg-[#dcf0f5] text-[#0e7490] capitalize">{cert.status}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  )
}
