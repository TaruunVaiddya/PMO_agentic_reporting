"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/get-fetcher';
import { formatDistanceToNow } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { History, MessageCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Session {
    id: string;
    title?: string;
    created_at?: string;
}

export function DecisionIntelligenceHistory() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Only fetch when the dialog is open to save unnecessary requests
    const { data: sessions, error, isLoading } = useSWR<Session[]>(
        isOpen ? '/sessions' : null,
        fetcher
    );

    const handleSessionClick = (sessionId: string) => {
        setIsOpen(false);
        router.push(`/chat/${sessionId}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
                className="p-1.5 text-slate-400 hover:text-[#1a2456] hover:bg-slate-100 rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1a2456]/20"
                title="View Chat History"
            >
                <History className="h-5 w-5" />
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] h-[80vh] max-h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <DialogTitle className="flex items-center gap-2 text-[#1a2456] font-bold text-lg">
                        <History className="h-5 w-5" />
                        Decision Intelligence History
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-white">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-[#1a2456]/30" />
                            <p className="text-sm font-medium">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-3 px-8 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500/50" />
                            <p className="text-sm font-medium text-slate-600">Failed to load history.</p>
                            <p className="text-xs text-slate-500">Please try again later or check your connection.</p>
                        </div>
                    ) : !sessions || sessions.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 px-8 text-center">
                            <MessageCircle className="h-10 w-10 text-slate-200" />
                            <p className="text-sm font-medium text-slate-600">No chat history found</p>
                            <p className="text-xs text-slate-500">Your previous Decision Intelligence sessions will appear here.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full w-full">
                            <div className="p-4 flex flex-col gap-2">
                                {sessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => handleSessionClick(session.id)}
                                        className="flex flex-col gap-1.5 p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 text-left transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="font-semibold text-[#1a2456] text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                                {session.title || 'New Chat Session'}
                                            </span>
                                        </div>
                                        {session.created_at && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
