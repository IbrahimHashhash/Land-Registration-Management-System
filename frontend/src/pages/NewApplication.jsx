import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import AppShell from '../components/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormSelect from '../components/ui/FormSelect'
import { TYPES, APPLICANT_TYPES } from '../theme'
import { createApplication } from '../api/applications'
import { apiError } from '../utils/apiError'

function ClickCapture({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

function LocationPicker({ point, onPick }) {
  return (
    <MapContainer center={[31.9022, 35.2034]} zoom={14} style={{ height: 240 }} scrollWheelZoom>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onPick} />
      {point && <CircleMarker center={[point.lat, point.lng]} radius={9} pathOptions={{ color: '#1f5f4f', fillColor: '#1f5f4f', fillOpacity: 0.6 }} />}
    </MapContainer>
  )
}

const INPUT = 'w-full border border-[#e3e8e5] rounded-[10px] px-[13px] py-[11px] text-[13px] font-[inherit] outline-none bg-white placeholder:text-[#b3beb8] focus:border-[#1f5f4f] focus:ring-2 focus:ring-[#e7f1ee] transition-all'
const LABEL = 'text-[12px] font-semibold text-[#384640] mb-[6px] block'

const Req = () => <span className="text-[#dc2626]"> *</span>

const ZONES = ['ZONE-RM-01', 'ZONE-RM-02', 'ZONE-RM-03']
const PRIORITY_STYLE = {
  high:   { color: '#b91c1c', background: '#fbe6e6' },
  normal: { color: '#5e6b65', background: '#f0f3f1' },
  low:    { color: '#1e5fae', background: '#e7f0fb' },
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-[10px] bg-[#e7f1ee] text-[#1f5f4f] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-bold text-[#16201c] leading-tight">{title}</div>
        {subtitle && <div className="text-[11.5px] text-[#9aa8a2]">{subtitle}</div>}
      </div>
    </div>
  )
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px] border-b border-[#f0f3f1] last:border-0">
      <span className="text-[11.5px] text-[#9aa8a2] shrink-0">{label}</span>
      <span className="text-[12.5px] font-medium text-[#16201c] text-right">{children}</span>
    </div>
  )
}

