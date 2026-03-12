"use client"

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Settings,
    ChevronDown,
    Sparkles,
    BarChart3,
    RotateCcw,
    Presentation,
    Wand2,
    FileText,
    MessageSquare,
    AlertTriangle,
    CheckSquare,
    LayoutDashboard,
    DollarSign,
    LinkIcon,
    Rocket,
    Info,
    CheckCircle2,
    Upload,
    FileUp
} from 'lucide-react'

export default function MeetingPrepPage() {
    const router = useRouter()
    const [refineInput, setRefineInput] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex-1 flex flex-col bg-[#f8f9fa] h-screen overflow-hidden font-sans">
            <main className="flex-1 overflow-hidden flex gap-4 px-6 py-4">

                {/* Left Sidebar: Configuration */}
                <aside className="w-[300px] flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar scrollbar-hover flex-shrink-0">
                    <div className="bg-white rounded-md p-4 border border-slate-200 shadow-sm">
                        <h3 className="text-[#1a2456] font-bold text-sm mb-4 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Meeting Configuration
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Portfolio / Program</label>
                                <div className="relative group">
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-2.5 text-xs font-semibold appearance-none outline-none focus:border-[#1a2456] transition-all cursor-pointer">
                                        <option>Digital Transformation Program</option>
                                        <option>Infrastructure Modernization</option>
                                        <option>Cloud Migration</option>
                                    </select>
                                    <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-bold text-slate-500">Data Sources</label>
                                    <button 
                                        onClick={handleUploadClick}
                                        className="text-[9px] font-bold text-[#1a2456] flex items-center gap-1 hover:underline"
                                    >
                                        <Upload className="h-2.5 w-2.5" /> Upload
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {['Status Reports', 'Risk Register', 'Budget Reports'].map((src) => (
                                        <span key={src} className="px-2 py-0.5 bg-[#1a2456]/5 text-[#1a2456] text-[9px] font-bold rounded-sm border border-[#1a2456]/10">
                                            {src}
                                        </span>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleUploadClick}
                                    className="w-full border-2 border-dashed border-slate-200 rounded-md p-2 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
                                >
                                    <FileUp className="h-4 w-4 text-slate-400 group-hover:text-[#1a2456] mb-1" />
                                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-[#1a2456]">Upload Report or Document</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Focus Areas</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Risks', 'Budget', 'Delays', 'Strategy'].map((area) => (
                                        <label key={area} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-sm border border-slate-100 cursor-pointer hover:bg-[#1a2456]/5 transition-colors group">
                                            <input
                                                type="checkbox"
                                                defaultChecked={area !== 'Strategy'}
                                                className="h-3 w-3 rounded-sm border-slate-300 accent-[#1a2456]"
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#1a2456]">{area}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Context & Details</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-2.5 text-xs font-medium focus:border-[#1a2456] outline-none resize-none h-24 transition-all"
                                    placeholder="e.g., Focus on APAC launch risks..."
                                />
                            </div>

                            <button className="w-full bg-[#1a2456] text-white text-xs font-bold py-2.5 rounded-md flex items-center justify-center gap-2 hover:bg-[#1a2456]/90 transition-all shadow-sm">
                                <Sparkles className="h-3.5 w-3.5" />
                                Generate Meeting Brief
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1a2456]/5 rounded-md p-4 border border-[#1a2456]/10">
                        <div className="flex items-center gap-2 text-[#1a2456] mb-1.5 font-bold text-[10px]">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Brief Metadata
                        </div>
                        <p className="text-slate-600 text-[10px] leading-relaxed font-medium">
                            14 project reports and 1 consolidated risk register detected as primary inputs.
                        </p>
                    </div>
                </aside>

                {/* Right Panel: Generated Brief */}
                <section className="flex-1 flex flex-col bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden min-w-0">
                    <div className="bg-white border-b border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-[#1a2456]/5 rounded-md border border-[#1a2456]/10">
                                <Sparkles className="h-4 w-4 text-[#1a2456]" />
                            </div>
                            <div>
                                <h2 className="text-[#1a2456] font-bold text-base leading-none tracking-tight">Generated Brief</h2>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Updated 2m ago</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100">
                                <RotateCcw className="h-3.5 w-3.5 text-[#1a2456]" />
                                Regenerate
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2456] text-white rounded-md text-[10px] font-bold hover:opacity-90">
                                <Presentation className="h-3.5 w-3.5" />
                                Generate Deck
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/20">
                        <div className="max-w-[900px] mx-auto space-y-6">

                            {/* AI Refinement Input */}
                            <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                                <div className="flex gap-2">
                                    <input
                                        value={refineInput}
                                        onChange={(e) => setRefineInput(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 text-xs font-medium outline-none focus:border-[#1a2456]"
                                        placeholder='Refine brief (e.g., "Deep dive into Zurich deployment risks")'
                                        type="text"
                                    />
                                    <button className="px-4 py-1.5 bg-[#1a2456] text-white text-[10px] font-bold rounded-md flex items-center gap-1.5">
                                        <Wand2 className="h-3.5 w-3.5" />
                                        Refine
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8 pb-8">
                                {/* Section 1: Executive Summary */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-4 w-4 text-[#1a2456]" />
                                        <h3 className="text-lg font-bold text-[#1a2456] tracking-tight border-b border-slate-100 flex-1 pb-1">Executive Summary</h3>
                                    </div>
                                    <p className="text-slate-700 text-xs leading-relaxed font-medium pl-6">
                                        The Digital Transformation Program is currently on track for its 2024 milestones. While efficiency gains in Phase 3 are notable (15%), the program faces localized supply chain constraints in EMEA. Financials remain within acceptable variance.
                                    </p>
                                </section>

                                {/* Section 2: Talking Points */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="h-4 w-4 text-[#1a2456]" />
                                        <h3 className="text-lg font-bold text-[#1a2456] tracking-tight border-b border-slate-100 flex-1 pb-1">Key Talking Points</h3>
                                    </div>
                                    <ul className="space-y-2.5 pl-6">
                                        {[
                                            "Phase 3 migration efficiency is 15% better than projected.",
                                            "Zurich data center deployment delayed by 2 weeks due to EMEA supply disrupts.",
                                            "Roadmap 2024 alignment workshop scheduled for steering committee approval."
                                        ].map((point, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <div className="h-1.5 w-1.5 rounded-full bg-[#1a2456] mt-1.5 flex-shrink-0" />
                                                <p className="text-xs font-semibold text-slate-700 leading-snug">{point}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                {/* Section 3: Risks */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="h-4 w-4 text-[#1a2456]" />
                                        <h3 className="text-lg font-bold text-[#1a2456] tracking-tight border-b border-slate-100 flex-1 pb-1">Critical Risks</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                        <div className="p-3 rounded-md border-l-4 border-l-red-500 bg-red-50/50 border border-slate-100">
                                            <h4 className="font-bold text-xs text-red-900 mb-1">Cybersecurity Compliance</h4>
                                            <p className="text-[10px] font-medium text-red-800 leading-relaxed">Action required by Legal by Fri for Project Alpha.</p>
                                        </div>
                                        <div className="p-3 rounded-md border-l-4 border-l-amber-500 bg-amber-50/50 border border-slate-100">
                                            <h4 className="font-bold text-xs text-amber-900 mb-1">Resource Availability</h4>
                                            <p className="text-[10px] font-medium text-amber-800 leading-relaxed">Lead architect leave during Q4 deployment window.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: Health Snapshot */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <LayoutDashboard className="h-4 w-4 text-[#1a2456]" />
                                        <h3 className="text-lg font-bold text-[#1a2456] tracking-tight border-b border-slate-100 flex-1 pb-1">Health Snapshot</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 pl-6">
                                        {[
                                            { label: 'On Track', val: '85%', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
                                            { label: 'At Risk', val: '10%', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                                            { label: 'Delayed', val: '5%', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} ${stat.text} ${stat.border} border p-3 rounded-md text-center`}>
                                                <div className="text-xl font-black">{stat.val}</div>
                                                <div className="text-[9px] font-bold opacity-80 uppercase tracking-wider">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Brief Footer */}
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px]">
                            <Info className="h-3.5 w-3.5" />
                            <span>AI-Augmented content. Please verify before steering.</span>
                        </div>
                        <div className="flex gap-4">
                            <button className="text-[10px] font-bold text-slate-400 hover:text-[#1a2456] transition-colors">Feedback</button>
                            <button className="text-[10px] font-bold text-slate-400 hover:text-[#1a2456] transition-colors">View Source Data</button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}