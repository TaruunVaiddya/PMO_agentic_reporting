"use client"

import { useRouter } from 'next/navigation'
import { ChevronRight, Layers, Plus, Settings } from 'lucide-react'

const settingsActions = [
  {
    title: 'Generate Report',
    description: 'Open the report wizard and start a new report session.',
    icon: Plus,
    href: '/chat',
  },
  {
    title: 'Configure Report Templates',
    description: 'Browse, manage, and upload report templates.',
    icon: Layers,
    href: '/report-templates',
  },
]

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f6f7fb]">
      <div className="max-w-5xl mx-auto px-6 py-8 lg:py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a2456]/5 text-[#1a2456] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Quick actions
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Use these shortcuts to jump straight into report creation or template management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsActions.map((item) => (
            <button
              key={item.title}
              onClick={() => router.push(item.href)}
              className="group text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#1a2456]/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-[#1a2456]/5 text-[#1a2456] p-3 group-hover:bg-[#1a2456] group-hover:text-white transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#1a2456] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