export default function NewApplication() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [point, setPoint] = useState(null)
  const [form, setForm] = useState({
    application_type: 'first_registration',
    priority: 'normal',
    applicant_id: '',
    applicant_type: 'citizen',
    parcel_no: '',
    block_no: '',
    basin_no: '',
    zone_id: 'ZONE-RM-01',
    description: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const missing = []
    if (!form.applicant_id.trim()) missing.push('Applicant ID')
    if (!form.parcel_no.trim()) missing.push('Parcel Number')
    if (!form.block_no.trim()) missing.push('Block Number')
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}.`)
      return
    }

    setBusy(true)
    const payload = {
      application_type: form.application_type,
      priority: form.priority,
      applicant_ref: { applicant_id: form.applicant_id, applicant_type: form.applicant_type },
      parcel: {
        parcel_no: form.parcel_no, block_no: form.block_no, basin_no: form.basin_no || null, zone_id: form.zone_id,
        geometry: point ? { type: 'Point', coordinates: [point.lng, point.lat] } : null,
      },
      description: form.description,
    }
    const key = `new-${form.applicant_id}-${form.parcel_no}-${Date.now()}`
    try {
      const res = await createApplication(payload, key)
      navigate(`/applications/${res.data.application_id}`)
    } catch (err) {
      setError(apiError(err, 'Could not create application'))
      setBusy(false)
    }
  }

  const parcelLabel = [form.parcel_no, form.block_no].filter(Boolean).join(' / ') || '—'

  return (
    <AppShell title="New Application" subtitle="Register a new land registration application">
      <Link to="/applications" className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back to applications
      </Link>

      <form onSubmit={submit} className="grid gap-5 items-start" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        {/* Left: form */}
        <div className="flex flex-col gap-5">
          <Card className="p-[24px]">
            <SectionHeader
              title="Application"
              subtitle="What is being requested"
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Application Type</label>
                <FormSelect value={form.application_type} onChange={set('application_type')}>
                  {Object.keys(TYPES).map(t => <option key={t} value={t}>{TYPES[t]}</option>)}
                </FormSelect>
              </div>
              <div>
                <label className={LABEL}>Priority</label>
                <FormSelect value={form.priority} onChange={set('priority')}>
                  {['low', 'normal', 'high'].map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </FormSelect>
              </div>
            </div>
          </Card>

          <Card className="p-[24px]">
            <SectionHeader
              title="Applicant"
              subtitle="Who is applying"
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Applicant ID<Req /></label>
                <input className={INPUT} required placeholder="APP-XXXXXXXX" value={form.applicant_id} onChange={set('applicant_id')} />
              </div>
              <div>
                <label className={LABEL}>Applicant Type</label>
                <FormSelect value={form.applicant_type} onChange={set('applicant_type')}>
                  {Object.keys(APPLICANT_TYPES).map(t => <option key={t} value={t}>{APPLICANT_TYPES[t]}</option>)}
                </FormSelect>
              </div>
            </div>
          </Card>

          <Card className="p-[24px]">
            <SectionHeader
              title="Parcel"
              subtitle="The land being registered"
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Parcel Number<Req /></label>
                <input className={INPUT} required placeholder="145" value={form.parcel_no} onChange={set('parcel_no')} />
              </div>
              <div>
                <label className={LABEL}>Block Number<Req /></label>
                <input className={INPUT} required placeholder="12" value={form.block_no} onChange={set('block_no')} />
              </div>
              <div>
                <label className={LABEL}>Basin Number</label>
                <input className={INPUT} placeholder="3" value={form.basin_no} onChange={set('basin_no')} />
              </div>
              <div>
                <label className={LABEL}>Zone</label>
                <FormSelect value={form.zone_id} onChange={set('zone_id')}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </FormSelect>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className={`${LABEL} mb-0`}>Parcel Location</label>
                <span className="text-[11.5px] text-[#9aa8a2]">Click the map to place the parcel</span>
              </div>
              <div className="overflow-hidden rounded-[11px] border border-[#e3e8e5]">
                <LocationPicker point={point} onPick={setPoint} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-[12px]">
                <span className={`w-[8px] h-[8px] rounded-full ${point ? 'bg-[#1f5f4f]' : 'bg-[#cdd6d2]'}`} />
                <span className="text-[#5e6b65]">
                  {point ? <>Location set · <span className="mono">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span></> : 'No location selected (optional)'}
                </span>
                {point && <button type="button" onClick={() => setPoint(null)} className="text-[#9aa8a2] hover:text-[#b91c1c] ml-1 text-[11.5px] underline">clear</button>}
              </div>
            </div>

            <div className="mt-5">
              <label className={LABEL}>Description</label>
              <textarea className={`${INPUT} resize-none h-[80px]`} placeholder="Short description of the application…" value={form.description} onChange={set('description')} />
            </div>
          </Card>
        </div>

        {/* Right: live summary */}
        <Card className="p-[22px] sticky top-[20px]">
          <div className="text-[11.5px] font-semibold tracking-[.07em] uppercase text-[#5e6b65] mb-4">Summary</div>

          <div className="mb-4">
            <SummaryRow label="Type">{TYPES[form.application_type]}</SummaryRow>
            <SummaryRow label="Priority">
              <span className="text-[11px] font-semibold px-[9px] py-[2px] rounded-full capitalize" style={PRIORITY_STYLE[form.priority]}>{form.priority}</span>
            </SummaryRow>
            <SummaryRow label="Applicant">
              {form.applicant_id ? <span className="mono">{form.applicant_id}</span> : <span className="text-[#b3beb8]">—</span>}
            </SummaryRow>
            <SummaryRow label="Applicant Type">{APPLICANT_TYPES[form.applicant_type]}</SummaryRow>
            <SummaryRow label="Parcel / Block"><span className="mono">{parcelLabel}</span></SummaryRow>
            <SummaryRow label="Zone"><span className="mono">{form.zone_id}</span></SummaryRow>
            <SummaryRow label="Location">
              {point ? <span className="text-[#1f7a4d]">On map ✓</span> : <span className="text-[#b3beb8]">Not set</span>}
            </SummaryRow>
          </div>

          {error && <div className="mb-4 text-[12.5px] text-[#b91c1c] bg-[#fbe6e6] border border-[#f0c4c4] rounded-[9px] px-3 py-2">{error}</div>}

          <Button type="submit" variant="primary" className="w-full justify-center mb-2" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Application'}
          </Button>
          <Link to="/applications" className="block">
            <Button type="button" variant="ghost" className="w-full justify-center">Cancel</Button>
          </Link>

          <div className="mt-4 flex items-start gap-2 text-[11.5px] text-[#9aa8a2] leading-snug">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-[1px]"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <span>The application will start as <b>Submitted</b> and receive an ID automatically.</span>
          </div>
        </Card>
      </form>
    </AppShell>
  )
}
