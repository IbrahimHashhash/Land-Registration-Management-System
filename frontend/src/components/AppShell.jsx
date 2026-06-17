import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ title, subtitle, children }) {
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
