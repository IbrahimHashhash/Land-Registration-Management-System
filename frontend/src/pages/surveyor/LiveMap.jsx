import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import SurveyorShell from '../../components/SurveyorShell'
import api from '../../api/client'
import 'leaflet/dist/leaflet.css'

const STATUS_COLORS = {
  survey_required: '#b45309',
  surveyed: '#3f6212',
  pending: '#1e5fae',
  disputed: '#be123c',
}

const FILTERS = ['all', 'survey_required', 'surveyed', 'disputed']

export default function LiveMap() {
  const [parcels, setParcels] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/analytics/geofeeds/parcels').then(res => setParcels(res.data?.features || [])).catch(() => {})
  }, [])

  const filtered = filter === 'all'
    ? parcels
    : parcels.filter(f => f.properties?.status === filter || f.properties?.dispute_state === filter)

  const geojson = { type: 'FeatureCollection', features: filtered }

  function style(feature) {
    const status = feature.properties?.dispute_state === 'disputed' ? 'disputed' : feature.properties?.status
    return { color: STATUS_COLORS[status] || '#1f5f4f', weight: 2, fillOpacity: 0.2 }
  }

  function onEachFeature(feature, layer) {
    const p = feature.properties || {}
    layer.bindPopup(`<b>${p.parcel_code || 'Parcel'}</b><br/>Zone: ${p.zone_id || '-'}<br/>Status: ${p.status || '-'}`)
  }

  return (
    <SurveyorShell title="Live Parcel Map" subtitle="Parcel boundaries, pending applications, survey tasks">
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-[6px] text-[12px] font-medium rounded-[9px] border cursor-pointer transition-colors ${filter === f ? 'bg-[#1f5f4f] text-white border-[#1f5f4f]' : 'bg-white text-[#384640] border-[#e3e8e5] hover:bg-[#f4f6f5]'}`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <div className="bg-white border border-[#e3e8e5] rounded-[13px] overflow-hidden" style={{ height: '500px' }}>
        <MapContainer center={[31.9, 35.2]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {filtered.length > 0 && <GeoJSON key={filter} data={geojson} style={style} onEachFeature={onEachFeature} />}
        </MapContainer>
      </div>
    </SurveyorShell>
  )
}
