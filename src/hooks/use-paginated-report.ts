'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { paginateReport, needsPagination, PaginationConfig } from '@/lib/report-paginator';

interface UsePaginatedReportOptions {
  /** Enable/disable pagination */
  enabled?: boolean;
  /** Pagination configuration */
  config?: PaginationConfig;
  /** Debounce delay in ms before re-paginating on content change */
  debounceMs?: number;
}

interface UsePaginatedReportReturn {
  /** The paginated HTML content (or original if pagination disabled/not needed) */
  paginatedHtml: string;
  /** Whether pagination is currently processing */
  isPaginating: boolean;
  /** Error message if pagination failed */
  error: string | null;
  /** Number of pages after pagination */
  pageCount: number;
  /** Whether the content was actually paginated */
  wasPaginated: boolean;
  /** Force re-pagination */
  repaginate: () => void;
}

/**
 * React hook for paginating HTML report content
 *
 * @param htmlContent - The original HTML content from LLM
 * @param options - Pagination options
 * @returns Paginated content and status
 *
 * @example
 * ```tsx
 * const { paginatedHtml, isPaginating, pageCount } = usePaginatedReport(htmlContent, {
 *   enabled: true,
 *   config: { pageHeightMm: 297 }
 * });
 *
 * return <iframe srcDoc={paginatedHtml} />;
 * ```
 */
export function usePaginatedReport(
  htmlContent: string | undefined,
  options: UsePaginatedReportOptions = {}
): UsePaginatedReportReturn {
  const { enabled = true, config = {}, debounceMs = 100 } = options;

  console.log('[usePaginatedReport] Hook called:', {
    htmlContentLength: htmlContent?.length || 0,
    enabled,
    debounceMs,
  });

  const [paginatedHtml, setPaginatedHtml] = useState<string>('');
  const [isPaginating, setIsPaginating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [wasPaginated, setWasPaginated] = useState<boolean>(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  const doPagination = useCallback(async (content: string) => {
    if (!content) {
      setPaginatedHtml('');
      setPageCount(0);
      setWasPaginated(false);
      return;
    }

    // Always attempt pagination for HTML content
    if (!enabled) {
      setPaginatedHtml(content);
      setPageCount(1);
      setWasPaginated(false);
      return;
    }

    setIsPaginating(true);
    setError(null);

    try {
      console.log('[usePaginatedReport] Starting pagination, content length:', content.length);
      const result = await paginateReport(content, config);
      console.log('[usePaginatedReport] Pagination complete, result length:', result.length);
      setPaginatedHtml(result);

      // Count pages in result
      const pageMatches = result.match(/class="report-page"/g);
      const count = pageMatches ? pageMatches.length : 1;
      console.log('[usePaginatedReport] Page count:', count);
      setPageCount(count);
      setWasPaginated(count > 1 || result !== content);
    } catch (err) {
      console.error('[usePaginatedReport] Pagination error:', err);
      setError(err instanceof Error ? err.message : 'Pagination failed');
      // Fall back to original content
      setPaginatedHtml(content);
      setPageCount(1);
      setWasPaginated(false);
    } finally {
      setIsPaginating(false);
    }
  }, [enabled, config]);

  const repaginate = useCallback(() => {
    if (lastContentRef.current) {
      doPagination(lastContentRef.current);
    }
  }, [doPagination]);

  useEffect(() => {
    console.log('[usePaginatedReport] useEffect triggered:', {
      htmlContentLength: htmlContent?.length || 0,
      lastContentLength: lastContentRef.current?.length || 0,
      enabled,
    });

    // Skip if content hasn't changed
    if (htmlContent === lastContentRef.current) {
      console.log('[usePaginatedReport] Content unchanged, skipping');
      return;
    }

    lastContentRef.current = htmlContent || '';

    // Call pagination immediately (no debounce for debugging)
    console.log('[usePaginatedReport] Calling doPagination immediately');
    doPagination(htmlContent || '');
  }, [htmlContent, doPagination]);

  return {
    paginatedHtml,
    isPaginating,
    error,
    pageCount,
    wasPaginated,
    repaginate,
  };
}

export default usePaginatedReport;
