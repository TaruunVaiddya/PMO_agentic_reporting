'use client';

/**
 * Report Pagination Engine
 *
 * Splits HTML report content across A4 page containers.
 *
 * Key design principle: content styles are NEVER touched.
 * No padding, margins, or style overrides are injected into report content.
 * The staging area and pages share the same width, so element dimensions are
 * consistent between measurement and placement.
 *
 * Smart splitting:
 *   - Tables  : split at <tr> boundaries; <thead> repeated on every page
 *   - Blocks  : always recurse into children
 *   - Atomics : move whole to next page; scale down only if taller than a page
 *   - data-paginate="keep" : treat element as atomic (never split)
 *   - .page-break : force a new page
 *
 * Explicit-height fix:
 *   Agent reports sometimes wrap content in a div with h-screen / height:100vh.
 *   offsetHeight reads the clamped value and the element appears to "fit" on one
 *   page, but overflow:hidden on the page clips the real content. We detect this
 *   by comparing offsetHeight vs scrollHeight and strip the constraint so
 *   children can flow naturally across pages.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationConfig {
  pageWidthMm?: number;
  pageHeightMm?: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  pageWidthMm: 210,
  pageHeightMm: 297,
} as const;

// ─── Utility ──────────────────────────────────────────────────────────────────

function stripMarkdownCodeFences(content: string): string {
  const trimmed = content.trim();
  const patterns = [
    /^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/,
    /^```(?:html)?\s*([\s\S]*?)\s*```$/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return trimmed;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Combine multiple report HTMLs (multi-page agent output) ─────────────────
// Scopes IDs per report to avoid Chart.js / DOM conflicts when concatenating.

export function combineReportHtmls(htmlStrings: string[]): string {
  if (htmlStrings.length === 0) return '';
  if (htmlStrings.length === 1) return stripMarkdownCodeFences(htmlStrings[0]);

  const heads: string[] = [];
  const bodies: string[] = [];

  htmlStrings.forEach((rawHtml, i) => {
    const html = stripMarkdownCodeFences(rawHtml).replace(
      /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi,
      '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">',
    );
    const scope = `rs${i}`;

    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    let headContent = headMatch ? headMatch[1] : '';
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let body = bodyMatch ? bodyMatch[1] : html;

    const ids: string[] = [];
    const idRegex = /\bid="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(body)) !== null) {
      if (!ids.includes(m[1])) ids.push(m[1]);
    }
    ids.sort((a, b) => b.length - a.length);

    ids.forEach(id => {
      body = body.replace(new RegExp(`\\bid="${escapeRegex(id)}"`, 'g'), `id="${scope}-${id}"`);
      body = body.replace(
        new RegExp(`getElementById\\s*\\(\\s*['"]${escapeRegex(id)}['"]\\s*\\)`, 'g'),
        `getElementById('${scope}-${id}')`,
      );
      body = body.replace(
        new RegExp(`querySelector\\s*\\(\\s*['"]#${escapeRegex(id)}['"]\\s*\\)`, 'g'),
        `querySelector('#${scope}-${id}')`,
      );
      headContent = headContent.replace(
        /<style([^>]*)>([\s\S]*?)<\/style>/gi,
        (_m, attrs, css) => {
          const newCss = css.replace(
            new RegExp(`#${escapeRegex(id)}(?=[\\s,{:>+~\\[\\)\\(\\n\\r])`, 'g'),
            `#${scope}-${id}`,
          );
          return `<style${attrs}>${newCss}</style>`;
        },
      );
    });

    heads.push(headContent);
    bodies.push(body);
  });

  // Deduplicate <style> blocks and <link>/<meta> lines so assets load once
  const seenBlocks = new Set<string>();
  const seenLines  = new Set<string>();
  const dedupedParts: string[] = [];

  for (const head of heads) {
    const remaining = head.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, match => {
      const key = match.trim();
      if (!seenBlocks.has(key)) { seenBlocks.add(key); dedupedParts.push(match); }
      return '';
    });
    remaining.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !seenLines.has(t)) { seenLines.add(t); dedupedParts.push(line); }
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${dedupedParts.join('\n')}
</head>
<body>
${bodies.join('\n<div class="page-break"></div>\n')}
</body>
</html>`;
}

// ─── Default page padding ─────────────────────────────────────────────────────
// Always applied. The staging div is sized to match (pageWidth - left - right)
// so element measurements in staging are consistent with the padded page.

const PAGE_PAD_TOP_MM    = 8;
const PAGE_PAD_BOTTOM_MM = 8;
const PAGE_PAD_LEFT_MM   = 10;
const PAGE_PAD_RIGHT_MM  = 10;

// ─── Extract head / body from HTML string ─────────────────────────────────────

function extractFromHtml(html: string): {
  head: string;
  body: string;
  bodyScripts: string[];
} {
  // Replace Tailwind Play CDN (JS runtime) with pre-built static CSS.
  const processed = html.replace(
    /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi,
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">',
  );

  const headMatch = processed.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch?.[1] ?? '';

  const bodyMatch = processed.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch?.[1] ?? processed;

  // Pull out inline scripts so we can run them after DOM setup inside the iframe
  const bodyScripts: string[] = [];
  body = body.replace(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi, (_, src) => {
    const trimmed = src.trim();
    if (trimmed) bodyScripts.push(trimmed);
    return '';
  });

  return { head, body, bodyScripts };
}

// ─── Pagination script (runs inside the iframe) ────────────────────────────────
//
//   .content-source   — off-screen staging div; width = pageWidth - side pads
//                       content is moved from here into pages
//   .pages-container  — visible scroll area; holds .a4-page boxes
//   .a4-page          — exact A4 dimensions, overflow:hidden, padding set by CSS

function buildPaginationScript(
  cfg: typeof DEFAULT_CONFIG,
  bodyScripts: string[],
): string {
  const encoded = JSON.stringify(bodyScripts).replace(/<\/script>/gi, '<\\/script>');

  return `
(function () {

  // ── Wait for full load ────────────────────────────────────────────────────
  function waitForLoad(cb) {
    if (document.readyState === 'complete') { setTimeout(cb, 150); return; }
    var fired = false;
    function go() { if (fired) return; fired = true; setTimeout(cb, 150); }
    window.addEventListener('load', go);
    setTimeout(go, 3000);
  }

  waitForLoad(function () {

    // ── Run body scripts (Chart.js initialisers, etc.) ──────────────────────
    var scripts = ${encoded};
    if (scripts.length > 0) {
      // Patch addEventListener so DOMContentLoaded handlers fire immediately
      // — the event has already fired by the time we run.
      var origAE = window.addEventListener.bind(window);
      window.addEventListener = function (t, h, o) {
        if (t === 'DOMContentLoaded') {
          setTimeout(function () { try { h(new Event(t)); } catch (e) {} }, 0);
          return;
        }
        return origAE(t, h, o);
      };
      scripts.forEach(function (s) {
        try { (0, eval)(s); } catch (e) { console.error('[Paginator] script error:', e); }
      });
      window.addEventListener = origAE;
    }

    // Allow a frame for Chart.js / other initialisers to paint
    requestAnimationFrame(function () { setTimeout(run, 200); });
  });

  // ── Core pagination engine ────────────────────────────────────────────────
  function run() {
    try {
      var source    = document.querySelector('.content-source');
      var container = document.querySelector('.pages-container');
      if (!source || !container) { finish(1); return; }

      var children = Array.from(source.children);
      container.innerHTML = '';

      // Current page state
      var page   = null;  // current .a4-page element
      var pageH  = 0;     // px used on the current page
      var avail  = 0;     // px available on the current page (= page.clientHeight)

      // ── Create a new page ─────────────────────────────────────────────────
      function newPage() {
        page  = document.createElement('div');
        page.className = 'a4-page';
        container.appendChild(page);
        pageH = 0;
        // avail = clientHeight minus CSS padding (top+bottom) on the page
        var cs = window.getComputedStyle(page);
        avail  = page.clientHeight
               - (parseFloat(cs.paddingTop)    || 0)
               - (parseFloat(cs.paddingBottom) || 0);
        return page;
      }

      // ── Outer height including margins ────────────────────────────────────
      function oh(el) {
        var s = window.getComputedStyle(el);
        return el.offsetHeight
          + (parseFloat(s.marginTop)    || 0)
          + (parseFloat(s.marginBottom) || 0);
      }

      // ── Resize Chart.js canvases after DOM moves ──────────────────────────
      function resizeCharts(el) {
        if (!window.Chart) return;
        el.querySelectorAll('canvas').forEach(function (c) {
          var ch = window.Chart.getChart(c);
          if (ch) try { ch.resize(); } catch (e) {}
        });
      }

      // ── Classify element ─────────────────────────────────────────────────
      //   table  → splitTable
      //   block  → splitBlock (recurse into children)
      //   atomic → cannot split; move whole or scale down
      function elType(el) {
        var tag = (el.tagName || '').toLowerCase();
        if (el.dataset && el.dataset.paginate === 'keep') return 'atomic';
        if (tag === 'table')                               return 'table';
        if (tag === 'canvas' || tag === 'img' || tag === 'svg') return 'atomic';
        if (el.querySelector && el.querySelector('canvas')) return 'atomic';
        var blockTags = ['div','section','article','main','ul','ol','dl','figure','aside','nav'];
        if (blockTags.indexOf(tag) >= 0 && el.children && el.children.length > 0) return 'block';
        return 'atomic';
      }

      // ── TABLE split ───────────────────────────────────────────────────────
      // Fills remaining space on the current page row-by-row, then continues
      // on new pages. <thead> is cloned and repeated on every continuation.
      function splitTable(table) {
        var thead = table.querySelector('thead');
        var tbody = table.querySelector('tbody') || table;
        var rows  = Array.from(tbody.querySelectorAll(':scope > tr'));
        if (!rows.length) { placeAtomic(table); return; }

        function shell() {
          var t  = table.cloneNode(false);
          t.style.width = '100%';
          if (thead) t.appendChild(thead.cloneNode(true));
          var tb = document.createElement('tbody');
          t.appendChild(tb);
          return { tbl: t, tb: tb };
        }

        var ri = 0;
        while (ri < rows.length) {
          var s   = shell();
          page.appendChild(s.tbl);
          var fit = 0;

          for (var r = ri; r < rows.length; r++) {
            s.tb.appendChild(rows[r]);
            var h = oh(s.tbl);

            // Row pushed table over the limit and we already have other rows — stop here
            if (pageH + h > avail && fit > 0) {
              s.tb.removeChild(rows[r]);
              break;
            }

            // Very first row overflows on a non-empty page — move to a fresh page and retry
            if (pageH + h > avail && fit === 0 && pageH > 0) {
              s.tb.removeChild(rows[r]);
              page.removeChild(s.tbl);
              newPage();
              s = shell();
              page.appendChild(s.tbl);
              s.tb.appendChild(rows[r]);
            }

            fit++;
          }

          pageH += oh(s.tbl);
          ri    += fit;
          if (ri < rows.length) newPage();
        }
      }

      // ── BLOCK split ───────────────────────────────────────────────────────
      // Unwrap the container and route each child through place().
      // Never move a block as a whole unit when it doesn't fit — always recurse.
      function splitBlock(el) {
        var kids = Array.from(el.children);
        if (!kids.length) { placeAtomic(el); return; }
        kids.forEach(function (k) { place(k); });
      }

      // ── ATOMIC placement ──────────────────────────────────────────────────
      // Cannot split. Open a fresh page first; scale down only if the element
      // is taller than an entire page (never clip).
      function placeAtomic(el) {
        if (pageH > 0) newPage();
        page.appendChild(el);
        resizeCharts(el);
        var h = oh(el);
        if (h > avail) {
          var sc = (avail / h) * 0.98;
          el.style.transformOrigin = 'top left';
          el.style.transform       = 'scale(' + sc + ')';
          el.style.marginBottom    = ((h * sc) - h) + 'px';
          h = avail;
        }
        pageH += h;
      }

      // ── Main placer ───────────────────────────────────────────────────────
      function place(child) {

        // Page-break hint (.page-break class or data-paginate="break")
        var isBreak = (child.classList && child.classList.contains('page-break'))
                   || (child.dataset && child.dataset.paginate === 'break');
        if (isBreak) { if (pageH > 0) newPage(); return; }

        // Tentatively place on current page to measure
        page.appendChild(child);
        resizeCharts(child);
        var h    = oh(child);
        var type = elType(child);

        // ── Fits on current page ────────────────────────────────────────────
        if (pageH + h <= avail) {
          // Check for explicit-height block hiding its real content
          // (h-screen, height:100vh, height:Npx, etc.)
          if (type === 'block' && child.scrollHeight > child.offsetHeight + 10) {
            // Strip the height constraint so content can flow naturally
            child.style.height    = 'auto';
            child.style.minHeight = '0';
            child.style.maxHeight = 'none';
            child.style.overflow  = 'visible';
            ['h-screen','h-full','min-h-screen','max-h-screen',
             'overflow-hidden','overflow-auto','overflow-scroll'].forEach(function (c) {
              child.classList.remove(c);
            });
            var nh = oh(child);
            // Still fits after stripping — keep it whole
            if (pageH + nh <= avail) { pageH += nh; return; }
            // Now too tall — recurse into children
            page.removeChild(child);
            splitBlock(child);
            return;
          }
          // Fits as-is — commit
          pageH += h;
          return;
        }

        // ── Doesn't fit — remove and route by type ──────────────────────────
        page.removeChild(child);

        if (type === 'table') { splitTable(child);  return; }
        if (type === 'block') { splitBlock(child);  return; }

        // Atomic: move to a fresh page (or scale if taller than one page)
        if (h <= avail) {
          newPage();
          page.appendChild(child);
          resizeCharts(child);
          pageH = oh(child);
        } else {
          placeAtomic(child);
        }
      }

      // ── Kick off ──────────────────────────────────────────────────────────
      newPage();
      children.forEach(function (c) { place(c); });

      // ── Remove empty pages ────────────────────────────────────────────────
      // splitBlock / splitTable can leave a blank page at the end (or in the
      // middle) when newPage() is called but nothing gets placed on it.
      Array.from(container.querySelectorAll('.a4-page')).forEach(function (p) {
        var hasContent = false;
        for (var i = 0; i < p.children.length; i++) {
          if (p.children[i].offsetHeight > 0) { hasContent = true; break; }
        }
        if (!hasContent) p.parentNode && p.parentNode.removeChild(p);
      });

      // ── Stamp page numbers ────────────────────────────────────────────────
      var pages = container.querySelectorAll('.a4-page');
      var total = pages.length;
      pages.forEach(function (p, i) {
        p.querySelectorAll('[data-page="current"]').forEach(function (el) {
          el.textContent = String(i + 1);
        });
        p.querySelectorAll('[data-page="total"]').forEach(function (el) {
          el.textContent = String(total);
        });
      });

      source.style.display = 'none';
      finish(total);

    } catch (err) {
      console.error('[Paginator] Fatal error:', err);
      finish(1);
    }
  }

  function finish(count) {
    window.__paginationComplete = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.parent.postMessage({ type: 'PAGINATION_COMPLETE', pageCount: count }, '*');
      });
    });
  }

})();
`.trim();
}

// ─── Main export: paginateReport ─────────────────────────────────────────────

export async function paginateReport(
  htmlString: string,
  config: PaginationConfig = {},
): Promise<string> {
  if (!htmlString || htmlString.trim().length < 50) return htmlString;

  const html = stripMarkdownCodeFences(htmlString);
  const cfg  = { ...DEFAULT_CONFIG, ...config };

  // Staging div is narrowed by the side pads so element widths measured there
  // exactly match the content area inside the padded .a4-page.
  const contentWidthMm = cfg.pageWidthMm - PAGE_PAD_LEFT_MM - PAGE_PAD_RIGHT_MM;

  const { head, body, bodyScripts } = extractFromHtml(html);
  const script = buildPaginationScript(cfg, bodyScripts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${head}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }

    /* ── Outer scroll container ────────────────────────────────────────── */
    .pages-container {
      background: transparent;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      min-height: 100vh;
    }

    /* ── A4 page shell ──────────────────────────────────────────────────── */
    .a4-page {
      width: ${cfg.pageWidthMm}mm;
      height: ${cfg.pageHeightMm}mm;
      padding: ${PAGE_PAD_TOP_MM}mm ${PAGE_PAD_RIGHT_MM}mm ${PAGE_PAD_BOTTOM_MM}mm ${PAGE_PAD_LEFT_MM}mm;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      flex-grow: 0;
    }

    /* ── Staging area: off-screen, width matches page content area ─────── */
    .content-source {
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${contentWidthMm}mm;
      opacity: 0;           /* invisible but still laid out (CSS frameworks scan it) */
      pointer-events: none;
    }

    @media print {
      .pages-container { padding: 0; gap: 0; background: white; }
      .a4-page { box-shadow: none; page-break-after: always; }
      .a4-page:last-child { page-break-after: avoid; }
    }

    @media screen and (max-width: 900px) {
      .a4-page { width: 100% !important; height: auto !important; min-height: auto !important; max-height: none !important; }
    }
  </style>
