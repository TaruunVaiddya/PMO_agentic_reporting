"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wand2,
    Plus,
    Filter,
    Search,
    Calendar,
    AlertTriangle,
    BarChart3,
    MoreVertical,
    Zap,
    Bell,
    Grid,
    Clock,
    History
} from 'lucide-react'

export default function ScheduledAutomationsPage() {
    const router = useRouter()
    const [command, setCommand] = useState('')

    const handleGenerate = () => {
        router.push('/pmo-intelligence/automations/configure')
    }

    return (
        <div className="flex-1 flex flex-col bg-[#f6f6f8] overflow-hidden uppercase-tracking-tight">

            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hover">
                {/* Command Bar Section */}
                <section className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 group transition-all focus-within:ring-2 focus-within:ring-[#1a2456]/10 focus-within:border-[#1a2456]/30">
                            <div className="pl-4 text-[#1a2456]">
                                <Wand2 className="h-6 w-6" />
                            </div>
                            <input
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                className="flex-1 border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 bg-transparent py-4 text-lg font-medium outline-none"
                                placeholder="Describe an automation to create it... (e.g., 'Remind PMs every Friday at 3 PM to update status')"
                                type="text"
                            />
                            <button
                                onClick={handleGenerate}
                                className="bg-slate-100 hover:bg-slate-200 text-[#1a2456] px-6 py-3 rounded-md font-bold text-sm transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 px-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested:</span>
                            <button className="text-xs font-medium text-slate-600 hover:text-[#1a2456] transition-colors">"Daily digest of blocked tasks"</button>
                            <span className="text-slate-300">•</span>
                            <button className="text-xs font-medium text-slate-600 hover:text-[#1a2456] transition-colors">"Alert team if budget exceeds 90%"</button>
                        </div>
                    </div>
                </section>

                {/* Content Body */}
                <section className="px-8 pb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">My Automations</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                className="flex items-center gap-2 bg-[#1a2456] hover:bg-[#1a2456]/90 text-white px-4 py-2 rounded-md text-sm font-bold transition-all shadow-lg shadow-[#1a2456]/20 mr-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Create New</span>
                            </button>
                            <button className="p-2 text-slate-500 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
                                <Filter className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-slate-500 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all">
                                <Search className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Automation List */}
                    <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Automation Title</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Frequency</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Run</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {/* Row 1 */}
                                    <tr className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <span className="font-semibold text-sm text-slate-900">Friday PM Status Update</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">Reminder</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">Weekly (Fri, 3 PM)</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">2 days ago</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                <span className="text-sm font-semibold text-slate-700">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-[#1a2456] transition-colors">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 2 */}
                                    <tr className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                                                    <AlertTriangle className="h-5 w-5" />
                                                </div>
                                                <span className="font-semibold text-sm text-slate-900">Over-budget Slack Alert</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Alert</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">On Trigger</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">Today, 9:15 AM</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                <span className="text-sm font-semibold text-slate-700">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-[#1a2456] transition-colors">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Row 3 */}
                                    <tr className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200">
                                                    <BarChart3 className="h-5 w-5" />
                                                </div>
                                                <span className="font-semibold text-sm text-slate-900">Monthly Stakeholder Report</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">Report</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">Monthly (1st)</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">Nov 1, 2023</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                                                <span className="text-sm font-semibold text-slate-400">Paused</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-[#1a2456] transition-colors">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-bold">Showing 3 of 12 automations</p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors" disabled>Previous</button>
                                <button className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors">Next</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}