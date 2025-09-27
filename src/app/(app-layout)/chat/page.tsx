import ChatContainer from '@/components/layout/chat-container'
import { AppSidebar } from "@/components/layout/sidebar"
import React from 'react'

export default function Page() {
  return (
    <>
        <AppSidebar />
        <div className='flex-1 flex flex-col pr-3 pb-3 pl-1'>
            <div className='w-full h-full rounded-lg overflow-hidden dark bg-card border border-white/10'>
                <ChatContainer />
            </div>
        </div>
    </>
  )
}
