import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { getStaff } from '../context/staffSession'

export default function AppShell({ title, subtitle, children }) {
  const navigate = useNavigate()
  const staff = getStaff()

  useEffect(() => {
    if (!staff) navigate('/staff/login', { replace: true })
  }, [staff, navigate])

  if (!staff) return null

  return (
    <div className="flex min-h-screen bg-[#f4f6f5]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 p-[30px] pb-[50px]">
          {children}
        </main>
      </div>
    </div>
  )
}
