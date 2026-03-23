'use client';

/**
 * paginated-base-layout.tsx
 *
 * The single layout component shared by A4PortraitLayout and A4LandscapeLayout.
 * Orientation is passed as a prop — the two wrappers are thin pass-throughs.
 *
 * Responsibilities
 * ────────────────
 * • Calls usePaginatedReport() to generate the iframe srcdoc.
 * • Renders the iframe with the generated srcdoc.
 * • Shows loading states: skeleton (no content), progress bar (paginating),
 *   page-count badge (complete).
 * • Forwards userScale changes to the live iframe via postMessage without
 *   regenerating the srcdoc.
 * • Re-sends userScale once after each pagination cycle completes
 *   (the iframe reloads when srcdoc changes, resetting its internal state).
 * • Exposes the iframe element via onIframeRef for the parent to call
 *   iframe.contentWindow.print() for print support.
 *
 * Iframe ref strategy
 * ───────────────────
 * We need the iframe DOM element both for:
 *   a) Passing to usePaginatedReport so it can postMessage userScale.
 *   b) Exposing via onIframeRef for print.
 *
 * useRef alone won't work because ref.current changes don't trigger re-renders,
 * so the hook would never see the mounted element. Instead we use a ref-callback
 * that calls setState — state change triggers a re-render, the hook gets the
 * element, and the SET_USER_SCALE postMessage fires correctly.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { usePaginatedReport } from '../pagination/pagination-engine';
import type { PaginationMessage } from '../pagination/pagination-engine';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaginatedLayoutProps {
  /**
   * One HTML string per source report page.
   * Each string is a full or partial HTML document — NOT pre-combined.
   * The engine processes them sequentially and maintains style isolation.
   */
  htmlPages?: string[];

  /**
   * From layout.header — injected verbatim into every A4 page's header slot.
   * Empty string / undefined = no header.
   */
  headerHtml?: string;

  /**
   * From layout.footer — injected verbatim into every A4 page's footer slot.
   * Empty string / undefined = no footer.
   */
  footerHtml?: string;

  /** 'portrait' = 210×297mm  |  'landscape' = 297×210mm */
  orientation: 'portrait' | 'landscape';

  /**
   * User zoom multiplier (from toolbar).  Default = 1.0.
   * Forwarded to the iframe via postMessage — does NOT regenerate the srcdoc.
   * Range: 0.5 – 2.0 recommended.
   */
  userScale?: number;

  /** Called once pagination is fully complete with the total A4 page count. */
  onTotalPageCount?: (count: number) => void;

  /**
   * Called whenever the iframe recomputes its fit-scale (viewer resize).
   * Useful for displaying the current zoom level in a toolbar.
   */
  onFitScaleChange?: (scale: number) => void;

  /**
   * Called with the iframe element after it mounts (and again with null on unmount).
   * Use this ref to call iframe.contentWindow?.print() for print support.
   */
  onIframeRef?: (iframe: HTMLIFrameElement | null) => void;

  /** Status text shown in the loading pill while no pages have arrived yet. */
  streamingStatusText?: string;

  className?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Full-page A4 skeleton — shown while waiting for the first htmlPages content.
 * Mimics the structure of a report page with shimmer animation.
 */
const PageSkeleton: React.FC<{ widthMm: number; heightMm: number }> = ({ widthMm, heightMm }) => (
  <div
    className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden relative flex flex-col px-12 py-10 gap-4 flex-shrink-0"
    style={{ width: `${widthMm}mm`, minHeight: `${heightMm}mm` }}
  >
    {/* Shimmer sweep */}
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>

    {/* Report-like skeleton blocks */}
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

/**
 * Indeterminate top loading bar + optional floating status pill.
 * The bar is always shown; the pill only appears when `label` is provided.
 */
const TopLoadingBar: React.FC<{ label?: string }> = ({ label }) => (
  <>
    <div className="absolute top-0 left-0 right-0 z-30 h-[3px] bg-primary/10 overflow-hidden">
      <div className="absolute h-full w-1/2 bg-primary rounded-full animate-[indeterminate_1.4s_ease-in-out_infinite]" />
    </div>

    {label && (
      <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    )}
  </>
);

/** Small spinner + label shown while paginating (content has arrived but not yet laid out). */
const PaginationSpinner: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm">
    <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    <span className="text-xs text-muted-foreground">
      {total > 1 ? `Formatting page ${current} of ${total}…` : 'Formatting report…'}
    </span>
  </div>
);

