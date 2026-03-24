"use client"

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import generateUniqueId from '@/lib/get_unique_id'
import { Loader2 } from 'lucide-react'

function DecisionIntelligenceLauncher() {
  const router = useRouter()
  const launchedRef = useRef(false)

  useEffect(() => {
    if (launchedRef.current) return
    launchedRef.current = true

    const sessionId = generateUniqueId()
    router.push(`/pmo-intelligence/decision-intelligence/${sessionId}?chat=new`)
  }, [router])

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f8f9fa]">
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[#1a2456]" />
        <span className="text-sm font-medium text-slate-600">Opening Decision Hub...</span>
      </div>
    </div>
  )
}

export default function DecisionIntelligencePage() {
  return <DecisionIntelligenceLauncher />
}
