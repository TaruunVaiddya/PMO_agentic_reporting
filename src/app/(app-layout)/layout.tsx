import Topbar from '@/components/layout/topbar'
import React from 'react'
import { SidebarProvider } from '@/contexts/sidebar-context'


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className='w-full h-full min-h-screen max-h-screen overflow-hidden dark bg-background flex flex-col  '>
        <div className='w-full h-fit flex-shrink-0'>
          <Topbar />
        </div>
        <div className='flex-1 w-full flex flex-row overflow-hidden'>
          {/* Sidebar toggle button - outside the sidebar */}


          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
