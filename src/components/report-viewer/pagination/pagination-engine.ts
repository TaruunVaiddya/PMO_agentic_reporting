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
 *   - Atomic  : canvas / img / svg / chart containers — move to next page and
 *               scale-down if still too tall (never clip).
 *   - data-paginate="keep" : agent hint to keep an element whole on one page.
 *
 * ─── KEY FIX: h-screen / explicit-height block detection ───────────────────
 * Agent-generated reports often wrap all content in a single outer div with
 * `h-screen`, `height:100vh`, `height:800px`, etc. This forces the div's
 * offsetHeight to a fixed value (e.g. 900px) even though its real content
 * (scrollHeight) may be 2000px+.
 *
 * The paginator measured offsetHeight, saw 900 < 1047 (A4 available), and
 * placed the whole div on page 1 as a single unit. The page's overflow:hidden
 * then silently clipped everything past the A4 boundary — rows were lost.
 *
 * Fix: in Attempt 1 of smartPlace, after a block "fits" by height, also check
 * whether scrollHeight > offsetHeight + threshold. If so, the element has an
 * explicit height clipping its real content — recurse into it instead.
 *
 * ─── KEY FIX: Block routing (blank page bug) ────────────────────────────────
 * Blocks ALWAYS go through splitBlock(). The "fits on a fresh page" shortcut
 * is removed for blocks — it would skip the split and leave blank gaps.
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


export function combineReportHtmls(htmlStrings: string[]): string {
  if (htmlStrings.length === 0) return '';
  if (htmlStrings.length === 1) return stripMarkdownCodeFences(htmlStrings[0]);

  const heads: string[] = [];
  const bodies: string[] = [];
    htmlStrings.forEach((rawHtml, i) => {
        const html = stripMarkdownCodeFences(rawHtml).replace(
          /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi,
          '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">'
        );
        const scope = `rs${i}`;

        const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        let headContent = headMatch ? headMatch[1] : '';  // ← let not const

        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let body = bodyMatch ? bodyMatch[1] : html;

        // Build ids array first
        const ids: string[] = [];
        const idRegex = /\bid="([^"]+)"/g;
        let m: RegExpExecArray | null;
        while ((m = idRegex.exec(body)) !== null) {
          if (!ids.includes(m[1])) ids.push(m[1]);
        }
        ids.sort((a, b) => b.length - a.length);

        // Scope body HTML ids
        ids.forEach(id => {
          body = body.replace(
            new RegExp(`\\bid="${escapeRegex(id)}"`, 'g'),
            `id="${scope}-${id}"`
          );
        });

        // Scope JS references
        ids.forEach(id => {
          body = body.replace(
            new RegExp(`getElementById\\s*\\(\\s*['"]${escapeRegex(id)}['"]\\s*\\)`, 'g'),
            `getElementById('${scope}-${id}')`
          );
          body = body.replace(
            new RegExp(`querySelector\\s*\\(\\s*['"]#${escapeRegex(id)}['"]\\s*\\)`, 'g'),
            `querySelector('#${scope}-${id}')`
          );
        });

        // ← AFTER ids is built: rewrite CSS selectors in <head> <style> blocks
        ids.forEach(id => {
          headContent = headContent.replace(
            /<style([^>]*)>([\s\S]*?)<\/style>/gi,
            (_m, attrs, css) => {
              const newCss = css.replace(
                new RegExp(`#${escapeRegex(id)}(?=[\\s,{:>+~\\[\\)\\(\\n\\r])`, 'g'),
                `#${scope}-${id}`
              );
              return `<style${attrs}>${newCss}</style>`;
            }
          );
        });

        heads.push(headContent);
        bodies.push(body);
    });

  // Deduplicate head lines so Tailwind/fonts don't load 4×
  const seenBlocks = new Set<string>();
  const seenLines  = new Set<string>();
  const dedupedParts: string[] = [];

  for (const head of heads) {
    // Extract and deduplicate complete <style> blocks as a unit
    const remaining = head.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
      const key = match.trim();
      if (!seenBlocks.has(key)) {
        seenBlocks.add(key);
        dedupedParts.push(match);
      }
      return '';
    });

    // Deduplicate remaining lines (<link>, <meta>, etc.) individually
    remaining.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !seenLines.has(t)) {
        seenLines.add(t);
        dedupedParts.push(line);
      }
    });
  }

