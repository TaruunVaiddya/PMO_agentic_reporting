import Topbar from '@/components/layout/topbar'
import React from 'react'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'
import { SessionProvider } from '@/contexts/session-context'


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SessionProvider>
        <div className=' w-full h-full flex flex-row'>
          <SidebarWrapper />
          <div className='w-full h-full min-h-screen max-h-screen overflow-hidden bg-background flex flex-col  '>
            <div className='w-full h-fit flex-shrink-0'>
              <Topbar />
            </div>
            <div className='flex-1 w-full h-full flex flex-row overflow-hidden bg-gray-50'>
              {children}
            </div>
          </div>
        </div>
      </SessionProvider>
    </SidebarProvider>

  )
}
