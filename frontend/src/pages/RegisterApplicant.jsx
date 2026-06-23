import React, { useState } from 'react'
import { registerApplicant } from '../api/applicant'
import { apiError } from '../utils/apiError'

export default function RegisterApplicant() {
  const [form, setForm] = useState({
    name: '',
    nationalId: '',
    applicantType: 'citizen',
    email: '',
    phone: '',
    city: '',
    address: '',
    zoneId: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // registerApplicant() builds the nested identity/contacts/address/preferences payload.
      const data = await registerApplicant({
        name: form.name,
        applicantType: form.applicantType,
        nationalId: form.nationalId,
        verified: false,
        verificationMethod: 'otp_stub',
        email: form.email,
        phone: form.phone,
        city: form.city,
        address: form.address,
        zoneId: form.zoneId,
      })
      setResult(data)
    } catch (err) {
      setError(apiError(err, 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful</h2>
          <p className="text-gray-500 mb-4">Save your applicant ID to track your applications.</p>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">Applicant ID</p>
            <p className="text-xl font-mono font-bold text-blue-600">{result.applicant_id}</p>
          </div>
          <p className="text-sm text-gray-400">Verification state: <span className="font-medium">{result.verification_state}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Register as Applicant</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" value={form.name} placeholder="Yazan Sulaiman" onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
            <input name="nationalId" value={form.nationalId} placeholder="123456789" onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Type</label>
            <select name="applicantType" value={form.applicantType} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="citizen">Citizen</option>
              <option value="lawyer">Lawyer</option>
              <option value="company">Company</option>
              <option value="surveyor">Surveyor</option>
              <option value="authorized_representative">Authorized Representative</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={form.email} type="email" placeholder="you@email.com" onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} placeholder="+97059..." onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="city" value={form.city} placeholder="Ramallah" onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
              <input name="address" value={form.address} placeholder="Al-Bireh" onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone ID</label>
            <input name="zoneId" value={form.zoneId} placeholder="ZONE-RM-01" onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 text-sm transition disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}