</head>
<body>

  <!-- Staging area: renders content at full page width for measurement -->
  <div class="content-source">${body}</div>

  <!-- Visible area: pages are built here by the pagination script -->
  <div class="pages-container">
    <div class="a4-page" style="display:flex;align-items:center;justify-content:center;">
      <div style="color:#999;font-family:sans-serif;font-size:13px;">Formatting report\u2026</div>
    </div>
  </div>

  <script>${script.replace(/<\/script>/gi, '<\\/script>')}</script>

</body>
</html>`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function needsPagination(htmlString: string): boolean {
  return !!htmlString && htmlString.trim().length >= 100;
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsePaginatedReportOptions {
  enabled?: boolean;
  config?: PaginationConfig;
}

export interface UsePaginatedReportReturn {
  paginatedHtml: string;
  isPaginating: boolean;
  error: string | null;
  pageCount: number;
  wasPaginated: boolean;
  repaginate: () => void;
}

export function usePaginatedReport(
  htmlContent: string | undefined,
  options: UsePaginatedReportOptions = {},
): UsePaginatedReportReturn {
  const { enabled = true, config = {} } = options;

  const [paginatedHtml, setPaginatedHtml] = useState('');
  const [isPaginating,  setIsPaginating]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [pageCount,     setPageCount]     = useState(0);
  const [wasPaginated,  setWasPaginated]  = useState(false);

  const lastContentRef = useRef('');
  const lastConfigRef  = useRef<PaginationConfig>(config);
  const timeoutRef     = useRef<NodeJS.Timeout | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const doPagination = useCallback(async (content: string) => {
    if (!content) { setPaginatedHtml(''); setPageCount(0); setWasPaginated(false); return; }
    if (!enabled) { setPaginatedHtml(content); setPageCount(1); setWasPaginated(false); return; }

    setIsPaginating(true);
    setError(null);

    clearSafetyTimeout();
    timeoutRef.current = setTimeout(() => {
      console.warn('[usePaginatedReport] Timeout — forcing completion');
      setIsPaginating(false);
      setWasPaginated(true);
      setPageCount(prev => prev || 1);
    }, 12_000);

    try {
      const result = await paginateReport(content, config);
      setPaginatedHtml(result);
    } catch (err) {
      clearSafetyTimeout();
      const msg = err instanceof Error ? err.message : 'Pagination failed';
      setError(msg);
      setPaginatedHtml(content);
      setPageCount(1);
      setWasPaginated(false);
      setIsPaginating(false);
    }
  }, [enabled, config, clearSafetyTimeout]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== 'PAGINATION_COMPLETE') return;
      clearSafetyTimeout();
      setPageCount(event.data.pageCount || 1);
      setWasPaginated(true);
      setIsPaginating(false);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [clearSafetyTimeout]);

  const repaginate = useCallback(() => {
    if (lastContentRef.current) doPagination(lastContentRef.current);
  }, [doPagination]);

  useEffect(() => {
    const configChanged =
      config.pageWidthMm  !== lastConfigRef.current.pageWidthMm ||
      config.pageHeightMm !== lastConfigRef.current.pageHeightMm;

    if (htmlContent === lastContentRef.current && !configChanged) return;

    lastContentRef.current = htmlContent || '';
    lastConfigRef.current  = config;
    doPagination(htmlContent || '');
  }, [htmlContent, config, doPagination]);

  return { paginatedHtml, isPaginating, error, pageCount, wasPaginated, repaginate };
}

export default usePaginatedReport;