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
        html, body {
          height: auto !important;
          max-height: none !important;
        }
        body {
          background: #fff !important;
          max-width: 70%;
          margin: 32px auto !important;
          padding: 40px !important;
          min-height: calc(100vh - 64px);
          overflow-y: visible;
          overflow-x: auto;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          border-radius: 4px !important;
        }
        table {
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
        }
        table, thead, tbody, tr, td, th {
          max-width: 100%;
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

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        if (doc.head && !doc.head.innerHTML.includes('data-isolation="true"')) {
            doc.head.insertAdjacentHTML('beforeend', allStyles);
        }

        const bodyScripts: string[] = [];
        doc.body?.querySelectorAll('script:not([src])').forEach((script) => {
            const src = script.textContent?.trim() || '';
            if (src) bodyScripts.push(src);
            script.remove();
        });

        if (bodyScripts.length > 0) {
            const encodedScripts = JSON
                .stringify(bodyScripts)
                .replace(/<\/script>/gi, '<\\/script>');
            const runner = `
  <script>
    (function () {
      var _bodyScripts = ${encodedScripts};
      if (_bodyScripts.length === 0) return;
      var _origAddEvent = window.addEventListener.bind(window);
      window.addEventListener = function (type, handler, opts) {
        if (type === 'DOMContentLoaded') {
          setTimeout(function () {
            try { handler(new Event('DOMContentLoaded')); } catch (e) {
              console.error('[OriginalView] DOMContentLoaded handler error:', e);
            }
          }, 0);
          return;
        }
        return _origAddEvent(type, handler, opts);
      };
      _bodyScripts.forEach(function (src) {
        try { (0, eval)(src); } catch (e) {
          console.error('[OriginalView] Body script eval error:', e);
        }
      });
      window.addEventListener = _origAddEvent;
    })();
  </script>
`;
            doc.body?.insertAdjacentHTML('beforeend', runner);
        }

        return doc.documentElement?.outerHTML || html;
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
