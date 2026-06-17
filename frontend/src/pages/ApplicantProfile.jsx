import React, { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function ApplicantProfile() {
  const [applicantId, setApplicantId] = useState('')
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setError(null)
    setProfile(null)
    setLoading(true)
    try {
      const res = await axios.get(`${API}/applicants/${applicantId}`)
      setProfile(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Applicant Profile</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            value={applicantId}
            onChange={e => setApplicantId(e.target.value)}
            placeholder="Enter Applicant ID (e.g. APP-3F2A1B9C)"
            required
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {profile && (
          <div className="bg-white rounded-2xl shadow divide-y divide-gray-100">

            {/* Header */}
            <div className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                {profile.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{profile.full_name}</h2>
                <span className="inline-block text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                  {profile.applicant_type.replace('_', ' ')}
                </span>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${verificationBadgeClass(profile.verification_state)}`}>
                  {profile.verification_state}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <Field label="Applicant ID" value={profile.applicant_id} mono />
              <Field label="Email" value={profile.email} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Preferred Contact" value={profile.preferred_contact} />
              <Field label="City" value={profile.city} />
              <Field label="Neighborhood" value={profile.neighborhood} />
              <Field label="Address" value={profile.address} />
              <Field label="Zone ID" value={profile.zone_id} />
              <Field label="Language" value={profile.preferred_language === 'ar' ? 'Arabic' : 'English'} />
            </div>

            {/* Stats */}
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Applications</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Stat label="Total" value={profile.stats.total_applications} color="blue" />
                <Stat label="Approved" value={profile.stats.approved} color="green" />
                <Stat label="Pending" value={profile.stats.pending} color="yellow" />
              </div>
              {profile.linked_applications.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {profile.linked_applications.map(id => (
                    <div key={id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-sm font-mono text-gray-700">{id}</span>
                      <button className="text-xs text-blue-600 hover:underline">View</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No applications submitted yet.</p>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notification Preferences</p>
              <div className="flex flex-col gap-2">
                <Preference label="Email notifications" enabled={profile.notify_by_email} />
                <Preference label="SMS notifications" enabled={profile.notify_by_sms} />
              </div>
            </div>

            {/* Privacy */}
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Privacy</p>
              <Preference label="Public profile" enabled={profile.profile_public} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function verificationBadgeClass(state) {
  const map = {
    verified: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    unverified: 'bg-yellow-100 text-yellow-700',
  }
  return map[state] ?? 'bg-gray-100 text-gray-600'
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Preference({ label, enabled }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`ml-auto text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
        {enabled ? 'On' : 'Off'}
      </span>
    </div>
  )
}

function Stat({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className={`rounded-xl p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </div>
  )
}
