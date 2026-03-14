'use client';

/**
 * Report Pagination System
 *
 * Handles wrapping LLM-generated HTML reports in A4-page containers.
 * Injects a script that runs AFTER the page loads (and Tailwind generates styles)
 * to properly split content across multiple A4 pages.
 *
 * Smart split capabilities:
 *   - Tables  : ALWAYS split at <tr> boundaries when the table doesn't fit on
 *               the current page — fills remaining space before moving on.
 *               <thead> is cloned and repeated on every continuation page.
 *   - Blocks  : ALWAYS recurse into children — never jump to a fresh page whole.
 *               This prevents large blank gaps when a wrapper div contains a
 *               table or other splittable content.
 *   - Atomic  : canvas / img / svg / chart containers — move to next page and
 *               scale-down if still too tall (never clip).
 *   - data-paginate="keep" : agent hint to keep an element whole on one page.
 *
 * ─── KEY FIX: Block routing (blank page bug) ────────────────────────────────
 * The previous version had an "Attempt 2b" that moved any element fitting on a
 * fresh page to the next page whole. For block divs wrapping a table (e.g.
 * <div class="overflow-x-auto"><table>…</table></div>), this caused the entire
 * table to jump to page 2, leaving a large blank gap on page 1.
 *
 * The fix: blocks ALWAYS go through splitBlock(). The "fits on a fresh page"
 * shortcut is removed for blocks because:
 *   • If currentHeight === 0 and the block fits, Attempt 1 already placed it.
 *   • If currentHeight > 0, we must recurse to fill remaining space first.
 *   • If the block is taller than a full page, we must recurse anyway.
 * In all cases, splitBlock is correct and the shortcut is never needed.
 *
 * ─── KEY FIX: Body-script embedding ────────────────────────────────────────
 * Body scripts are JSON.stringify-encoded and executed via eval() to avoid
 * the SyntaxError caused by textual template-literal interpolation.
 *
 * ─── KEY FIX: DOMContentLoaded never re-fires ───────────────────────────────
 * window.addEventListener is temporarily patched so 'DOMContentLoaded' handlers
 * fire immediately — the event has already fired by the time we run.
 */

// ============================================================================
// Types
// ============================================================================

export interface PaginationConfig {
  pageWidthMm?: number;
  pageHeightMm?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
  marginRightMm?: number;
  /** Scale factor for page content (0-1). Use < 1 to shrink content in landscape. */
  contentScale?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<PaginationConfig> = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginTopMm: 10,
  marginBottomMm: 10,
  marginLeftMm: 15,
  marginRightMm: 15,
  contentScale: 1,
};

// ============================================================================
// Helper: strip markdown code fences
// ============================================================================

