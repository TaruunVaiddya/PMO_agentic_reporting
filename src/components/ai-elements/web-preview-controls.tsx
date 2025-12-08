"use client";

import React from 'react';
import {
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from './web-preview-vercel';
import { RotateCcw, ExternalLink, X, Edit3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreviewMode = 'view' | 'edit';

interface WebPreviewControlsProps {
  title: string;
  htmlContent: string; // Complete HTML document
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  onReload?: () => void;
  onClose?: () => void;
}

export const WebPreviewControls: React.FC<WebPreviewControlsProps> = ({
  title,
  htmlContent,
  mode = 'view',
  onModeChange,
  onReload,
  onClose,
}) => {
  const handleOpenInNewTab = () => {
    // Use the complete HTML directly
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <WebPreviewNavigation className="justify-between">
      <div className="flex items-center gap-1">
        <WebPreviewNavigationButton
          tooltip="Reload"
          onClick={onReload || (() => {})}
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
