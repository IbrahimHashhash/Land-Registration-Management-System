import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import RegisterApplicant from './pages/RegisterApplicant'
import ApplicantProfile from './pages/ApplicantProfile'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-4 text-sm font-medium text-gray-600">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <Link to="/register" className="hover:text-blue-600">Register</Link>
        <Link to="/profile" className="hover:text-blue-600">Profile</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1 className="p-6 text-2xl font-bold">LRMIS Applicant Portal</h1>} />
        <Route path="/register" element={<RegisterApplicant />} />
        <Route path="/profile" element={<ApplicantProfile />} />
      </Routes>
    </BrowserRouter>
  )
}
