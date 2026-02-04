"use client";

import React, { useState } from 'react';
import React, { useState } from 'react';
import {
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from './web-preview-vercel';
import { RotateCcw, ExternalLink, X, Edit3, Eye, Download, Loader2 } from 'lucide-react';
import { RotateCcw, ExternalLink, X, Edit3, Eye, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2pdf from 'html2pdf.js';

export type PreviewMode = 'view' | 'edit';

interface WebPreviewControlsProps {
  title: string;
  htmlContent: string; // Complete HTML document
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
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
  onReload,
  onClose,
  getPreviewIframe,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleOpenInNewTab = () => {
    // Use the complete HTML directly
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.innerHTML = htmlContent;

      // Extract just the body content for PDF generation
      const bodyContent = container.querySelector('body')?.innerHTML || htmlContent;

      // Create a wrapper div with the content
      const wrapper = document.createElement('div');
      wrapper.innerHTML = bodyContent;
      wrapper.style.padding = '20px';
      wrapper.style.backgroundColor = 'white';

      // PDF generation options
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${title || 'report'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        }
      };

      // Generate and download PDF
      await html2pdf().set(options).from(wrapper).save();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
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

        <WebPreviewNavigationButton
          tooltip={isGeneratingPDF ? "Generating PDF..." : "Download as PDF"}
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
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
