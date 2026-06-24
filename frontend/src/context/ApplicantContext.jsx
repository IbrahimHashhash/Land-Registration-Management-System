import React, { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'lrmis.applicant'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist(user) {
  if (!user) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

const ApplicantContext = createContext(null)

export function ApplicantProvider({ children }) {
  const [user, setUserState] = useState(() => loadStored())

  useEffect(() => { persist(user) }, [user])

  const setUser = (next) => setUserState(next)

  return (
    <ApplicantContext.Provider value={{ user, setUser }}>
      {children}
    </ApplicantContext.Provider>
  )
}

export function useApplicant() {
  return useContext(ApplicantContext)
}

// Build the lightweight UI user object from the backend applicant record.
export function buildUserFromApplicant(record) {
  if (!record) return null
  const initials = (record.full_name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join('') || '?'
  const verified = record.verification_state === 'verified'
  const typeLabel =
    {
      citizen: 'Citizen',
      lawyer: 'Lawyer',
      company: 'Company',
      surveyor: 'Surveyor',
      authorized_representative: 'Representative',
    }[record.applicant_type] || record.applicant_type || 'Applicant'
  return {
    applicant_id: record.applicant_id,
    applicantId: record.applicant_id,
    name: record.full_name,
    initials,
    type: `${typeLabel} · ${verified ? 'Verified' : 'Unverified'}`,
    applicantType: record.applicant_type,
    verified,
    verificationMethod: record.identity?.verification_method || 'otp_stub',
    email: record.contacts?.email,
    phone: record.contacts?.phone,
    nationalId: record.identity?.national_id,
    city: record.address?.city,
    address: record.address?.neighborhood,
    zoneId: record.address?.zone_id,
    avatarBg: '#e7f1ee',
    avatarFg: '#1f5f4f',
  }
}
