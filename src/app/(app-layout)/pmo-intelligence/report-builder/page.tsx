"use client"

import React, { useEffect, useRef } from 'react'
import { ChatStoreProvider } from '@/contexts/chat-provider'
import { useChatHandler } from '@/hooks/use-chat-handler'
import { Loader2 } from 'lucide-react'

function ReportBuilderLauncher() {
  const { handleStartChat } = useChatHandler()
  const launchedRef = useRef(false)

  useEffect(() => {
    if (launchedRef.current) return
    launchedRef.current = true

    handleStartChat(
      { text: 'Generate a new report summary' },
      '/pmo-intelligence/report-builder'
    )
  }, [handleStartChat])

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f8f9fa]">
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[#1a2456]" />
        <span className="text-sm font-medium text-slate-600">Launching Report Engine...</span>
      </div>
    </div>
  )
}

export default function ReportBuilderPage() {
  return (
    <ChatStoreProvider>
      <ReportBuilderLauncher />
    </ChatStoreProvider>
  )
}
