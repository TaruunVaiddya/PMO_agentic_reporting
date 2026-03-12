"use client"

import React, { useState } from 'react'
import {
    BrainCircuit,
    Megaphone,
    Brain,
    Mic,
    Paperclip,
    Send,
    Sparkles,
    Maximize2,
    BarChart3,
    Table,
    Clock,
    CalendarCheck,
    CheckCircle2,
    FileText,
    FilePlus,
    Layers,
    Activity,
    DollarSign,
    ChevronRight,
    Wand2
} from 'lucide-react'
import Link from 'next/link'
import { useChatHandler } from '@/hooks/use-chat-handler'
import { ChatStoreProvider } from '@/contexts/chat-provider'
import { DecisionIntelligenceHistory } from '@/components/chat/decision-intelligence-history'

export default function PMOIntelligencePage() {
    return (
        <ChatStoreProvider>
            <PMOIntelligenceContent />
        </ChatStoreProvider>
    )
}

function PMOIntelligenceContent() {
    const [prompt, setPrompt] = useState('')
    const { handleStartChat, handleSuggestionClick } = useChatHandler()

    const handleAnalyze = () => {
        if (!prompt.trim()) return;
        handleStartChat({ text: prompt });
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAnalyze();
        }
    }

    return (
        <div className="bg-[#f8f9fa] text-slate-900 w-full overflow-hidden flex flex-col font-sans">
            <div className="flex flex-col flex-1 px-6 py-4 gap-4 max-w-[1600px] mx-auto w-full min-h-0">

                {/* Executive Feed Marquee */}
                <div className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-md shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#1a2456]/5 text-[#1a2456] rounded-md">
                        <Megaphone className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Executive Feed</span>
                    </div>
                    <div className="flex-1 flex gap-8 overflow-x-auto custom-scrollbar whitespace-nowrap text-[11px] font-semibold">
                        <div className="flex items-center gap-2 text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Project Alpha milestone completed 2 days ahead of schedule.
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            Resource bottleneck detected in IT Operations for October.
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            Budget variance of +12% flagged for Marketing Portfolio.
                        </div>
                    </div>
                </div>

                {/* Main Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

                    {/* Left Column */}
                    <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">

                        {/* Decision Intelligence */}
                        <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[#1a2456]">
                                        <Brain className="h-5 w-5" />
                                        <h3 className="text-base font-bold">Decision Intelligence</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs">Query enterprise data using natural language.</p>
                                </div>
                                <DecisionIntelligenceHistory />
                            </div>

                            <div className="relative group">
                                <div className="relative flex flex-col bg-slate-50 border border-slate-200 rounded-md p-3 gap-3">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-slate-400 resize-none h-14 outline-none"
                                        placeholder="Which projects are most at risk this quarter?"
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2 text-slate-400">
                                            <Mic className="h-4 w-4 cursor-pointer hover:text-[#1a2456]" />
                                            <Paperclip className="h-4 w-4 cursor-pointer hover:text-[#1a2456]" />
                                        </div>
                                        <button
                                            onClick={handleAnalyze}
                                            className="bg-[#1a2456] text-white px-5 py-1.5 rounded-sm font-bold text-[11px] flex items-center gap-2 shadow-sm"
                                        >
                                            Run Analysis <Send className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Conversational Report Engine - Redesigned to feel like a "Composer" */}
                        {/* Conversational Report Engine - Enhanced with Templates and CTA */}
                        <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col gap-4 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[#1a2456]">
                                        <Sparkles className="h-5 w-5" />
                                        <h3 className="text-base font-bold">Conversational Report Engine</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs">Automated document synthesis and executive formatting.</p>
                                </div>
                                <Link href="/pmo-intelligence/report-editor">
                                    <button className="text-[#1a2456] text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-100 transition-all">
                                        <Maximize2 className="h-3.5 w-3.5" /> Full Screen Editor
                                    </button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
                                {/* Left: Synthesis Controls */}
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
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-2 rounded-sm border border-slate-200 text-[10px] group cursor-pointer hover:border-[#1a2456]/30">
                                                <span className="font-bold text-slate-700">{item.label}</span>
                                                <span className="text-slate-400 font-medium group-hover:text-[#1a2456]">{item.source}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleStartChat({ text: 'Generate a new report summary' }, '/pmo-intelligence/report-builder')}
                                        className="mt-auto w-full bg-[#1a2456] text-white py-3 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-[#1a2456]/10 transition-all"
                                    >
                                        <Wand2 className="h-4 w-4" />
                                        Start Building Report
                                    </button>
                                </div>

                                {/* Right: Template Archetypes */}
                                <div className="md:col-span-8 grid grid-cols-3 gap-3">
                                    {[
                                        {
                                            title: 'Executive SteerCo',
                                            desc: 'High-level KPIs and critical escalations.',
                                            icon: <BarChart3 className="h-5 w-5" />,
                                            pages: '12 Slides'
                                        },
                                        {
                                            title: 'Financial Variance',
                                            desc: 'Deep-dive into budget burn and leakage.',
                                            icon: <DollarSign className="h-5 w-5" />,
                                            pages: '5 Sections'
                                        },
                                        {
                                            title: 'Strategic Brief',
                                            desc: 'Alignment with long-term program goals.',
                                            icon: <FileText className="h-5 w-5" />,
                                            pages: '4 Pages'
                                        }
                                    ].map((template, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleStartChat({ text: `Build an ${template.title} report: ${template.desc}` }, '/pmo-intelligence/report-builder')}
                                            className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3 hover:border-[#1a2456] hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="p-2 bg-slate-50 rounded-md w-fit text-slate-400 group-hover:text-[#1a2456] group-hover:bg-[#1a2456]/5 transition-colors">
                                                {template.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800 mb-1">{template.title}</h4>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">{template.desc}</p>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{template.pages}</span>
                                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-[#1a2456]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>



                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">

                        {/* Scheduled Automations */}
                        <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col h-[45%]">
                            <div className="flex items-center gap-2 text-[#1a2456] mb-4">
                                <Clock className="h-5 w-5" />
                                <h3 className="text-base font-bold">Scheduled Automations</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                {[
                                    { title: 'Weekly Health Summary', recipient: 'Executive Board', time: 'Tomorrow 09:00', status: 'Ready' },
                                    { title: 'Monthly Risk Digest', recipient: 'CEO & COO', time: 'Mon 17:00', status: 'Syncing' }
                                ].map((task, i) => (
                                    <div key={i} className="p-3 rounded-md border border-slate-100 hover:border-[#1a2456]/20 transition-all flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{task.title}</p>
                                            <p className="text-[10px] text-slate-500">{task.recipient}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm block mb-1">{task.status}</span>
                                            <p className="text-[9px] text-slate-400 font-medium">{task.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/pmo-intelligence/automations" className="mt-4">
                                <button className="w-full py-2 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-sm hover:bg-slate-50">
                                    Manage All Tasks
                                </button>
                            </Link>
                        </section>

                        {/* Meeting Prep AI - Redesigned as a Workspace */}
                        <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col flex-1">
                            <div className="flex items-center gap-2 text-[#1a2456] mb-4">
                                <CalendarCheck className="h-5 w-5" />
                                <h3 className="text-base font-bold">Meeting Prep Workspace</h3>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                <div className="p-4 bg-slate-50 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[#1a2456]/5 hover:border-[#1a2456]/30 transition-all">
                                    <FilePlus className="h-6 w-6 text-slate-300 group-hover:text-[#1a2456] mb-2" />
                                    <p className="text-xs font-bold text-slate-500 group-hover:text-[#1a2456]">Start New Meeting Brief</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Connect calendar or upload agenda</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                        <Layers className="h-3 w-3" /> Recent Preparations
                                    </div>
                                    <div className="space-y-2">
                                        <div className="p-3 bg-white border border-slate-100 rounded-md shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-xs font-bold text-slate-800">Draft: Steering Committee Brief</p>
                                                <span className="text-[9px] font-black text-amber-600 px-1.5 py-0.5 bg-amber-50 rounded-sm uppercase">In Progress</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Talking Points
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Risk Map
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Link href="/pmo-intelligence/meeting-prep" className="mt-auto">
                                    <button className="w-full bg-[#1a2456] text-white py-2.5 rounded-sm font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 shadow-sm">
                                        <FileText className="h-4 w-4" /> Go to Prep Dashboard
                                    </button>
                                </Link>
                            </div>
                        </section>

                    </div>
                </div>

            </div>
        </div>
    )
}