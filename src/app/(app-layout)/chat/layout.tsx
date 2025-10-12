"use client";

import { AppSidebar } from '@/components/layout/sidebar'
import { SidebarToggle } from '@/components/layout/sidebar-toggle'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import React from 'react'

function ChatLayoutContent({children}: {children: React.ReactNode}) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <>
      <AppSidebar isCollapsed={isCollapsed} />
      <div className='flex-1 flex flex-col p-3 pl-1'>
        <div className='w-full h-full rounded-lg overflow-hidden dark bg-card border border-white/10 relative'>
          {/* Sidebar Toggle Button - Positioned absolutely to avoid re-renders */}
          <SidebarToggle
            isCollapsed={isCollapsed}
            onToggle={toggle}
            className="absolute top-3 left-3 z-10"
          />
          {children}
        </div>
      </div>
    </>
  );
}

export default function ChatLayout({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </SidebarProvider>
  )
}
