"use client";

import React, { useState } from 'react';
import { RotateCcw, ExternalLink, X, Edit3, Eye, Download, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capturePdfFromIframe, printToPdf } from '@/lib/pdf-utils';
import { useWebPreview } from './viewer-provider';

export type PreviewMode = 'view' | 'edit';
export type PageOrientation = 'original' | 'portrait' | 'landscape';

const ORIENTATION_LABELS: Record<PageOrientation, string> = {
    landscape: 'A4 Landscape',
    portrait: 'A4 Portrait',
    original: 'Original',
};

// --- Shared smaller components from the old header ---

export const WebPreviewNavigationButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    tooltip?: string;
    disabled?: boolean;
    className?: string;
}> = ({ children, onClick, tooltip, disabled = false, className }) => {
    const button = (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn('h-9 w-9 rounded-md hover:bg-accent cursor-pointer', className)}
        >
            {children}
        </Button>
    );

    if (tooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        );
    }
    return button;
};

export const WebPreviewUrl: React.FC<{ src?: string; className?: string; readOnly?: boolean; }> = ({
    src,
    className,
    readOnly = false,
}) => {
    const { url, setUrl } = useWebPreview();
    const [inputValue, setInputValue] = useState(src || url || '');

    React.useEffect(() => {
        if (src) {
            setInputValue(src);
            setUrl(src);
        }
    }, [src, setUrl]);

    return (
        <form onSubmit={(e) => { e.preventDefault(); if (!readOnly) setUrl(inputValue); }} className="flex-1 flex justify-center px-2">
            <div
                className={cn('flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border hover:border-border/80 transition-colors h-9', className)}
                style={{ width: '60%', maxWidth: '600px' }}
            >
                <div className="flex-1 overflow-hidden">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        readOnly={readOnly}
                        className="w-full bg-transparent text-xs text-foreground text-center outline-none border-none"
                        placeholder="Enter URL..."
                    />
                </div>
            </div>
        </form>
    );
};

// --- Main Header Controls ---

interface WebPreviewControlsProps {
    title: string;
    htmlContent: string;
    mode?: PreviewMode;
    onModeChange?: (mode: PreviewMode) => void;
    orientation?: PageOrientation;
    onOrientationChange?: (orientation: PageOrientation) => void;
    onReload?: () => void;
    onClose?: () => void;
    getPreviewIframe?: () => HTMLIFrameElement | null;
}

export const WebPreviewControls: React.FC<WebPreviewControlsProps> = ({
    title,
    htmlContent,
    mode = 'view',
    onModeChange,
    orientation = 'landscape',
    onOrientationChange,
    onReload,
    onClose,
    getPreviewIframe,
}) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleOpenInNewTab = () => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleDownloadPdf = async () => {
        if (!htmlContent || isDownloading) return;
        setIsDownloading(true);
        try {
            const previewIframe = getPreviewIframe?.();
            const pdfOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

            if (previewIframe && previewIframe.contentDocument) {
                await capturePdfFromIframe(previewIframe, title, pdfOrientation);
            } else {
                await printToPdf(htmlContent, title, pdfOrientation);
            }
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex items-center gap-1 px-2 py-2 bg-muted/30 border-b border-border justify-between">
            <div className="flex items-center gap-1">
                <WebPreviewNavigationButton tooltip="Reload" onClick={onReload || (() => { })}>
                    <RotateCcw className="size-4" />
                </WebPreviewNavigationButton>
            </div>

            <WebPreviewUrl src={title} readOnly />

            <div className="flex items-center gap-2">
                <div className="flex bg-muted/50 rounded-md p-1 border border-border">
                    <button
                        onClick={() => onModeChange?.('view')}
                        className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2", mode === 'view' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                        onClick={() => onModeChange?.('edit')}
                        className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2", mode === 'edit' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-medium bg-muted/50 border-border">
                            {ORIENTATION_LABELS[orientation]}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                        {Object.entries(ORIENTATION_LABELS).map(([key, label]) => (
                            <DropdownMenuItem
                                key={key}
                                className={cn('text-xs cursor-pointer', orientation === key && 'bg-accent font-medium')}
                                onClick={() => onOrientationChange?.(key as PageOrientation)}
                            >
                                {label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <WebPreviewNavigationButton tooltip="Download PDF" onClick={handleDownloadPdf} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Download className="size-4" />}
                </WebPreviewNavigationButton>

                <WebPreviewNavigationButton tooltip="Open externally" onClick={handleOpenInNewTab}>
                    <ExternalLink className="size-4" />
                </WebPreviewNavigationButton>

                {onClose && (
                    <WebPreviewNavigationButton tooltip="Close preview" onClick={onClose} className="hover:bg-red-100 hover:text-red-600">
                        <X className="size-4" />
                    </WebPreviewNavigationButton>
                )}
            </div>
        </div>
    );
};