/** Page-count badge shown after pagination completes on multi-page reports. */
const PageCountBadge: React.FC<{ count: number }> = ({ count }) => (
  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-background/90 border border-border rounded-md shadow-sm">
    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span className="text-xs font-medium text-muted-foreground">{count} pages</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const PaginatedBaseLayout: React.FC<PaginatedLayoutProps> = ({
  htmlPages,
  headerHtml,
  footerHtml,
  orientation,
  userScale = 1,
  onTotalPageCount,
  onFitScaleChange,
  onIframeRef,
  streamingStatusText,
  className,
}) => {
  // ── Iframe element via state (not useRef) so hook re-renders on mount ────────
  // useRef changes don't trigger re-renders, meaning usePaginatedReport would
  // never receive the element and SET_USER_SCALE would never fire.
  // A ref-callback that calls setState solves this cleanly.
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);

  const iframeRefCallback = useCallback((el: HTMLIFrameElement | null) => {
    setIframeEl(el);
    onIframeRef?.(el);
  }, [onIframeRef]);

  // ── Pagination hook ──────────────────────────────────────────────────────────
  const {
    iframeHtml,
    isPaginating,
    progress,
    totalPageCount,
    fitScale,
  } = usePaginatedReport(htmlPages, {
    orientation,
    headerHtml,
    footerHtml,
    userScale,
    iframeElement: iframeEl,
    // Landscape is shorter (210mm tall) so tighter margins preserve more
    // content area. Portrait uses slightly more generous margins.
    margins: orientation === 'landscape'
      ? { topMm: 4, bottomMm: 4, leftMm: 8, rightMm: 8 }
      : { topMm: 8, bottomMm: 8, leftMm: 12, rightMm: 12 },
  });

  // ── Surface state to parent ──────────────────────────────────────────────────
  const prevTotalRef = useRef(0);
  useEffect(() => {
    if (totalPageCount > 0 && totalPageCount !== prevTotalRef.current) {
      prevTotalRef.current = totalPageCount;
      onTotalPageCount?.(totalPageCount);
    }
  }, [totalPageCount, onTotalPageCount]);

  useEffect(() => {
    onFitScaleChange?.(fitScale);
  }, [fitScale, onFitScaleChange]);

  // ── Re-send userScale after pagination completes ─────────────────────────────
  // When srcdoc changes (new pages), the iframe reloads and loses its internal
  // userScale state. The hook sends SET_USER_SCALE when iframeElement changes, but
  // the iframe may not be ready to receive messages until pagination is done.
  // Sending once more on completion ensures the correct scale is always applied.
  const prevIsPaginating = useRef(false);
  useEffect(() => {
    const justFinished = prevIsPaginating.current && !isPaginating;
    prevIsPaginating.current = isPaginating;

    if (justFinished && iframeEl?.contentWindow && userScale !== 1) {
      const msg: PaginationMessage = { type: 'SET_USER_SCALE', scale: userScale };
      iframeEl.contentWindow.postMessage(msg, '*');
    }
  }, [isPaginating, iframeEl, userScale]);

  // ── Derived display state ────────────────────────────────────────────────────
  const hasPages     = (htmlPages?.length ?? 0) > 0;
  const showSkeleton = !hasPages;
  const showProgress = hasPages && isPaginating;
  const showBadge    = !isPaginating && totalPageCount > 1;

  const pageWmm = orientation === 'landscape' ? 297 : 210;
  const pageHmm = orientation === 'landscape' ? 210 : 297;

  return (
    <div className={cn('flex-1 overflow-hidden relative bg-[#9a9a9a]', className)}>

      {/* ── Top loading bar ── */}
      {(showSkeleton || showProgress) && (
        <TopLoadingBar
          label={showSkeleton ? (streamingStatusText ?? undefined) : undefined}
        />
      )}

      {/* ── Empty skeleton — shown while no pages have arrived ── */}
      {showSkeleton && (
        <div className="absolute inset-0 z-10 flex items-start justify-center overflow-auto p-5">
          <PageSkeleton widthMm={pageWmm} heightMm={pageHmm} />
        </div>
      )}

      {/* ── Pagination progress — shown while content is being laid out ── */}
      {showProgress && (
        <PaginationSpinner current={progress.current} total={progress.total} />
      )}

      {/* ── Page count badge — shown after complete on multi-page reports ── */}
      {showBadge && <PageCountBadge count={totalPageCount} />}

      {/*
       * ── Iframe ──
       *
       * • srcdoc is the full self-contained HTML generated by paginateReport().
       *   It includes all CSS, the pagination JS, and the source page data.
       * • sandbox allows scripts and same-origin access (needed for postMessage
       *   and for Chart.js / inline scripts to run).
       * • The iframe is always in the DOM (opacity-0 when empty) — mounting /
       *   unmounting would reset the iframe contentWindow and break messaging.
       * • We do NOT add extra isolation styles here — paginateReport() already
       *   generates a complete, self-contained document.
       */}
      <iframe
        ref={iframeRefCallback}
        srcDoc={iframeHtml || undefined}
        className={cn(
          'w-full h-full border-0 block',
          // Keep in DOM but invisible until content is ready
          !hasPages && 'opacity-0 pointer-events-none',
        )}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        title={`Report preview (${orientation})`}
        // Suppress onLoad flicker — pagination completion is driven by
        // PAGINATION_COMPLETE postMessage, not the iframe load event.
      />
    </div>
  );
};

export default PaginatedBaseLayout;