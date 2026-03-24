"use client";

import React, { useState } from 'react';
import {
    RotateCcw, ExternalLink, X, Edit3, Eye,
    Download, Loader2, ChevronDown, ZoomIn, ZoomOut, Save,
} from 'lucide-react';
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
import {
    capturePdfFromIframe,
    captureSinglePagePdfFromIframe,
    printToPdf,
} from '@/lib/pdf-utils';
import { useWebPreview } from './viewer-provider';
import { SaveTemplateModal } from '@/components/reports/save-template-modal';

export type PreviewMode = 'view' | 'edit';
export type PageOrientation = 'original' | 'portrait' | 'landscape';

const ORIENTATION_LABELS: Record<PageOrientation, string> = {
    landscape: 'A4 Landscape',
    portrait:  'A4 Portrait',
    original:  'Original',
};

// Zoom step and bounds
const ZOOM_STEP = 0.1;
const ZOOM_MIN  = 0.5;
const ZOOM_MAX  = 2.0;

function snapZoom(v: number): number {
    // Round to nearest step to avoid floating-point drift
    return Math.round(v / ZOOM_STEP) * ZOOM_STEP;
}

// ─── Shared navigation button ─────────────────────────────────────────────────

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

// ─── URL bar ─────────────────────────────────────────────────────────────────

export const WebPreviewUrl: React.FC<{
    src?: string;
    className?: string;
    readOnly?: boolean;
}> = ({ src, className, readOnly = false }) => {
    const { url, setUrl } = useWebPreview();
    const [inputValue, setInputValue] = useState(src || url || '');

    React.useEffect(() => {
        if (src) { setInputValue(src); setUrl(src); }
    }, [src, setUrl]);

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); if (!readOnly) setUrl(inputValue); }}
            className="flex-1 flex justify-center px-2"
        >
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border hover:border-border/80 transition-colors h-9',
                    className,
                )}
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

// ─── Zoom control strip ───────────────────────────────────────────────────────

/**
 * Compact zoom control — shown only for paginated orientations (portrait / landscape).
 * Displays effectiveScale = fitScale × userScale as a percentage.
 * Zoom in/out buttons adjust userScale; clicking the label resets to 1.0.
 */
const ZoomControls: React.FC<{
    userScale: number;
    fitScale: number;
    onUserScaleChange: (scale: number) => void;
}> = ({ userScale, fitScale, onUserScaleChange }) => {
    const effectivePct = Math.round(fitScale * userScale * 100);

    const zoomIn = () => {
        const next = snapZoom(Math.min(ZOOM_MAX, userScale + ZOOM_STEP));
        onUserScaleChange(next);
    };

    const zoomOut = () => {
        const next = snapZoom(Math.max(ZOOM_MIN, userScale - ZOOM_STEP));
        onUserScaleChange(next);
    };

    const resetZoom = () => onUserScaleChange(1.0);

    return (
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md border border-border px-1 h-9">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={zoomOut}
                        disabled={userScale <= ZOOM_MIN}
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom out</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={resetZoom}
                        className="min-w-[46px] px-1 text-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors h-7"
                    >
                        {effectivePct}%
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>Reset zoom</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={zoomIn}
                        disabled={userScale >= ZOOM_MAX}
                        className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom in</p></TooltipContent>
            </Tooltip>
        </div>
    );
};


// ─── Original view width control ──────────────────────────────────────────────

const WIDTH_PRESETS = [
  { label: 'S',    value: 600,  tooltip: 'Narrow (600px)' },
  { label: 'M',    value: 900,  tooltip: 'Medium (900px)' },
  { label: 'L',    value: 1200, tooltip: 'Wide (1200px)'  },
  { label: 'Full', value: 0,    tooltip: 'Full width'     },
];

const WidthControls: React.FC<{
    width: number;
    onChange: (w: number) => void;
}> = ({ width, onChange }) => (
    <div className="flex items-center gap-0.5 bg-muted/50 rounded-md border border-border px-1 h-9">
        {WIDTH_PRESETS.map((p) => (
            <Tooltip key={p.value}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => onChange(p.value)}
                        className={cn(
                            'px-2 h-7 rounded text-xs font-medium transition-colors',
                            width === p.value
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        )}
                    >
                        {p.label}
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>{p.tooltip}</p></TooltipContent>
            </Tooltip>
        ))}
    </div>
);

// ─── Main controls ────────────────────────────────────────────────────────────

interface WebPreviewControlsProps {
    title: string;
    /** Combined HTML string — used only for copy/download, never for rendering. */
    htmlContent: string;
    mode?: PreviewMode;
    onModeChange?: (mode: PreviewMode) => void;
    orientation?: PageOrientation;
    onOrientationChange?: (orientation: PageOrientation) => void;
    onReload?: () => void;
    onClose?: () => void;
    getPreviewIframe?: () => HTMLIFrameElement | null;

