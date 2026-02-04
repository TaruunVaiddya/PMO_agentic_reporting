"use client";

import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'
import { ChatStoreProvider } from '@/contexts/chat-provider';
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SessionProvider } from '@/contexts/session-context'
import React from 'react'
import { SidebarToggle } from '@/components/layout/sidebar-toggle'

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarWrapper />
      <div className='flex-1 flex flex-col pr-3 pb-3 pl-1'>
        <div className='w-full h-full rounded-lg overflow-hidden dark bg-card border border-white/10 relative'>
          <div className='flex items-start absolute top-2 left-2'>
            <SidebarToggle />
          </div>
          <ChatStoreProvider>
            {children}
          </ChatStoreProvider>
        </div>
      </div>
    </>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SessionProvider>
        <ChatLayoutContent>{children}</ChatLayoutContent>
      </SessionProvider>
    </SidebarProvider>
  )
}