const deduped = dedupedParts.join('\n');

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${deduped}
      </head>
      <body>
      ${bodies.join('\n<div class="page-break"></div>\n')}
      </body>
      </html>`;
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
  // Swap Tailwind Play CDN (JS runtime, blocked by CSP when allow-same-origin
  // is present) with pre-built static CSS. No JS needed, no timing races.
  const processedHtml = htmlString.replace(
    /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi,
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">'
  );

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedHtml, 'text/html'); 

  let headContent = doc.head?.innerHTML || '';
  const bodyClass   = doc.body?.className || '';

  const header =
    doc.querySelector('[data-template="header"]') ||
    doc.querySelector('header');
  const headerHtml = header?.outerHTML || '';

  const footer =
    doc.querySelector('[data-template="footer"]') ||
    doc.querySelector('footer');
  const footerHtml = footer?.outerHTML || '';

  const main =
    doc.querySelector('[data-template="content"]')  ||
    doc.querySelector('[data-template="contents"]') ||
    doc.querySelector('main');

  let mainContent = '';
  if (main) {
    mainContent = main.outerHTML;
  } else {
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

  const scopeId = `r${Math.random().toString(36).slice(2, 8)}`;

  const scopeDoc = parser.parseFromString(
    `<div id="${scopeId}">${mainContent}</div>`,
    'text/html'
  );
  const scopeRoot = scopeDoc.getElementById(scopeId)!;

  // Build old→new id map and rename every element
  const idMap: Record<string, string> = {};
  scopeRoot.querySelectorAll('[id]').forEach(el => {
    const oldId = el.getAttribute('id')!;
    const newId = `${scopeId}-${oldId}`;
    idMap[oldId] = newId;
    el.setAttribute('id', newId);
  });

  mainContent = scopeRoot.innerHTML;
  let updatedHeadContent = headContent;
  Object.entries(idMap).forEach(([oldId, newId]) => {
    updatedHeadContent = updatedHeadContent.replace(
      /<style([^>]*)>([\s\S]*?)<\/style>/gi,
      (_m, attrs, css) => {
        const newCss = css.replace(
          new RegExp(`#${escapeRegex(oldId)}(?=[\\s,{:>+~\\[\\)\\(\\n\\r])`, 'g'),
          `#${newId}`
        );
        return `<style${attrs}>${newCss}</style>`;
      }
    );
  });
  headContent = updatedHeadContent;

  // Rewrite scripts: patch getElementById / querySelector calls to use
  // the new namespaced ids, and scope querySelector to the report root.
  const bodyScripts: string[] = [];
  doc.body?.querySelectorAll('script:not([src])').forEach(script => {
    if (header?.contains(script) || footer?.contains(script)) return;
    let src = script.textContent?.trim() || '';
    if (!src) return;

    // Replace getElementById('oldId') → getElementById('scopeId-oldId')
    Object.entries(idMap).forEach(([oldId, newId]) => {
      src = src.replace(
        new RegExp(`getElementById\\s*\\(\\s*(['"\`])${escapeRegex(oldId)}\\1\\s*\\)`, 'g'),
        `getElementById('${newId}')`
      );
    });

    bodyScripts.push(src);
  });
  // ── END ID SCOPING FIX ──────────────────────────────────────────────────

  return { headContent, headerHtml, footerHtml, mainContent, bodyClass, bodyScripts };
}

