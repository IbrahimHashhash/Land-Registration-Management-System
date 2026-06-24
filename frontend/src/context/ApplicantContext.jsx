import React, { createContext, useContext, useState } from 'react'

export const APPLICANT_USERS = {
  nour: {
    id: 'nour',
    applicantId: 'APP-NOUR0001',
    name: 'Nour Ahmad',
    initials: 'NA',
    type: 'Citizen · Verified',
    applicantType: 'citizen',
    verified: true,
    verificationMethod: 'otp_stub',
    email: 'nour@example.com',
    phone: '+970 599 000 000',
    nationalId: '990000001',
    seededApplicantId: 'APP-DEMO0001',
    city: 'Ramallah',
    address: 'Al Tireh',
    zoneId: 'ZONE-RM-01',
    avatarBg: '#e7f1ee',
    avatarFg: '#1f5f4f',
  },
  khaled: {
    id: 'khaled',
    applicantId: 'APP-KHAL0001',
    name: 'Khaled Mansour',
    initials: 'KM',
    type: 'Lawyer · Verified',
    applicantType: 'lawyer',
    verified: true,
    verificationMethod: 'otp_stub',
    email: 'khaled@example.com',
    phone: '+970 599 111 111',
    nationalId: '990000002',
    seededApplicantId: 'APP-DEMO0002',
    city: 'Ramallah',
    address: 'Al Bireh',
    zoneId: 'ZONE-RM-02',
    avatarBg: '#eef1f4',
    avatarFg: '#475569',
  },
  lina: {
    id: 'lina',
    applicantId: 'APP-LINA0001',
    name: 'Lina Haddad',
    initials: 'LH',
    type: 'Citizen · Unverified',
    applicantType: 'citizen',
    verified: false,
    verificationMethod: 'otp_stub',
    email: 'lina@example.com',
    phone: '+970 599 222 222',
    nationalId: '990000003',
    seededApplicantId: 'APP-DEMO0003',
    city: 'Ramallah',
    address: 'Beituniya',
    zoneId: 'ZONE-RM-01',
    avatarBg: '#eef1f4',
    avatarFg: '#475569',
  },
}

// applicant_id from the backend (APP-XXXXXXXX) is stored in localStorage
// keyed by national_id so it survives page refresh and re-login
export function getStoredApplicantId(nationalId) {
  return localStorage.getItem(`applicant_id_${nationalId}`) || null
}

export function storeApplicantId(nationalId, applicantId) {
  localStorage.setItem(`applicant_id_${nationalId}`, applicantId)
}

const ApplicantContext = createContext(null)

export function ApplicantProvider({ children }) {
  const [user, setUser] = useState(null)
  return (
    <ApplicantContext.Provider value={{ user, setUser }}>
      {children}
    </ApplicantContext.Provider>
  )
}

export function useApplicant() {
  return useContext(ApplicantContext)
}
