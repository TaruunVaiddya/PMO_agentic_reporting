"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWebPreview } from '../viewer-provider';
import { LoadingOverlay, iframeIsolationStyles } from './shared';

export interface ReportLayoutProps {
    src?: string;
    htmlContent?: string;
    className?: string;
    onIframeRef?: (iframe: HTMLIFrameElement | null) => void;
    streamingStatusText?: string;
    // Specific to paginated layouts:
    editMode?: boolean;
    onEditModeReady?: (iframe: HTMLIFrameElement) => void;
    enablePagination?: boolean;
    onPaginationComplete?: (pageCount: number) => void;
}

export const OriginalLayout: React.FC<ReportLayoutProps> = ({
    src,
    htmlContent,
    className,
    onIframeRef,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { setIsLoading } = useWebPreview();
    const [iframeSrcDoc, setIframeSrcDoc] = useState<string>('');

    const injectOriginalIsolation = (html: string): string => {
        const originalViewStyles = `
      <style data-original-view="true">
        body {
          background: #fff !important;
          max-width: 70%;
          margin: 32px auto !important;
          padding: 40px !important;
          min-height: calc(100vh - 64px);
          overflow-y: auto;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          border-radius: 4px !important;
        }
        @media screen and (max-width: 900px) {
          body {
            max-width: 95%;
            margin: 16px auto !important;
            padding: 24px !important;
            min-height: calc(100vh - 32px);
          }
        }
      </style>
    `;
        const allStyles = iframeIsolationStyles + originalViewStyles;

        if (html.includes('data-isolation="true"')) return html;
        if (html.includes('</head>')) return html.replace('</head>', `${allStyles}</head>`);
        if (html.includes('<html>')) return html.replace('<html>', `<html><head>${allStyles}</head>`);
        return `<!DOCTYPE html><html><head>${allStyles}</head><body>${html}</body></html>`;
    };

    useEffect(() => {
        if (src) {
            setIframeSrcDoc('');
        } else if (htmlContent) {
            setIframeSrcDoc(injectOriginalIsolation(htmlContent));
        }
    }, [htmlContent, src]);

    useEffect(() => {
        onIframeRef?.(iframeRef.current);
    }, [iframeSrcDoc, onIframeRef]);

    const hasContent = !!(htmlContent || src);

    return (
        <div className={cn('flex-1 bg-black/40 overflow-hidden relative', className)}>
            {!hasContent && <LoadingOverlay />}
            <iframe
                ref={iframeRef}
                src={src}
                srcDoc={iframeSrcDoc || undefined}
                className={cn("w-full h-full border-0", !hasContent && "opacity-0")}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setIsLoading(false)}
                title="Preview (Original)"
            />
        </div>
    );
};
