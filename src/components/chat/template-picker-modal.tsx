"use client";

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { X, Loader2, Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { ReportCard, ReportCardData } from '@/components/reports/report-card';
import { fetcher } from '@/lib/get-fetcher';

interface TemplateResponse {
    id: string;
    created_at: string;
    name: string;
    thumbnail_url: string | null;
    description: string | null;
    template_url: string | null;
    category: string;
}

interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: { id: string; name: string }) => void;
}

export function TemplatePickerModal({ isOpen, onClose, onSelect }: TemplatePickerModalProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Only fetch when modal is open
    const { data: apiTemplates, isLoading } = useSWR<TemplateResponse[]>(
        isOpen ? '/report-templates' : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    const templates: ReportCardData[] = useMemo(() => {
        if (!apiTemplates || !Array.isArray(apiTemplates)) return [];
        return apiTemplates
            .filter(t => t.id)
            .map(t => ({
                id: t.id,
                name: t.name || 'Untitled',
                description: t.description || '',
                thumbnail: t.thumbnail_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
                createdAt: t.created_at,
                status: 'completed' as const,
            }));
    }, [apiTemplates]);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    const handleSelect = (report: ReportCardData) => {
        if (!report.id) return;
        onSelect({ id: report.id, name: report.name });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-none w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] h-[90vh] p-0 overflow-hidden border border-white/30 shadow-2xl bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl rounded-2xl flex flex-col [&>button:last-child]:hidden">
                <DialogTitle className="sr-only">Select a Template</DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Select a Template</h2>
                        <p className="text-xs text-white/40 mt-0.5">Choose a template to use with report generation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search templates…"
                                className="pl-9 pr-3 py-1.5 w-56 bg-white/5 border border-white/15 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                            <span className="text-sm text-white/40">Loading templates…</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <span className="text-sm text-white/40">
                                {searchQuery ? 'No templates match your search' : 'No templates available'}
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filtered.map((template, i) => (
                                <ReportCard
                                    key={template.id || i}
                                    report={template}
                                    onClick={handleSelect}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
