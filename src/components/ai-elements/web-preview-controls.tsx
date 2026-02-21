"use client";

import React, { useState } from 'react';
import {
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from './web-preview-vercel';
import { RotateCcw, ExternalLink, X, Edit3, Eye, Download, Loader2, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { capturePdfFromIframe, printToPdf } from '@/lib/pdf-utils';

export type PreviewMode = 'view' | 'edit';
export type PageOrientation = 'portrait' | 'landscape';

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
  orientation = 'portrait',
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

      if (previewIframe && previewIframe.contentDocument) {
        // Use the already-rendered iframe
        await capturePdfFromIframe(previewIframe, title, orientation);
      } else {
        // Fallback: use browser print
        await printToPdf(htmlContent, title, orientation);
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

        {/* Orientation Toggle */}
        <div className="flex items-center bg-muted/50 rounded-md p-0.5">
          <button
            onClick={() => onOrientationChange?.('portrait')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
              orientation === 'portrait'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Portrait"
          >
            <RectangleVertical className="size-3.5" />
          </button>
          <button
            onClick={() => onOrientationChange?.('landscape')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
              orientation === 'landscape'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Landscape"
          >
            <RectangleHorizontal className="size-3.5" />
          </button>
        </div>

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
