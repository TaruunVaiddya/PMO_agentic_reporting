"use client";

import React, { useState } from 'react';
import {
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from './web-preview-vercel';
import { RotateCcw, ExternalLink, X, Edit3, Eye, Download, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { capturePdfFromIframe, printToPdf } from '@/lib/pdf-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PreviewMode = 'view' | 'edit';
export type PageOrientation = 'original' | 'portrait' | 'landscape';

const ORIENTATION_LABELS: Record<PageOrientation, string> = {
  original: 'Original',
  portrait: 'A4 Portrait',
  landscape: 'A4 Landscape',
};

interface WebPreviewControlsProps {
  title: string;
  htmlContent: string; // Complete HTML document
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  orientation?: PageOrientation;
  onOrientationChange?: (orientation: PageOrientation) => void;
  onReload?: () => void;
  onClose?: () => void;
  /** Reference to get the current preview iframe */
  getPreviewIframe?: () => HTMLIFrameElement | null;
}

export const WebPreviewControls: React.FC<WebPreviewControlsProps> = ({
  title,
  htmlContent,
  mode = 'view',
  onModeChange,
  orientation = 'original',
  onOrientationChange,
  onReload,
  onClose,
  getPreviewIframe,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenInNewTab = () => {
    // Use the complete HTML directly
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleDownloadPdf = async () => {
    if (!htmlContent || isDownloading) return;

    setIsDownloading(true);

    try {
      // Get the actual preview iframe if available
      const previewIframe = getPreviewIframe?.();
      // For PDF, use portrait/landscape (original → portrait for export)
      const pdfOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';

      if (previewIframe && previewIframe.contentDocument) {
        // Use the already-rendered iframe
        await capturePdfFromIframe(previewIframe, title, pdfOrientation);
      } else {
        // Fallback: use browser print
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
    <WebPreviewNavigation className="justify-between">
      <div className="flex items-center gap-1">
        <WebPreviewNavigationButton
          tooltip="Reload"
          onClick={onReload || (() => { })}
        >
          <RotateCcw className="size-4" />
        </WebPreviewNavigationButton>
      </div>

      <WebPreviewUrl src={title} readOnly />

      <div className="flex items-center gap-2">
        {/* Mode Toggle */}
        <div className="flex items-center bg-muted/50 rounded-md p-0.5">
          <button
            onClick={() => onModeChange?.('view')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
              mode === 'view'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="View Mode"
          >
            <Eye className="size-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={() => onModeChange?.('edit')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
              mode === 'edit'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Edit Mode"
          >
            <Edit3 className="size-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {/* View Layout Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              <span>{ORIENTATION_LABELS[orientation]}</span>
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {(Object.keys(ORIENTATION_LABELS) as PageOrientation[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onOrientationChange?.(key)}
                className={cn(
                  "cursor-pointer text-xs",
                  orientation === key && "bg-accent font-semibold"
                )}
              >
                {ORIENTATION_LABELS[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <WebPreviewNavigationButton
          tooltip="Download PDF"
          onClick={handleDownloadPdf}
          disabled={isDownloading || !htmlContent}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton
          tooltip="Open in new tab"
          onClick={handleOpenInNewTab}
        >
          <ExternalLink className="size-4" />
        </WebPreviewNavigationButton>
        {onClose && (
          <WebPreviewNavigationButton
            tooltip="Close preview"
            onClick={onClose}
          >
            <X className="size-4" />
          </WebPreviewNavigationButton>
        )}
      </div>
    </WebPreviewNavigation>
  );
};
