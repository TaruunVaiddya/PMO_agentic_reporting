"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWebPreview } from '../viewer-provider';
import { usePaginatedReport } from '../pagination/pagination-engine';
import { ReportLayoutProps } from './original-layout';

export interface PaginatedLayoutProps extends ReportLayoutProps {
  orientation: 'portrait' | 'landscape';
}

// ─── Loading skeleton: mimics a report page structure ────────────────────────

const PageSkeleton: React.FC<{ widthMm: number; heightMm: number }> = ({ widthMm, heightMm }) => (
  <div
    className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden relative flex flex-col px-12 py-10 gap-4"
    style={{ width: `${widthMm}mm`, height: `${heightMm}mm`, minHeight: `${heightMm}mm` }}
  >
    {/* Shimmer sweep */}
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>

    <div className="h-6 w-2/5 rounded bg-slate-200" />
    <div className="h-3 w-1/4 rounded bg-slate-100 -mt-2" />
    <div className="border-t border-slate-100 my-1" />

    <div className="flex flex-col gap-2">
      <div className="h-3.5 w-1/3 rounded bg-slate-200" />
      <div className="h-2.5 w-full rounded bg-slate-100" />
      <div className="h-2.5 w-full rounded bg-slate-100" />
      <div className="h-2.5 w-4/5 rounded bg-slate-100" />
    </div>

    <div className="h-24 w-full rounded bg-slate-100 mt-1" />

    <div className="flex flex-col gap-2">
      <div className="h-3.5 w-1/4 rounded bg-slate-200" />
      <div className="h-2.5 w-full rounded bg-slate-100" />
      <div className="h-2.5 w-3/4 rounded bg-slate-100" />
    </div>

    <div className="grid grid-cols-2 gap-4 mt-1">
      <div className="h-16 rounded bg-slate-100" />
      <div className="h-16 rounded bg-slate-100" />
    </div>

    <div className="flex flex-col gap-2 mt-1">
      <div className="h-3.5 w-2/5 rounded bg-slate-200" />
      <div className="h-2.5 w-full rounded bg-slate-100" />
      <div className="h-2.5 w-5/6 rounded bg-slate-100" />
      <div className="h-2.5 w-full rounded bg-slate-100" />
    </div>
  </div>
);

// ─── Indeterminate top progress bar ──────────────────────────────────────────

const TopLoadingBar: React.FC<{ label?: string }> = ({ label }) => (
  <>
    <div className="absolute top-0 left-0 right-0 z-30 h-[3px] bg-blue-800/10 overflow-hidden">
      <div className="absolute h-full w-1/2 bg-blue-900 rounded-full animate-[indeterminate_1.4s_ease-in-out_infinite]" />
    </div>

    {label && (
      <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-blue-900 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
        </div>
      </div>
    )}
  </>
);

// ─── Layout ───────────────────────────────────────────────────────────────────

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
  streamingStatusText,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setIsLoading } = useWebPreview();
  const [iframeSrcDoc, setIframeSrcDoc] = useState<string>('');
  const editModeAppliedRef = useRef(false);

  // Page dimensions only — no style injection, no contentScale
  const paginationConfig = React.useMemo(() => (
    orientation === 'landscape'
      ? { pageWidthMm: 297, pageHeightMm: 210, contentScale: 0.85 }
      : { pageWidthMm: 210, pageHeightMm: 297 }
  ), [orientation]);

  const { paginatedHtml, isPaginating, pageCount, wasPaginated } = usePaginatedReport(
    htmlContent,
    { enabled: enablePagination && !src, config: paginationConfig },
  );

  // Notify parent when pagination finishes
  useEffect(() => {
    if (!isPaginating && pageCount > 0) onPaginationComplete?.(pageCount);
  }, [isPaginating, pageCount, onPaginationComplete]);

  // paginateReport returns self-contained iframe HTML — set it directly
  useEffect(() => {
    if (src) {
      setIframeSrcDoc('');
    } else if (paginatedHtml) {
      setIframeSrcDoc(paginatedHtml);
    } else if (htmlContent) {
      setIframeSrcDoc(htmlContent);
    }
  }, [paginatedHtml, htmlContent, src]);

  // Edit mode: wait for pagination to finish before handing off the iframe
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

        const hasPagination = !!iframeDoc.querySelector('.pages-container');
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

  // Reset edit mode flag when source content changes
  useEffect(() => {
    editModeAppliedRef.current = false;
  }, [htmlContent, src]);

  // Forward iframe ref to parent
  useEffect(() => {
    onIframeRef?.(iframeRef.current);
  }, [iframeSrcDoc, onIframeRef]);

  const hasContent           = !!(htmlContent || src);
  const showEmptyPage        = !hasContent;
  const showPaginationIndicator = isPaginating && hasContent;

  const pageWidthMm  = orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = orientation === 'landscape' ? 210 : 297;

  return (
    <div className={cn('flex-1 bg-black/40 overflow-hidden relative', className)}>

      {/* Progress bar — while waiting for content or while paginating */}
      {(showEmptyPage || showPaginationIndicator) && (
        <TopLoadingBar label={showEmptyPage ? (streamingStatusText ?? undefined) : 'Formatting report...'} />
      )}

      {/* Empty state: A4-shaped skeleton shimmer */}
      {showEmptyPage && (
        <div className="absolute inset-0 z-10 flex items-start justify-center overflow-auto p-5">
          <div className="flex flex-col items-center gap-5 min-h-full">
            <PageSkeleton widthMm={pageWidthMm} heightMm={pageHeightMm} />
          </div>
        </div>
      )}

      {/* Pagination in-progress indicator (content is present but still being formatted) */}
      {showPaginationIndicator && (
        <div className="absolute top-4 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm">
          <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Formatting report...</span>
        </div>
      )}

      {/* Page count badge */}
      {wasPaginated && pageCount > 1 && !isPaginating && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-background/90 border border-border rounded-md shadow-sm">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium text-muted-foreground">{pageCount} pages</span>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        srcDoc={iframeSrcDoc || undefined}
        className={cn('w-full h-full border-0', !hasContent && 'opacity-0')}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setIsLoading(false)}
        title="Preview (Paginated)"
      />
    </div>
  );
};