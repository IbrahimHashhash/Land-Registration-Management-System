import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import SurveyorShell from '../../components/SurveyorShell'
import api from '../../api/client'
import { TYPES, STATUS } from '../../theme'
import 'leaflet/dist/leaflet.css'

const CLUSTER_ZOOM = 14

function markerIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function clusterIcon(count) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#1f5f4f;color:#fff;font-weight:700;font-size:13px;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${count}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function ZoomWatcher({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
  return null
}

function pointColor(p) {
  return STATUS[p.status]?.fg || '#1f5f4f'
}

export default function LiveMap() {
  const [parcels, setParcels] = useState([])
  const [apps, setApps] = useState([])
  const [zoom, setZoom] = useState(13)
  const [zone, setZone] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    api.get('/analytics/geofeeds/parcels').then(r => setParcels(r.data?.features || [])).catch(() => {})
    api.get('/analytics/geofeeds/applications').then(r => setApps(r.data?.features || [])).catch(() => {})
  }, [])

  const zones = useMemo(() => [...new Set(apps.map(f => f.properties?.zone_id).filter(Boolean))], [apps])

  const filteredApps = useMemo(() => apps.filter(f => {
    const p = f.properties || {}
    if (zone !== 'all' && p.zone_id !== zone) return false
    if (type !== 'all' && p.application_type !== type) return false
    if (status !== 'all' && p.status !== status) return false
    return true
  }), [apps, zone, type, status])

  const clusters = useMemo(() => {
    const groups = {}
    filteredApps.forEach(f => {
      const z = f.properties?.zone_id || 'NA'
      if (!groups[z]) groups[z] = []
      groups[z].push(f)
    })
    return Object.entries(groups).map(([z, feats]) => {
      const lat = feats.reduce((s, f) => s + f.geometry.coordinates[1], 0) / feats.length
      const lng = feats.reduce((s, f) => s + f.geometry.coordinates[0], 0) / feats.length
      return { zone: z, count: feats.length, position: [lat, lng] }
    })
  }, [filteredApps])

  function parcelStyle(feature) {
    const disputed = feature.properties?.dispute_state === 'disputed'
    return { color: disputed ? '#be123c' : '#1f5f4f', weight: 2, fillOpacity: disputed ? 0.25 : 0.12 }
  }

  function onEachParcel(feature, layer) {
    const p = feature.properties || {}
    layer.bindPopup(`<b>${p.parcel_code || 'Parcel'}</b><br/>Zone: ${p.zone_id || '-'}<br/>Status: ${p.status || '-'}${p.dispute_state === 'disputed' ? '<br/><b style="color:#be123c">Disputed</b>' : ''}`)
  }

  const Select = ({ value, onChange, options, label }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-[#e3e8e5] rounded-[9px] px-3 py-[6px] text-[12.5px] bg-white text-[#16201c] outline-none focus:border-[#1f5f4f] cursor-pointer"
    >
      <option value="all">{label}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
    </select>
  )

  return (
    <SurveyorShell title="Live Parcel Map" subtitle="Parcels, pending and survey-required applications, disputed parcels">
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={zone} onChange={setZone} label="All Zones" options={zones.map(z => ({ value: z, text: z }))} />
        <Select value={type} onChange={setType} label="All Types" options={Object.entries(TYPES).map(([value, text]) => ({ value, text }))} />
        <Select value={status} onChange={setStatus} label="All Statuses" options={Object.entries(STATUS).map(([value, s]) => ({ value, text: s.label }))} />
      </div>

      <div className="bg-white border border-[#e3e8e5] rounded-[13px] overflow-hidden" style={{ height: '520px' }}>
        <MapContainer center={[31.905, 35.205]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <ZoomWatcher onZoom={setZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {parcels.length > 0 && (
            <GeoJSON key={`parcels-${parcels.length}`} data={{ type: 'FeatureCollection', features: parcels }} style={parcelStyle} onEachFeature={onEachParcel} />
          )}

          {zoom < CLUSTER_ZOOM
            ? clusters.map(c => (
                <Marker key={c.zone} position={c.position} icon={clusterIcon(c.count)}>
                  <Popup>{c.zone}: {c.count} application{c.count > 1 ? 's' : ''}</Popup>
                </Marker>
              ))
            : filteredApps.map(f => {
                const p = f.properties || {}
                return (
                  <Marker
                    key={p.application_id}
                    position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                    icon={markerIcon(pointColor(p))}
                  >
                    <Popup>
                      <b>{p.application_id}</b><br/>
                      Type: {TYPES[p.application_type] || p.application_type}<br/>
                      Status: {STATUS[p.status]?.label || p.status}<br/>
                      Zone: {p.zone_id}
                    </Popup>
                  </Marker>
                )
              })}
        </MapContainer>
      </div>
      <p className="text-[11.5px] text-[#8a988f] mt-2">Zoom in past level {CLUSTER_ZOOM} to expand clustered application markers.</p>
    </SurveyorShell>
  )
}