function stripMarkdownCodeFences(content: string): string {
  const trimmed = content.trim();
  const patterns = [
    /^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/,
    /^```(?:html)?\s*([\s\S]*?)\s*```$/,
    /^`{3,}(?:html)?\s*\n?([\s\S]*?)\n?\s*`{3,}$/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return trimmed;
}

// ============================================================================
// Helper: parse HTML document into layout parts
// ============================================================================

function parseHtmlDocument(htmlString: string): {
  headContent: string;
  headerHtml: string;
  footerHtml: string;
  mainContent: string;
  bodyClass: string;
  bodyScripts: string[];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const headContent = doc.head?.innerHTML || '';
  const bodyClass = doc.body?.className || '';

  // Header — prefer explicit data-template, fall back to semantic <header>
  const header =
    doc.querySelector('[data-template="header"]') ||
    doc.querySelector('header');
  const headerHtml = header?.outerHTML || '';

  // Footer — prefer explicit data-template, fall back to semantic <footer>
  const footer =
    doc.querySelector('[data-template="footer"]') ||
    doc.querySelector('footer');
  const footerHtml = footer?.outerHTML || '';

  // Main content — accept both "content" and "contents" to handle agent variance
  const main =
    doc.querySelector('[data-template="content"]') ||
    doc.querySelector('[data-template="contents"]') ||
    doc.querySelector('main');

  let mainContent = '';
  if (main) {
    mainContent = main.innerHTML;
  } else {
    // Fallback: clone body and strip known structural pieces
    const body = doc.body;
    if (body) {
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelector('header')?.remove();
      clone.querySelector('footer')?.remove();
      clone.querySelector('[data-template="header"]')?.remove();
      clone.querySelector('[data-template="footer"]')?.remove();
      clone.querySelectorAll('script').forEach(s => s.remove());
      mainContent = clone.innerHTML;
    }
  }

  // Collect inline body scripts. DOMParser does NOT execute them — we re-run
  // them inside the iframe via eval() so Chart.js / DOM renderers work.
  const bodyScripts: string[] = [];
  doc.body?.querySelectorAll('script:not([src])').forEach(script => {
    if (header?.contains(script) || footer?.contains(script)) return;
    const src = script.textContent?.trim() || '';
    if (src) bodyScripts.push(src);
  });

  return { headContent, headerHtml, footerHtml, mainContent, bodyClass, bodyScripts };
}

// ============================================================================
// CSS for A4 page layout
// ============================================================================

function generatePageCSS(config: Required<PaginationConfig>): string {
  const {
    pageWidthMm, pageHeightMm,
    marginTopMm, marginBottomMm, marginLeftMm, marginRightMm,
    contentScale,
  } = config;

  return `
    * { scrollbar-width: thin; scrollbar-color: rgba(150,150,150,.4) transparent; }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: rgba(150,150,150,.4); border-radius: 3px; }
    *::-webkit-scrollbar-thumb:hover { background: rgba(150,150,150,.6); }
    *::-webkit-scrollbar-button { display: none; }

    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }

    .a4-page-container {
      --page-scale: 1;
      background: transparent !important;
      min-height: 100vh !important;
      padding: 20px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: calc(20px * var(--page-scale)) !important;
    }

    .a4-page {
      width: ${pageWidthMm}mm !important;
      height: ${pageHeightMm}mm !important;
      min-height: ${pageHeightMm}mm !important;
      max-height: ${pageHeightMm}mm !important;
      background: white !important;
      box-shadow: 0 4px 12px rgba(0,0,0,.15) !important;
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    .a4-page-header { flex-shrink: 0 !important; flex-grow: 0 !important; }

    .a4-page-content {
      flex: 1 1 auto !important;
      overflow: hidden !important;
      padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm !important;
      min-height: 0 !important;
    }

    .a4-page-footer { flex-shrink: 0 !important; flex-grow: 0 !important; }

    /* position:fixed keeps the staging area out of scroll flow while still
       allowing CSS frameworks (Tailwind) to fully resolve classes. */
    .content-source {
      position: fixed !important;
      left: -9999px !important;
      top: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      ${contentScale !== 1 ? `zoom: ${contentScale} !important;` : ''}
    }

    @media print {
      .a4-page-container { background: white !important; padding: 0 !important; gap: 0 !important; }
      .a4-page { box-shadow: none !important; page-break-after: always; transform: none !important; margin-bottom: 0 !important; }
      .a4-page:last-child { page-break-after: avoid; }
    }

    @media screen and (max-width: 900px) {
      .a4-page {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
    }
  `;
}

// ============================================================================
// Pagination script (runs inside the iframe after load)
// ============================================================================

function generatePaginationScript(
  config: Required<PaginationConfig>,
  bodyScripts: string[] = [],
): string {
  const {
    pageWidthMm, pageHeightMm,
    marginTopMm, marginBottomMm, marginLeftMm, marginRightMm,
    contentScale,
  } = config;

  const zoomStyle = contentScale !== 1 ? `zoom:${contentScale}!important;` : '';
  const contentPadding = `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`;

  // JSON.stringify safely encodes backticks, ${, </script>, etc.
  // DO NOT textually interpolate raw script source — causes SyntaxError.
  const encodedScripts = JSON
    .stringify(bodyScripts)
    .replace(/<\/script>/gi, '<\\/script>');

  return `
(function () {

  // ── Wait for full page load (Tailwind CDN, Chart.js, fonts, images) ──────
  function waitForLoad(cb) {
    if (document.readyState === 'complete') { setTimeout(cb, 100); return; }
    var done = false;
    function go() { if (done) return; done = true; setTimeout(cb, 100); }
    window.addEventListener('load', go);
    setTimeout(go, 2500); // hard fallback if an asset never loads
  }

  waitForLoad(function () {

    var container     = document.querySelector('.a4-page-container');
    var contentSource = document.querySelector('.content-source');
    var headerTpl     = document.querySelector('.header-template');
    var footerTpl     = document.querySelector('.footer-template');

    if (!container || !contentSource) {
      console.warn('[Paginator] Missing required elements — aborting');
      finish(1);
      return;
    }

    // ── STEP 1: Run body scripts ──────────────────────────────────────────
    //
    // Scripts are JSON-encoded and executed via eval() so that template
    // literals, backticks etc. in the originals work correctly.
    //
    // window.addEventListener is patched so any 'DOMContentLoaded' handler
    // registered by the scripts fires immediately — the event has already
    // fired by the time we reach here, so without this patch those handlers
    // would silently never run (leaving tables empty, charts blank, etc.).

    var _bodyScripts = ${encodedScripts};

    if (_bodyScripts.length > 0) {
      var _origAddEvent = window.addEventListener.bind(window);

      window.addEventListener = function (type, handler, opts) {
        if (type === 'DOMContentLoaded') {
          setTimeout(function () {
            try { handler(new Event('DOMContentLoaded')); } catch (e) {
              console.error('[Paginator] DOMContentLoaded handler error:', e);
            }
          }, 0);
          return;
        }
        return _origAddEvent(type, handler, opts);
      };

      _bodyScripts.forEach(function (src) {
        try {
          (0, eval)(src); // indirect eval → runs in global (window) scope
        } catch (e) {
          console.error('[Paginator] Body script eval error:', e);
        }
      });

      // Restore real addEventListener. DOMContentLoaded callbacks are already
      // queued via setTimeout(0) and will fire on their own.
      window.addEventListener = _origAddEvent;
    }

    // ── STEP 2: Wait for eval'd scripts + DOMContentLoaded callbacks ──────
    // 200 ms covers the setTimeout(0) queued above plus a Chart.js paint frame.
    requestAnimationFrame(function () {
      setTimeout(runPagination, 200);
    });

    // ──────────────────────────────────────────────────────────────────────
    // CORE PAGINATION ENGINE
    // ──────────────────────────────────────────────────────────────────────
    function runPagination() {
      try {
        var children = Array.from(contentSource.children);
        container.innerHTML = '';

        var currentContent  = null;
        var currentHeight   = 0;
        var availableHeight = 0;
        var pageCount       = 0;

        // ── Build a new A4 page, return its content div ───────────────────
        function createNewPage() {
          pageCount++;

          var page = document.createElement('div');
          page.className = 'a4-page';
          page.style.cssText = [
            'width:${pageWidthMm}mm!important',
            'height:${pageHeightMm}mm!important',
            'min-height:${pageHeightMm}mm!important',
            'max-height:${pageHeightMm}mm!important',
            'overflow:hidden!important',
            'display:flex!important',
            'flex-direction:column!important',
            'flex-shrink:0!important',
            'flex-grow:0!important',
            'background:white!important',
            'box-shadow:0 4px 12px rgba(0,0,0,.15)!important',
            'position:relative!important',
            'margin:0 auto!important',
          ].join(';');

          if (headerTpl) {
            var hd = document.createElement('div');
            hd.className     = 'a4-page-header';
            hd.style.cssText = 'flex-shrink:0!important;flex-grow:0!important;';
            hd.innerHTML     = headerTpl.innerHTML;
            page.appendChild(hd);
          }

          var content = document.createElement('div');
          content.className     = 'a4-page-content';
          content.style.cssText = [
            'flex:1 1 auto!important',
            'overflow:hidden!important',
            'padding:${contentPadding}!important',
            'min-height:0!important',
            '${zoomStyle}',
          ].join(';');
          page.appendChild(content);

          if (footerTpl) {
            var ft = document.createElement('div');
            ft.className     = 'a4-page-footer';
            ft.style.cssText = 'flex-shrink:0!important;flex-grow:0!important;';
            ft.innerHTML     = footerTpl.innerHTML;
            page.appendChild(ft);
          }

          container.appendChild(page);
          currentContent = content;
          currentHeight  = 0;

          // Subtract padding so comparison is against real text-stack space.
          // clientHeight includes padding — without this, bottom margin overflows.
          var cs = window.getComputedStyle(content);
          availableHeight = content.clientHeight
            - (parseFloat(cs.paddingTop)    || 0)
            - (parseFloat(cs.paddingBottom) || 0);

          return content;
        }

        // ── Outer height including margins ────────────────────────────────
        function outerHeight(el) {
          if (!el) return 0;
          var s = window.getComputedStyle(el);
          return el.offsetHeight
            + (parseFloat(s.marginTop)    || 0)
            + (parseFloat(s.marginBottom) || 0);
        }

        // ── Trigger Chart.js resize after a canvas is re-parented ─────────
        function resizeCharts(el) {
          if (!window.Chart) return;
          el.querySelectorAll('canvas').forEach(function (c) {
            var chart = window.Chart.getChart(c);
            if (chart) { try { chart.resize(); } catch (e) {} }
          });
        }

        // ── Classify element for the correct split strategy ───────────────
        //
        // 'table'  → splitTable  (split rows, repeat thead)
        // 'block'  → splitBlock  (recurse into children)
        // 'atomic' → placeAtomic (move whole; scale-down if too tall)
        function elementType(el) {
          var tag = (el.tagName || '').toLowerCase();
          // Agent explicitly marks this element as indivisible
          if (el.dataset && el.dataset.paginate === 'keep') return 'atomic';
          // Native table
          if (tag === 'table') return 'table';
          // Media / canvas — can't split mid-render
          if (tag === 'canvas' || tag === 'img' || tag === 'svg') return 'atomic';
          // Any element containing a canvas (Chart.js wrapper)
          if (el.querySelector && el.querySelector('canvas')) return 'atomic';
          // Generic block containers we can safely recurse into
          var blockTags = ['div','section','article','ul','ol','dl','figure','aside'];
          if (blockTags.indexOf(tag) >= 0 && el.children && el.children.length > 0) {
            return 'block';
          }
          return 'atomic';
        }

        // ────────────────────────────────────────────────────────────────────
        // SPLIT: TABLE
        //
        // Moves rows one-by-one onto the current page, then continues onto
        // new pages until all rows are placed. <thead> is cloned and repeated
        // at the top of every page so column headers always show.
        //
        // Called both when there's content above the table (fills remaining
        // space) and when the table alone is taller than a full page.
        // ────────────────────────────────────────────────────────────────────
        function splitTable(table) {
          var thead   = table.querySelector('thead');
          var tbody   = table.querySelector('tbody') || table;
          var allRows = Array.from(tbody.querySelectorAll(':scope > tr'));

          if (allRows.length === 0) { placeAtomic(table); return; }

          // Build a shell: same table attributes + cloned thead + fresh tbody
          function makeShell() {
            var t = table.cloneNode(false); // attributes/classes only, no children
            t.style.width = '100%';
            if (thead) t.appendChild(thead.cloneNode(true));
            var tb = document.createElement('tbody');
            t.appendChild(tb);
            return { table: t, tbody: tb };
          }

          var rowIndex = 0;

          while (rowIndex < allRows.length) {
            var shell   = makeShell();
            currentContent.appendChild(shell.table);
            var rowsFit = 0;

            for (var r = rowIndex; r < allRows.length; r++) {
              shell.tbody.appendChild(allRows[r]);
              var tableH = outerHeight(shell.table);

              // Row pushed us over the limit — pull it back and stop
              if (currentHeight + tableH > availableHeight && rowsFit > 0) {
                shell.tbody.removeChild(allRows[r]);
                break;
              }

              // First row on this section still overflows (e.g. very tall row,
              // or only a little space left) — open a fresh page and retry
              if (currentHeight + tableH > availableHeight && rowsFit === 0 && currentHeight > 0) {
                shell.tbody.removeChild(allRows[r]);
                currentContent.removeChild(shell.table);
                createNewPage();
                shell = makeShell();
                currentContent.appendChild(shell.table);
                shell.tbody.appendChild(allRows[r]);
              }

              rowsFit++;
            }

            currentHeight += outerHeight(shell.table);
            rowIndex      += rowsFit;

            if (rowIndex < allRows.length) createNewPage();
          }
        }

        // ────────────────────────────────────────────────────────────────────
        // SPLIT: BLOCK
        //
        // Unwraps the container and sends each child through smartPlace().
        // The container's own styling (borders, overflow, etc.) is lost, but
        // the children are placed correctly with proper page breaks.
        //
        // Note: for table wrapper divs (e.g. <div class="overflow-x-auto">
        // <table>…</table></div>), the table's own border/styling is preserved
        // because splitTable clones the table element's attributes.
        // ────────────────────────────────────────────────────────────────────
        function splitBlock(el) {
          var kids = Array.from(el.children);
          if (kids.length === 0) { placeAtomic(el); return; }
          for (var c = 0; c < kids.length; c++) smartPlace(kids[c]);
        }

        // ────────────────────────────────────────────────────────────────────
        // SPLIT: ATOMIC
        //
        // Element cannot be split. Opens a new page, then if the element is
        // still too tall, CSS-scales it down so nothing is clipped.
        // ────────────────────────────────────────────────────────────────────
        function placeAtomic(el) {
          if (currentHeight > 0) createNewPage();
          currentContent.appendChild(el);
          resizeCharts(el);
          var h = outerHeight(el);

          if (h > availableHeight) {
            var scale = (availableHeight / h) * 0.98; // 2% breathing room
            el.style.transformOrigin = 'top left';
            el.style.transform       = 'scale(' + scale + ')';
            el.style.marginBottom    = ((h * scale) - h) + 'px';
            h = availableHeight;
          }

          currentHeight += h;
        }

        // ────────────────────────────────────────────────────────────────────
        // MAIN PLACER — entry point for every element
        //
        // Decision tree (executed in order, returns on first match):
        //
        // 1. Page-break hint (.page-break class) → force new page.
        //
        // 2. Fits on current page → append. Done.
        //    (This covers currentHeight=0 + h<=available naturally.)
        //
        // 3. Doesn't fit. Type-based routing:
        //
        //    TABLE → splitTable()
        //      • Always fills remaining space on the current page first,
        //        then continues row-by-row on new pages.
        //      • Exception: if currentHeight=0 AND table fits → placed whole
        //        (can't happen — Attempt 2 already handled that case, but
        //        kept explicit for clarity).
        //
        //    BLOCK → splitBlock()  [THE KEY FIX]
        //      • ALWAYS recurse — never jump to a fresh page whole.
        //      • Proof that shortcut is never needed:
        //        If currentHeight=0 and block fits → Attempt 2 placed it.
        //        If currentHeight=0 and block too tall → must recurse anyway.
        //        If currentHeight>0 → recurse to fill remaining space.
        //      • This is what prevents large blank gaps when a wrapper div
        //        (like <div class="overflow-x-auto">) wraps a long table.
        //
        //    ATOMIC → move to fresh page; scale-down if still too tall.
        // ────────────────────────────────────────────────────────────────────
        function smartPlace(child) {

          // ── 1. Agent page-break hint ──────────────────────────────────────
          var isBreak = child.classList && child.classList.contains('page-break');
          if (!isBreak && child.querySelector) {
            var inner = child.querySelector('.page-break');
            if (inner && child.textContent.trim() === '') isBreak = true;
          }
          if (isBreak) { if (currentHeight > 0) createNewPage(); return; }

          // ── 2. Try to fit on the current page ────────────────────────────
          currentContent.appendChild(child);
          resizeCharts(child);
          var h = outerHeight(child);

          if (currentHeight + h <= availableHeight) {
            currentHeight += h; // fits — done
            return;
          }

          // Doesn't fit — remove and route by type
          currentContent.removeChild(child);
          var type = elementType(child);

          // ── 3a. TABLE ─────────────────────────────────────────────────────
          if (type === 'table') {
            // If we're at the top of a fresh page AND the table fits whole,
            // just place it (splitTable would also work but this is faster).
            // Note: currentHeight=0 + h<=available was already caught in step 2,
            // so this branch actually means currentHeight>0 OR h>available.
            splitTable(child);
            return;
          }

          // ── 3b. BLOCK — always recurse, never jump to fresh page whole ────
          if (type === 'block') {
            splitBlock(child);
            return;
          }

          // ── 3c. ATOMIC ────────────────────────────────────────────────────
          if (h <= availableHeight) {
            // Fits on a fresh page — move it there whole
            createNewPage();
            currentContent.appendChild(child);
            resizeCharts(child);
            currentHeight = outerHeight(child);
          } else {
            // Too tall even for a fresh page — scale it down
            placeAtomic(child);
          }
        }

        // ── Kick off ──────────────────────────────────────────────────────
        createNewPage();
        for (var i = 0; i < children.length; i++) smartPlace(children[i]);

        // ── Stamp page numbers ────────────────────────────────────────────
        var pages      = container.querySelectorAll('.a4-page');
        var totalPages = pages.length;
        pages.forEach(function (page, idx) {
          page.querySelectorAll('[data-page="current"]').forEach(function (el) {
            el.textContent = String(idx + 1);
          });
          page.querySelectorAll('[data-page="total"]').forEach(function (el) {
            el.textContent = String(totalPages);
          });
        });

        // ── Hide staging elements ─────────────────────────────────────────
        contentSource.style.display = 'none';
        if (headerTpl) headerTpl.style.display = 'none';
        if (footerTpl) footerTpl.style.display = 'none';

        // ── Responsive scale on narrow screens ────────────────────────────
        var pageWidthPx = ${pageWidthMm} * 3.7795275591;
        if (typeof ResizeObserver !== 'undefined') {
          new ResizeObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.contentRect.width === 0) return;
              var scale = Math.min(1, (e.contentRect.width - 40) / pageWidthPx);
              container.style.setProperty('--page-scale', String(scale));
            });
          }).observe(container);
        }

        finish(totalPages);

      } catch (err) {
        console.error('[Paginator] Fatal error:', err);
        // Last-resort: show raw content rather than a blank screen
        if (contentSource) {
          contentSource.style.position   = 'static';
          contentSource.style.visibility = 'visible';
          contentSource.style.left       = 'auto';
        }
        finish(1);
      }
    } // end runPagination

    function finish(count) {
      window.__paginationComplete = true;
      window.parent.postMessage({ type: 'PAGINATION_COMPLETE', pageCount: count }, '*');
    }

  }); // end waitForLoad

})();
`;
}

// ============================================================================
// Main export: paginateReport
// ============================================================================

export async function paginateReport(
  htmlString: string,
  config: PaginationConfig = {},
): Promise<string> {
  if (!htmlString || htmlString.trim().length < 50) return htmlString;

  const cleanedHtml = stripMarkdownCodeFences(htmlString);
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const parsed = parseHtmlDocument(cleanedHtml);
  const pageCSS = generatePageCSS(finalConfig);
  const paginationJS = generatePaginationScript(finalConfig, parsed.bodyScripts);

  const pageW = finalConfig.pageWidthMm;
  const contentW = pageW - finalConfig.marginLeftMm - finalConfig.marginRightMm;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${parsed.headContent}
  <style>${pageCSS}</style>
</head>
<body class="${parsed.bodyClass}">

  ${parsed.headerHtml
      ? `<div class="header-template" style="position:fixed;left:-9999px;top:0;visibility:hidden;width:${pageW}mm;">${parsed.headerHtml}</div>`
      : ''}

  ${parsed.footerHtml
      ? `<div class="footer-template" style="position:fixed;left:-9999px;top:0;visibility:hidden;width:${pageW}mm;">${parsed.footerHtml}</div>`
      : ''}

  <!-- Hidden staging area: content measured here before being moved into pages -->
  <div class="content-source" style="width:${contentW}mm;">
    ${parsed.mainContent}
  </div>

  <!-- Page container — populated entirely by the pagination script below -->
  <div class="a4-page-container">
    <div class="a4-page" style="display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;color:#999;font-family:sans-serif;font-size:13px;">
        Formatting report\u2026
      </div>
    </div>
  </div>

  <script>${paginationJS}</script>

</body>
</html>`;
}

// ============================================================================
// Utility
// ============================================================================

export function needsPagination(htmlString: string): boolean {
  return !!htmlString && htmlString.trim().length >= 100;
}

// ============================================================================
// React hook
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsePaginatedReportOptions {
  /** Enable/disable pagination entirely */
  enabled?: boolean;
  /** Pagination configuration */
  config?: PaginationConfig;
}

export interface UsePaginatedReportReturn {
  /** Paginated HTML ready for an <iframe srcDoc> */
  paginatedHtml: string;
  /** True while the iframe script is still running */
  isPaginating: boolean;
  /** Non-null if an error was thrown before producing output */
  error: string | null;
  /** Page count reported by the iframe script */
  pageCount: number;
  /** True once at least one pagination cycle has completed successfully */
  wasPaginated: boolean;
  /** Force a fresh pagination pass with the last known content */
  repaginate: () => void;
}

export function usePaginatedReport(
  htmlContent: string | undefined,
  options: UsePaginatedReportOptions = {},
): UsePaginatedReportReturn {
  const { enabled = true, config = {} } = options;

  const [paginatedHtml, setPaginatedHtml] = useState('');
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [wasPaginated, setWasPaginated] = useState(false);

  const lastContentRef = useRef('');
  const lastConfigRef = useRef<PaginationConfig>(config);
  // Safety net: if PAGINATION_COMPLETE never arrives (script crash, CDN block,
  // etc.) we unblock the UI after 12 s so the spinner never hangs forever.
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const doPagination = useCallback(async (content: string) => {
    if (!content) {
      setPaginatedHtml('');
      setPageCount(0);
      setWasPaginated(false);
      return;
    }

    if (!enabled) {
      setPaginatedHtml(content);
      setPageCount(1);
      setWasPaginated(false);
      return;
    }

    setIsPaginating(true);
    setError(null);

    // Arm the safety net before the async work starts
    clearSafetyTimeout();
    timeoutRef.current = setTimeout(() => {
      console.warn('[usePaginatedReport] Timeout — forcing completion');
      setIsPaginating(false);
      setWasPaginated(true);
      setPageCount(prev => prev || 1);
    }, 12_000);

    try {
      const result = await paginateReport(content, config);
      // HTML is ready — isPaginating stays true until iframe posts PAGINATION_COMPLETE
      setPaginatedHtml(result);
    } catch (err) {
      clearSafetyTimeout();
      const msg = err instanceof Error ? err.message : 'Pagination failed';
      setError(msg);
      setPaginatedHtml(content); // fall back to raw content
      setPageCount(1);
      setWasPaginated(false);
      setIsPaginating(false);
    }
  }, [enabled, config, clearSafetyTimeout]);

  // Listen for the iframe's completion postMessage
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

  // Re-run when content or relevant config dimensions change
  useEffect(() => {
    const configChanged =
      config.pageWidthMm !== lastConfigRef.current.pageWidthMm ||
      config.pageHeightMm !== lastConfigRef.current.pageHeightMm ||
      config.contentScale !== lastConfigRef.current.contentScale;

    if (htmlContent === lastContentRef.current && !configChanged) return;

    lastContentRef.current = htmlContent || '';
    lastConfigRef.current = config;

    doPagination(htmlContent || '');
  }, [htmlContent, config, doPagination]);

  return { paginatedHtml, isPaginating, error, pageCount, wasPaginated, repaginate };
}

export default usePaginatedReport;