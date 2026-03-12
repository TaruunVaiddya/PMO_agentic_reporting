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

      <div className='flex-1 flex flex-col p-2 bg-[#f5f5f5]'>
        <div className='w-full h-full overflow-hidden relative'>
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
    <ChatLayoutContent>{children}</ChatLayoutContent>
  )
}