    // ── Zoom ──────────────────────────────────────────────────────────────
    /**
     * Current user zoom multiplier.  Must be provided together with
     * onUserScaleChange to make the zoom controls interactive.
     * Default 1.0 when not provided.
     */
    userScale?: number;
    onUserScaleChange?: (scale: number) => void;
    /**
     * Auto-computed fit scale from the iframe (viewerWidth / pageWidthPx).
     * Combined with userScale to show the effective zoom percentage.
     */
    fitScale?: number;
    /** Total A4 page count — shown as a small badge next to the title. */
    totalPageCount?: number;

    // ── Original view width ───────────────────────────────────────────────
    /** Current content wrapper width in px (original view only). Default 900. */
    originalWidth?: number;
    onOriginalWidthChange?: (width: number) => void;
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
    userScale = 1,
    onUserScaleChange,
    fitScale = 1,
    totalPageCount,
    originalWidth = 900,
    onOriginalWidthChange,
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

    const isPaginated = orientation !== 'original';
    const showZoom    = isPaginated && !!onUserScaleChange;
    const showWidth   = !isPaginated && !!onOriginalWidthChange;

    const handleOpenInNewTab = () => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleDownloadPdf = async () => {
        if (!htmlContent || isDownloading) return;
        setIsDownloading(true);
        try {
            const previewIframe  = getPreviewIframe?.();
            const pdfOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

            if (orientation === 'original') {
                if (previewIframe?.contentDocument) {
                    await captureSinglePagePdfFromIframe(previewIframe, title);
                } else {
                    await printToPdf(htmlContent, title, pdfOrientation);
                }
            } else if (previewIframe?.contentDocument) {
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

            {/* ── Left: reload + title/page count ── */}
            <div className="flex items-center gap-1 min-w-0">
                <WebPreviewNavigationButton tooltip="Reload" onClick={onReload || (() => {})}>
                    <RotateCcw className="size-4" />
                </WebPreviewNavigationButton>

                {totalPageCount != null && totalPageCount > 1 && (
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-1">
                        {totalPageCount} pages
                    </span>
                )}
            </div>

            {/* ── Centre: report title ── */}
            <WebPreviewUrl src={title} readOnly />

            {/* ── Right: controls ── */}
            <div className="flex items-center gap-2">

                {/* View / Edit mode toggle */}
                <div className="flex bg-muted/50 rounded-md p-1 border border-border">
                    <button
                        onClick={() => onModeChange?.('view')}
                        className={cn(
                            'px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2',
                            mode === 'view'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                        onClick={() => onModeChange?.('edit')}
                        className={cn(
                            'px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2',
                            mode === 'edit'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                </div>

                {/* Orientation picker */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 text-xs font-medium bg-muted/50 border-border"
                        >
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

                {/* Zoom controls — only for paginated orientations */}
                {showZoom && (
                    <ZoomControls
                        userScale={userScale}
                        fitScale={fitScale}
                        onUserScaleChange={onUserScaleChange!}
                    />
                )}

                {/* Width controls — only for original view */}
                {showWidth && (
                    <WidthControls
                        width={originalWidth}
                        onChange={onOriginalWidthChange!}
                    />
                )}

                {/* Download PDF */}
                <WebPreviewNavigationButton
                    tooltip="Download PDF"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                >
                    {isDownloading
                        ? <Loader2 className="size-4 animate-spin text-primary" />
                        : <Download className="size-4" />}
                </WebPreviewNavigationButton>

                {/* Save as template */}
                <WebPreviewNavigationButton
                    tooltip="Save as template"
                    onClick={() => setShowSaveTemplateModal(true)}
                >
                    <Save className="size-4" />
                </WebPreviewNavigationButton>

                {/* Open externally */}
                <WebPreviewNavigationButton tooltip="Open externally" onClick={handleOpenInNewTab}>
                    <ExternalLink className="size-4" />
                </WebPreviewNavigationButton>

                {onClose && (
                    <WebPreviewNavigationButton
                        tooltip="Close preview"
                        onClick={onClose}
                        className="hover:bg-red-100 hover:text-red-600"
                    >
                        <X className="size-4" />
                    </WebPreviewNavigationButton>
                )}
            </div>

            <SaveTemplateModal
                open={showSaveTemplateModal}
                onOpenChange={setShowSaveTemplateModal}
                onSuccess={() => {}}
                title={title}
                getPreviewIframe={getPreviewIframe}
                orientation={orientation}
            />
        </div>
    );
};
