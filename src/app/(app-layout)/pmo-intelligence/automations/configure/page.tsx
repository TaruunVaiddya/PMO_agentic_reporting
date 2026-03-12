"use client"

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sparkles,
    Send,
    X,
    Eye,
    PieChart,
    BarChart3,
    AlertTriangle,
    Check,
    Paperclip,
    Upload,
    Settings2,
    Clock,
    Users
} from 'lucide-react'

export default function AutomationConfigurePage() {
    const router = useRouter()
    const [aiInput, setAiInput] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden font-sans">
            {/* Main Content Split View */}
            <main className="flex-1 flex gap-4 px-6 py-4 overflow-hidden">
                
                {/* Left Panel: Full Height Layout */}
                <div className="w-[400px] flex flex-col gap-4 h-full">
                    
                    {/* 1. AI Assistant - Spans Available Height */}
                    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#1a2456]" />
                                <h3 className="font-bold text-sm text-slate-700">AI Assistant</h3>
                            </div>
                            <button 
                                onClick={handleUploadClick}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1a2456] hover:bg-slate-50 px-2 py-1 rounded transition-colors"
                            >
                                <Upload className="h-3 w-3" />
                                Import Template
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" />
                        </div>
                        
                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            <div className="flex flex-col items-end">
                                <div className="bg-[#1a2456] text-white text-xs p-3 rounded-md rounded-tr-none max-w-[85%] font-medium shadow-sm">
                                    Schedule a monthly portfolio health report for the leadership team.
                                </div>
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="bg-slate-50 text-slate-800 text-xs p-3 rounded-md rounded-tl-none max-w-[85%] border border-slate-200 font-medium leading-relaxed">
                                    Understood. I've drafted the schedule for the first Monday of every month. I can also include the Budget Variance and Resource Utilization charts. Would you like to proceed?
                                </div>
                            </div>
                        </div>

                        {/* AI Input Area */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <div className="relative bg-white rounded-md border border-slate-200 focus-within:border-[#1a2456] transition-all">
                                <textarea
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    className="w-full text-xs p-3 pr-10 bg-transparent resize-none h-20 outline-none font-medium"
                                    placeholder="Instruct AI to modify logic or format..."
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                    <button onClick={handleUploadClick} className="p-1.5 text-slate-400 hover:text-[#1a2456] transition-colors">
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <button className="p-1.5 bg-[#1a2456] text-white rounded-sm hover:bg-[#1a2456]/90 transition-colors">
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Automation Logic - Enhanced flexibility */}
                    <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 className="h-4 w-4 text-[#1a2456]" />
                            <h3 className="font-bold text-sm text-slate-700">Core Parameters</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Job Identity</label>
                                <input
                                    className="w-full text-xs border-slate-200 rounded-md focus:border-[#1a2456] font-semibold p-2 outline-none border bg-white"
                                    type="text"
                                    defaultValue="Monthly Portfolio Health Summary"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Cadence</label>
                                    <select className="w-full text-xs border-slate-200 rounded-md font-semibold p-2 outline-none border cursor-pointer bg-white">
                                        <option>Monthly</option>
                                        <option>Weekly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Day of Execution</label>
                                    <select className="w-full text-xs border-slate-200 rounded-md font-semibold p-2 outline-none border cursor-pointer bg-white">
                                        <option>1st Monday</option>
                                        <option>15th of Month</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Distribution Time
                                    </label>
                                    <input 
                                        type="time" 
                                        defaultValue="09:00"
                                        className="w-full text-xs border-slate-200 rounded-md font-semibold p-2 outline-none border bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Notification CC <span className="text-[8px] font-medium text-slate-400 ml-auto">(Optional)</span>
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Project Managers"
                                        className="w-full text-xs border-slate-200 rounded-md font-semibold p-2 outline-none border bg-white placeholder:font-normal placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1a2456]" defaultChecked />
                                    <span className="text-[11px] text-slate-600 font-bold">Attach PDF export to automated email</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Live Draft Preview */}
                <div className="flex-1 flex flex-col bg-slate-200 rounded-md border border-slate-300 overflow-hidden shadow-inner">
                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-300">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5" />
                            Live Synthesis Preview
                        </span>
                        <div className="flex gap-1">
                            <div className="size-1.5 rounded-full bg-slate-300"></div>
                            <div className="size-1.5 rounded-full bg-slate-400"></div>
                        </div>
                    </div>
                    
                    {/* Report Canvas */}
                    <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#ecedf0] custom-scrollbar">
                        <div className="bg-white w-full max-w-[760px] shadow-xl rounded-sm border border-slate-300 p-10 flex flex-col text-slate-900 h-fit">
                            <div className="flex justify-between items-end border-b-[3px] border-[#1a2456] pb-4 mb-6">
                                <div>
                                    <h1 className="text-xl font-black text-[#1a2456] leading-none tracking-tight">Portfolio Performance Summary</h1>
                                    <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-wider">Strategic Governance Unit • Jan 2026</p>
                                </div>
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-sm text-[9px] font-black border border-green-200">
                                    Nominal Status
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {[
                                    { label: 'Project Count', val: '24', detail: '3 New Additions' },
                                    { label: 'Budget Utilization', val: '68.2%', detail: 'Within ±5% Margin' },
                                    { label: 'Risk Exposure', val: 'Low', detail: '2 Active Mitigations' }
                                ].map((item, idx) => (
                                    <div key={idx} className="border-l-2 border-slate-100 pl-3">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                                        <div className="text-xl font-black text-[#1a2456]">{item.val}</div>
                                        <div className="text-[9px] text-slate-500 font-medium mt-1">{item.detail}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h2 className="text-[11px] font-black text-[#1a2456] mb-3 border-b border-slate-100 pb-1">Executive Summary</h2>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        The current portfolio remains aligned with strategic objectives. Budget burn is trending slightly lower than projected for Q1, primarily due to delayed procurement in the Cloud Migration track.
                                    </p>
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="h-36 bg-slate-50 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                        <PieChart className="h-6 w-6 text-slate-300 mb-2" />
                                        <span className="text-[9px] text-slate-400 font-bold tracking-widest">Allocation Distribution</span>
                                    </div>
                                    <div className="h-36 bg-slate-50 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-slate-300 mb-2" />
                                        <span className="text-[9px] text-slate-400 font-bold tracking-widest">Variance Analysis</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center opacity-50">
                                <div className="flex items-center gap-2">
                                    <div className="size-4 bg-[#1a2456] rounded-sm"></div>
                                    <span className="text-[8px] font-black text-slate-400 tracking-[0.2em]">Corporate Intelligence Engine</span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400">Confidential</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}