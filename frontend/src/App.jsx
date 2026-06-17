import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import RegisterApplicant from './pages/RegisterApplicant'
import ApplicantProfile from './pages/ApplicantProfile'
import StaffDashboard from './pages/StaffDashboard'
import ApplicationManagement from './pages/ApplicationManagement'
import ApplicationDetails from './pages/ApplicationDetails'
import RegistrarReview from './pages/RegistrarReview'
import CertificateIssuance from './pages/CertificateIssuance'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<StaffDashboard />} />
        <Route path="/applications"        element={<ApplicationManagement />} />
        <Route path="/applications/:id"    element={<ApplicationDetails />} />
        <Route path="/review/:id"           element={<RegistrarReview />} />
        <Route path="/certificates"        element={<CertificateIssuance />} />
        <Route path="/register" element={
          <div className="max-w-3xl mx-auto px-6 py-8">
            <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
            <RegisterApplicant />
          </div>
        } />
        <Route path="/profile" element={
          <div className="max-w-5xl mx-auto px-6 py-8">
            <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
            <ApplicantProfile />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
