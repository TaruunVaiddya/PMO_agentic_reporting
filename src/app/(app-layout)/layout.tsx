import Topbar from '@/components/layout/topbar'
import React from 'react'

export default function AppLayout({children}: {children: React.ReactNode}) {
  return (
    <div className='w-full h-full min-h-screen max-h-screen overflow-hidden dark bg-background flex flex-col  '>
      <div className='w-full h-12 flex-shrink-0'>
        <Topbar />
      </div>
      <div className='flex-1 w-full flex flex-row overflow-hidden'>
          {children}
      </div>
    </div>
  )
}
