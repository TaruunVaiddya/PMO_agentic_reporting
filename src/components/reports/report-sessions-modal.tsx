"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { fetcher } from "@/lib/get-fetcher"
import { Loader2, Calendar, FileText, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ReportSession {
    id: string
    updated_at: string
    title: string
    is_favorite: boolean
}

interface ReportSessionsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReportSessionsModal({ open, onOpenChange }: ReportSessionsModalProps) {
    const router = useRouter()
    const [sessions, setSessions] = useState<ReportSession[]>([])
    const [loading, setLoading] = useState(false)

    const handleSessionClick = (session: ReportSession) => {
        sessionStorage.setItem("buildReportRequest", JSON.stringify({
            mode: "view",
            session_id: session.id,
            report_name: session.title || "Untitled Session"
        }))
        router.push("/chat/build-report")
        onOpenChange(false)
    }

    useEffect(() => {
        if (open) {
            setLoading(true)
            fetcher("/report-sessions")
                .then(setSessions)
                .catch((err) => console.error("Failed to fetch sessions:", err))
                .finally(() => setLoading(false))
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
                    <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#1a2456]" />
                        Generated Report Sessions
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1a2456]" />
                            <p className="text-sm text-slate-500">Fetching your sessions...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 border-2 border-dashed border-slate-200 rounded-xl">
                            <FileText className="w-12 h-12 text-slate-300" />
                            <p className="text-sm text-slate-500 font-medium">No generated reports found</p>
                            <p className="text-xs text-slate-400">Your generated reports will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded-lg">
                                <div className="col-span-8">Report Title</div>
                                <div className="col-span-4">Last Updated</div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSessionClick(session)}
                                        className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 hover:bg-slate-50/80 transition-colors group cursor-pointer rounded-lg"
                                    >
                                        <div className="col-span-8 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#1a2456]/5 flex items-center justify-center text-[#1a2456] group-hover:bg-[#1a2456] group-hover:text-white transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <span className="text-sm font-semibold text-slate-700 truncate group-hover:text-[#1a2456] transition-colors">
                                                    {session.title || "Untitled Session"}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono truncate uppercase tracking-tight">
                                                    ID: {session.id}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2 text-slate-500">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-medium">
                                                {format(new Date(session.updated_at), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1a2456] transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Showing {sessions.length} total sessions</span>
                    <span>Automatically synced from your history</span>
                </div>
            </DialogContent>
        </Dialog>
    )
}
