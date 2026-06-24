import React from 'react'
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom'
import Login from './pages/Login'
import RegisterApplicant from './pages/RegisterApplicant'
import StaffDashboard from './pages/StaffDashboard'
import ApplicationManagement from './pages/ApplicationManagement'
import ApplicationDetails from './pages/ApplicationDetails'
import RegistrarReview from './pages/RegistrarReview'
import CertificateIssuance from './pages/CertificateIssuance'
import { ApplicantProvider } from './context/ApplicantContext'
import ApplicantLogin from './pages/applicant/ApplicantLogin'
import ApplicantDashboard from './pages/applicant/ApplicantDashboard'
import SubmitApplication from './pages/applicant/SubmitApplication'
import TrackApplication from './pages/applicant/TrackApplication'
import UploadDocuments from './pages/applicant/UploadDocuments'
import SubmitObjection from './pages/applicant/SubmitObjection'
import ApplicantProfile from './pages/applicant/ApplicantProfile'
import SurveyorTaskList from './pages/surveyor/SurveyorTaskList'
import SurveyorTaskExecution from './pages/surveyor/SurveyorTaskExecution'
import LiveMap from './pages/surveyor/LiveMap'
import AnalyticsDashboard from './pages/surveyor/AnalyticsDashboard'

function ApplicantRoot() {
  return (
    <ApplicantProvider>
      <Outlet />
    </ApplicantProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login / role selection */}
        <Route path="/"                    element={<Login />} />

        {/* Staff console */}
        <Route path="/dashboard"           element={<StaffDashboard />} />
        <Route path="/applications"        element={<ApplicationManagement />} />
        <Route path="/applications/:id"    element={<ApplicationDetails />} />
        <Route path="/review/:id"          element={<RegistrarReview />} />
        <Route path="/certificates"        element={<CertificateIssuance />} />
        <Route path="/register" element={
          <div className="max-w-3xl mx-auto px-6 py-8">
            <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
            <RegisterApplicant />
          </div>
        } />

        {/* Applicant portal */}
        <Route path="/applicant" element={<ApplicantRoot />}>
          <Route path="login"     element={<ApplicantLogin />} />
          <Route index            element={<ApplicantDashboard />} />
          <Route path="submit"    element={<SubmitApplication />} />
          <Route path="track"     element={<TrackApplication />} />
          <Route path="track/:id" element={<TrackApplication />} />
          <Route path="upload"    element={<UploadDocuments />} />
          <Route path="objection" element={<SubmitObjection />} />
          <Route path="profile"   element={<ApplicantProfile />} />
        </Route>

        {/* Surveyor panel */}
        <Route path="/surveyor" element={<SurveyorTaskList />} />
        <Route path="/surveyor/task/:applicationId" element={<SurveyorTaskExecution />} />
        <Route path="/surveyor/map" element={<LiveMap />} />
        <Route path="/surveyor/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
