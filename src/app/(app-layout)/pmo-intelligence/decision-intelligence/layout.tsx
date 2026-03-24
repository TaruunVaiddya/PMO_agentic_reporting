"use client";

import React from 'react'
import { ChatStoreProvider } from '@/contexts/chat-provider'

export default function DecisionIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col p-2 bg-[#f5f5f5]">
      <div className="w-full h-full overflow-hidden relative">
        <ChatStoreProvider>
          {children}
        </ChatStoreProvider>
      </div>
    </div>
  )
}
