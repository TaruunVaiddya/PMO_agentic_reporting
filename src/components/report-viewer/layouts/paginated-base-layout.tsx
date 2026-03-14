"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWebPreview } from '../viewer-provider';
import { LoadingOverlay, iframeIsolationStyles } from './shared';
import { usePaginatedReport } from '../pagination/pagination-engine';
import { ReportLayoutProps } from './original-layout';

export interface PaginatedLayoutProps extends ReportLayoutProps {
    orientation: 'portrait' | 'landscape';
}

export const PaginatedBaseLayout: React.FC<PaginatedLayoutProps> = ({
    src,
    htmlContent,
    className,
    editMode = false,
    onEditModeReady,
    enablePagination = true,
    orientation,
    onPaginationComplete,
    onIframeRef,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { setIsLoading } = useWebPreview();
    const [iframeSrcDoc, setIframeSrcDoc] = useState<string>('');
    const editModeAppliedRef = useRef(false);

    const paginationConfig = React.useMemo(() => {
        if (orientation === 'landscape') {
            return { pageWidthMm: 297, pageHeightMm: 210, contentScale: 0.75 };
        }
        return {};
    }, [orientation]);

    const {
        paginatedHtml,
        isPaginating,
        pageCount,
        wasPaginated,
    } = usePaginatedReport(htmlContent, {
        enabled: enablePagination && !src,
        config: paginationConfig,
    });

    useEffect(() => {
        if (!isPaginating && pageCount > 0) {
            onPaginationComplete?.(pageCount);
        }
    }, [isPaginating, pageCount, onPaginationComplete]);

    const injectPaginatedIsolation = (html: string): string => {
        const a4ViewStyles = `
      <style data-a4-view="true">
        body { background: transparent; }
      </style>
    `;
        const allStyles = iframeIsolationStyles + a4ViewStyles;

        if (html.includes('data-isolation="true"')) return html;
        if (html.includes('</head>')) return html.replace('</head>', `${allStyles}</head>`);
        if (html.includes('<html>')) return html.replace('<html>', `<html><head>${allStyles}</head>`);
        return `<!DOCTYPE html><html><head>${allStyles}</head><body>${html}</body></html>`;
    };

    useEffect(() => {
        if (src) {
            setIframeSrcDoc('');
        } else if (paginatedHtml) {
            setIframeSrcDoc(injectPaginatedIsolation(paginatedHtml));
        } else if (htmlContent) {
            setIframeSrcDoc(injectPaginatedIsolation(htmlContent));
        }
    }, [paginatedHtml, htmlContent, src]);

    useEffect(() => {
        if (!iframeRef.current) return;
        const iframe = iframeRef.current;

        if (editMode && !editModeAppliedRef.current) {
            let attempts = 0;
            const maxAttempts = 50;

            const tryEnableEditMode = () => {
                attempts++;
                const iframeDoc = iframe.contentDocument;
                const iframeWin = iframe.contentWindow as any;

                if (!iframeDoc || iframeDoc.readyState !== 'complete') {
                    if (attempts < maxAttempts) setTimeout(tryEnableEditMode, 100);
                    return;
                }

                const hasPagination = !!iframeDoc.querySelector('.a4-page-container');
                if (hasPagination && !iframeWin?.__paginationComplete) {
                    if (attempts < maxAttempts) setTimeout(tryEnableEditMode, 100);
                    return;
                }

                onEditModeReady?.(iframe);
                editModeAppliedRef.current = true;
            };

            tryEnableEditMode();
        } else if (!editMode && editModeAppliedRef.current) {
            editModeAppliedRef.current = false;
        }
    }, [editMode, iframeSrcDoc, onEditModeReady]);

    useEffect(() => {
        editModeAppliedRef.current = false;
    }, [htmlContent, src]);

    useEffect(() => {
        onIframeRef?.(iframeRef.current);
    }, [iframeSrcDoc, onIframeRef]);

    const hasContent = !!(htmlContent || src);
    const showPaginationIndicator = isPaginating && hasContent;

    return (
        <div className={cn('flex-1 bg-black/40 overflow-hidden relative', className)}>
            {!hasContent && <LoadingOverlay />}

            {showPaginationIndicator && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 bg-background/90 border border-border rounded-md shadow-sm">
                    <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">checking loader...</span>
                </div>
            )}

            {wasPaginated && pageCount > 1 && !isPaginating && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-background/90 border border-border rounded-md shadow-sm">
                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium text-muted-foreground">{pageCount} pages</span>
                </div>
            )}

            <iframe
                ref={iframeRef}
                src={src}
                srcDoc={iframeSrcDoc || undefined}
                className={cn("w-full h-full border-0", !hasContent && "opacity-0")}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setIsLoading(false)}
                title="Preview (Paginated)"
            />
        </div>
    );
};
