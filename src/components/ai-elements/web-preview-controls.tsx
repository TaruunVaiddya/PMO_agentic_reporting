"use client";

import React from 'react';
import {
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from './web-preview-vercel';
import { RotateCcw, ExternalLink, X } from 'lucide-react';

interface WebPreviewControlsProps {
  title: string;
  htmlContent: string; // Complete HTML document
  onReload?: () => void;
  onClose?: () => void;
}

export const WebPreviewControls: React.FC<WebPreviewControlsProps> = ({
  title,
  htmlContent,
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
      <WebPreviewNavigationButton
        tooltip="Reload"
        onClick={onReload || (() => {})}
      >
        <RotateCcw className="size-4" />
      </WebPreviewNavigationButton>
      <WebPreviewUrl src={title} readOnly />
      <div className="flex items-center gap-1">
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