// Helper used by the scoping fix
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    .content-source {
      position: fixed !important;
      left: -9999px !important;
      top: 0 !important;
      opacity: 0 !important;                  // ← visible to framework scanners
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

  const zoomStyle      = contentScale !== 1 ? `zoom:${contentScale}!important;` : '';
  const contentPadding = `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`;

  const encodedScripts = JSON
    .stringify(bodyScripts)
    .replace(/<\/script>/gi, '<\\/script>');

  return `
(function () {

  function waitForLoad(cb) {
    if (document.readyState === 'complete') { setTimeout(cb, 100); return; }
    var done = false;
    function go() { if (done) return; done = true; setTimeout(cb, 100); }
    window.addEventListener('load', go);
    setTimeout(go, 2500);
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
    // JSON-encoded array executed via eval() — template literals, backticks,
    // etc. all survive. window.addEventListener patched so DOMContentLoaded
    // handlers fire immediately (event already fired).

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
        try { (0, eval)(src); } catch (e) {
          console.error('[Paginator] Body script eval error:', e);
        }
      });

      window.addEventListener = _origAddEvent;
    }

    // ── STEP 2: Wait for DOMContentLoaded callbacks + Chart.js paint ─────
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

          var cs = window.getComputedStyle(content);
          availableHeight = content.clientHeight
            - (parseFloat(cs.paddingTop)    || 0)
            - (parseFloat(cs.paddingBottom) || 0);

          return content;
        }

        function outerHeight(el) {
          if (!el) return 0;
          var s = window.getComputedStyle(el);
          return el.offsetHeight
            + (parseFloat(s.marginTop)    || 0)
            + (parseFloat(s.marginBottom) || 0);
        }

        function resizeCharts(el) {
          if (!window.Chart) return;
          el.querySelectorAll('canvas').forEach(function (c) {
            var chart = window.Chart.getChart(c);
            if (chart) { try { chart.resize(); } catch (e) {} }
          });
        }

        function elementType(el) {
          var tag = (el.tagName || '').toLowerCase();
          if (el.dataset && el.dataset.paginate === 'keep') return 'atomic';
          if (tag === 'table') return 'table';
          if (tag === 'canvas' || tag === 'img' || tag === 'svg') return 'atomic';
          if (el.querySelector && el.querySelector('canvas')) return 'atomic';
          var blockTags = ['div','section','article','main','ul','ol','dl','figure','aside'];
          if (blockTags.indexOf(tag) >= 0 && el.children && el.children.length > 0) return 'block';
          return 'atomic';
        }

        // ── SPLIT: TABLE ─────────────────────────────────────────────────
        // Moves rows one-by-one, fills remaining space on the current page,
        // then continues on new pages. <thead> repeated on every page.
        function splitTable(table) {
          var thead   = table.querySelector('thead');
          var tbody   = table.querySelector('tbody') || table;
          var allRows = Array.from(tbody.querySelectorAll(':scope > tr'));

          if (allRows.length === 0) { placeAtomic(table); return; }

          function makeShell() {
            var t = table.cloneNode(false);
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

              if (currentHeight + tableH > availableHeight && rowsFit > 0) {
                shell.tbody.removeChild(allRows[r]);
                break;
              }

              // First row still overflows — open a fresh page and retry
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

        // ── SPLIT: BLOCK ─────────────────────────────────────────────────
        // Unwraps the container and recurses each child through smartPlace.
        function splitBlock(el) {
          var kids = Array.from(el.children);
          if (kids.length === 0) { placeAtomic(el); return; }
          for (var c = 0; c < kids.length; c++) smartPlace(kids[c]);
        }

        // ── SPLIT: ATOMIC ────────────────────────────────────────────────
        // Cannot split — move to a new page; scale-down if still too tall.
        function placeAtomic(el) {
          if (currentHeight > 0) createNewPage();
          currentContent.appendChild(el);
          resizeCharts(el);
          var h = outerHeight(el);
          if (h > availableHeight) {
            var scale = (availableHeight / h) * 0.98;
            el.style.transformOrigin = 'top left';
            el.style.transform       = 'scale(' + scale + ')';
            el.style.marginBottom    = ((h * scale) - h) + 'px';
            h = availableHeight;
          }
          currentHeight += h;
        }

        // ────────────────────────────────────────────────────────────────────
        // MAIN PLACER
        //
        // Decision tree:
        //
        // 1. .page-break hint → force new page.
        //
        // 2. Attempt to fit on current page (offsetHeight-based):
        //    a. For BLOCK elements: also check scrollHeight > offsetHeight.
        //       If true, the block has an explicit height (h-screen, height:Xpx)
        //       that is hiding its real content. We must recurse into it —
        //       otherwise the page's overflow:hidden clips the invisible rows.
        //       This is the fix for the "rows truncated, not on next page" bug.
        //    b. For all other types: if it fits, place it.
        //
        // 3. Doesn't fit — type-based routing:
        //    TABLE  → splitTable  (fills remaining space, then continues)
        //    BLOCK  → splitBlock  (always recurse — never jump whole)
        //    ATOMIC → move to fresh page; scale-down if taller than a page
        // ────────────────────────────────────────────────────────────────────
        function smartPlace(child) {

          // ── 1. Page-break hint ───────────────────────────────────────────
          var isBreak = child.classList && child.classList.contains('page-break');
          if (!isBreak && child.querySelector) {
            var inner = child.querySelector('.page-break');
            if (inner && child.textContent.trim() === '') isBreak = true;
          }
          if (isBreak) { if (currentHeight > 0) createNewPage(); return; }

          // ── 2. Try to fit on the current page ────────────────────────────
          currentContent.appendChild(child);
          resizeCharts(child);
          var h    = outerHeight(child);
          var type = elementType(child);

          if (currentHeight + h <= availableHeight) {

            // ── 2a. Block overflow check (THE KEY FIX) ───────────────────
            //
            // Agent reports often wrap everything in one outer div with
            // h-screen / height:100vh / height:Xpx. offsetHeight = viewport
            // height (e.g. 900px) which fits inside the A4 content area
            // (~1047px), so the paginator would place it whole. But the real
            // content (scrollHeight) may be 2000px+, and the page's
            // overflow:hidden silently clips all the excess rows.
            //
            // When scrollHeight substantially exceeds offsetHeight, the
            // element has an explicit height constraint hiding its content.
            // Remove it from the page and recurse so every child is placed
            // individually and table rows flow to continuation pages.
            if (type === 'block' && child.scrollHeight > child.offsetHeight + 10) {
              // Strip explicit height constraints so the element can flow naturally,
              // preserving its own text-align/flex/etc. context for children.
              child.style.height = 'auto';
              child.style.minHeight = '0';
              child.style.maxHeight = 'none';
              child.style.overflow = 'visible';
              ['h-screen', 'h-full', 'min-h-screen', 'max-h-screen',
              'overflow-hidden', 'overflow-auto', 'overflow-scroll'].forEach(function (cls) {
                  child.classList.remove(cls);
              });

              var strippedH = outerHeight(child);

              // If it fits now, keep it whole — all styles/centering preserved.
              if (currentHeight + strippedH <= availableHeight) {
                  currentHeight += strippedH;
                  return;
              }

              // Truly multi-page — recurse into children.
              currentContent.removeChild(child);
              splitBlock(child);
              return;
          }

            currentHeight += h; // fits and content is not hidden — done
            return;
          }

          // Doesn't fit on current page — remove and route by type
          currentContent.removeChild(child);

          // ── 3a. TABLE ────────────────────────────────────────────────────
          if (type === 'table') {
            splitTable(child);
            return;
          }

          // ── 3b. BLOCK — always recurse, never jump to fresh page whole ───
          if (type === 'block') {
            splitBlock(child);
            return;
          }

          // ── 3c. ATOMIC ────────────────────────────────────────────────────
          if (h <= availableHeight) {
            createNewPage();
            currentContent.appendChild(child);
            resizeCharts(child);
            currentHeight = outerHeight(child);
          } else {
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

        contentSource.style.display = 'none';
        if (headerTpl) headerTpl.style.display = 'none';
        if (footerTpl) footerTpl.style.display = 'none';

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
        if (contentSource) {
          contentSource.style.position   = 'static';
          contentSource.style.visibility = 'visible';
          contentSource.style.left       = 'auto';
        }
        finish(1);
      }
    }

   function finish(count) {
      window.__paginationComplete = true;
      // Double rAF: gives Tailwind CDN / other dynamic CSS frameworks
      // two frame cycles to process moved elements before the parent
      // reveals the iframe. Without this, elements appear unstyled
      // for a few frames because MutationObserver fires asynchronously
      // after the DOM moves that pagination performs.
      requestAnimationFrame(function () {
          requestAnimationFrame(function () {
              window.parent.postMessage({ type: 'PAGINATION_COMPLETE', pageCount: count }, '*');
          });
      });
  }

  });

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

  const cleanedHtml  = stripMarkdownCodeFences(htmlString);
  const finalConfig  = { ...DEFAULT_CONFIG, ...config };
  const parsed       = parseHtmlDocument(cleanedHtml);
  const pageCSS      = generatePageCSS(finalConfig);
  const paginationJS = generatePaginationScript(finalConfig, parsed.bodyScripts);

  const pageW    = finalConfig.pageWidthMm;
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

  <div class="content-source" style="width:${contentW}mm;">
    ${parsed.mainContent}
  </div>

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
  }, [enabled, config, clearSafetyTimeout]);

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
      config.pageWidthMm  !== lastConfigRef.current.pageWidthMm  ||
      config.pageHeightMm !== lastConfigRef.current.pageHeightMm ||
      config.contentScale !== lastConfigRef.current.contentScale;

    if (htmlContent === lastContentRef.current && !configChanged) return;

    lastContentRef.current = htmlContent || '';
    lastConfigRef.current  = config;
    doPagination(htmlContent || '');
  }, [htmlContent, config, doPagination]);

  return { paginatedHtml, isPaginating, error, pageCount, wasPaginated, repaginate };
}

export default usePaginatedReport;