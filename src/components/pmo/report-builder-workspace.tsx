"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useChatHandler } from '@/hooks/use-chat-handler'
import { ChevronRight, FileText, Layers, Maximize2, Sparkles, Wand2, BarChart3, DollarSign } from 'lucide-react'

export function ReportBuilderWorkspace() {
  const [prompt, setPrompt] = useState('')
  const { handleStartChat } = useChatHandler()

  const handleStart = () => {
    const text = prompt.trim() || 'Generate a new report summary'
    handleStartChat({ text }, '/pmo-intelligence/report-builder')
  }

  return (
    <div className="bg-[#f8f9fa] text-slate-900 w-full overflow-hidden flex flex-col font-sans">
      <div className="flex flex-col flex-1 px-6 py-4 gap-4 max-w-[1600px] mx-auto w-full min-h-0">
        <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#1a2456]">
                <Sparkles className="h-5 w-5" />
                <h1 className="text-base font-bold">Conversational Report Engine</h1>
              </div>
              <p className="text-slate-400 text-xs">Automated document synthesis and executive formatting.</p>
            </div>
            <Link href="/pmo-intelligence/report-builder">
              <button className="text-[#1a2456] text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-100 transition-all">
                <Maximize2 className="h-3.5 w-3.5" /> Full Screen Editor
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
            <div className="md:col-span-4 flex flex-col gap-3 bg-slate-50 p-4 rounded-md border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-3 w-3 text-[#1a2456]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available Data Streams</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Live Portfolio Metrics', source: 'PPM Tool' },
                  { label: 'Financial GL Feed', source: 'ERP' },
                  { label: 'Strategic Roadmap', source: 'Foresight Hub' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between bg-white p-2 rounded-sm border border-slate-200 text-[10px] group cursor-pointer hover:border-[#1a2456]/30">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="text-slate-400 font-medium group-hover:text-[#1a2456]">{item.source}</span>
                  </div>
                ))}
              </div>

              <div className="relative bg-white border border-slate-200 rounded-md p-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium placeholder-slate-400 resize-none h-20 outline-none"
                  placeholder='Prompt the report engine (e.g. "Summarize Q1 steering committee updates")'
                />
                <button
                  onClick={handleStart}
                  className="mt-2 w-full bg-[#1a2456] text-white py-2 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-[#1a2456]/10 transition-all"
                >
                  <Wand2 className="h-4 w-4" />
                  Start Building Report
                </button>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                {
                  title: 'Executive SteerCo',
                  desc: 'High-level KPIs and critical escalations.',
                  icon: BarChart3,
                  pages: '12 Slides'
                },
                {
                  title: 'Financial Variance',
                  desc: 'Deep-dive into budget burn and leakage.',
                  icon: DollarSign,
                  pages: '5 Sections'
                },
                {
                  title: 'Strategic Brief',
                  desc: 'Alignment with long-term program goals.',
                  icon: FileText,
                  pages: '4 Pages'
                }
              ].map((template) => (
                <button
                  key={template.title}
                  onClick={handleStart}
                  className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3 hover:border-[#1a2456] hover:shadow-md transition-all text-left"
                >
                  <div className="p-2 bg-slate-50 rounded-md w-fit text-slate-400">
                    <template.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">{template.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{template.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{template.pages}</span>
                    <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-[#1a2456]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
