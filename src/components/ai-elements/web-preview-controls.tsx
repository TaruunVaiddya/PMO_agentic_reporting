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
  html: string;
  css: string;
  js: string;
  onReload?: () => void;
  onClose?: () => void;
}

export const WebPreviewControls: React.FC<WebPreviewControlsProps> = ({
  title,
  html,
  css,
  js,
  onReload,
  onClose,
}) => {
  const handleOpenInNewTab = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>`;

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
