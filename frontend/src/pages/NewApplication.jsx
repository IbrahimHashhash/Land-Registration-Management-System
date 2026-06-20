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

function ClickCapture({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

function LocationPicker({ point, onPick }) {
  return (
    <MapContainer center={[31.9022, 35.2034]} zoom={14} style={{ height: 280, borderRadius: 11 }} scrollWheelZoom>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onPick} />
      {point && <CircleMarker center={[point.lat, point.lng]} radius={9} pathOptions={{ color: '#1f5f4f', fillColor: '#1f5f4f', fillOpacity: 0.6 }} />}
    </MapContainer>
  )
}

const INPUT = 'w-full border border-[#e3e8e5] rounded-[9px] px-[13px] py-[11px] text-[13px] font-[inherit] outline-none bg-white focus:border-[#1f5f4f] transition-colors'
const LABEL = 'text-[12px] font-semibold text-[#384640] mb-[6px] block'

const ZONES = ['ZONE-RM-01', 'ZONE-RM-02', 'ZONE-RM-03']

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
    setBusy(true)
    setError('')
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
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Could not create application')
      setBusy(false)
    }
  }

  return (
    <AppShell title="New Application" subtitle="Register a new land application">
      <Link to="/applications" className="inline-flex items-center gap-[7px] text-[13px] text-[#5e6b65] no-underline hover:text-[#16201c] transition-colors mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to applications
      </Link>

      <form onSubmit={submit} className="max-w-[760px]">
        <Card className="p-[24px] mb-5">
          <div className="text-[14px] font-bold text-[#16201c] mb-5">Application</div>
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

        <Card className="p-[24px] mb-5">
          <div className="text-[14px] font-bold text-[#16201c] mb-5">Applicant</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Applicant ID</label>
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

        <Card className="p-[24px] mb-5">
          <div className="text-[14px] font-bold text-[#16201c] mb-5">Parcel</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Parcel Number</label>
              <input className={INPUT} required placeholder="145" value={form.parcel_no} onChange={set('parcel_no')} />
            </div>
            <div>
              <label className={LABEL}>Block Number</label>
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
          <div className="mt-4">
            <label className={LABEL}>Parcel Location <span className="font-normal text-[#9aa8a2]">— click the map to place the parcel</span></label>
            <div className="overflow-hidden rounded-[11px] border border-[#e3e8e5]">
              <LocationPicker point={point} onPick={setPoint} />
            </div>
            <div className="text-[12px] text-[#5e6b65] mt-2">
              {point ? <>Selected: <span className="mono">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span></> : 'No location selected (optional).'}
            </div>
          </div>

          <div className="mt-4">
            <label className={LABEL}>Description</label>
            <textarea className={`${INPUT} resize-none h-[80px]`} placeholder="Short description of the application…" value={form.description} onChange={set('description')} />
          </div>
        </Card>

        {error && <div className="mb-4 text-[13px] text-[#b91c1c] bg-[#fbe6e6] border border-[#f0c4c4] rounded-[9px] px-3 py-2">{error}</div>}

        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit Application'}</Button>
          <Link to="/applications"><Button type="button" variant="ghost">Cancel</Button></Link>
        </div>
      </form>
    </AppShell>
  )
}
