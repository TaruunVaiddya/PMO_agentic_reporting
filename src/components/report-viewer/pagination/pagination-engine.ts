'use client';

/**
 * pagination-engine.ts  —  A4 Report Pagination Engine  (v2)
 *
 * Architecture overview
 * ─────────────────────
 * • paginateReport(input)  →  returns a self-contained iframe srcdoc string (sync).
 *   The caller sets this as <iframe srcdoc={...} />.  Nothing else is needed for
 *   initialisation — all config is JSON-embedded in the srcdoc.
 *
 * • Inside the iframe a pagination script runs after load:
 *     1. For each source HTML page (window.__PAGES__):
 *          a. Extract <head> assets → inject into iframe <head> (deduped by hash).
 *          b. Parse <body> content into a hidden staging div (visibility:hidden,
 *             position:absolute — in-flow so CSS frameworks resolve styles).
 *          c. Run inline <script> tags from the source page via eval().
 *          d. Wait 3 animation frames (style resolution).
 *          e. Pre-pass: strip explicit height constraints from staging's
 *             direct children (h-screen, height:Xpx, overflow:hidden …).
 *          f. Run the paginator over staging → appends .a4-page nodes to #a4-scaler.
 *          g. Clear staging.
 *          h. postMessage PAGINATION_PROGRESS.
 *     2. Stamp page numbers.
 *     3. Second-pass Chart.js resize on all placed canvases.
 *     4. Start ResizeObserver → computes --fit-scale, updates scaler margin,
 *        posts FIT_SCALE to parent.
 *     5. postMessage PAGINATION_COMPLETE.
 *
 * • Parent → iframe:   { type:'SET_USER_SCALE', scale:number }
 * • iframe → parent:   { type:'PAGINATION_PROGRESS', current, total }
 *                      { type:'PAGINATION_COMPLETE',  totalPages }
 *                      { type:'FIT_SCALE',            scale }
 *
 * Scale model
 * ───────────
 * Content ALWAYS renders at true 1:1 A4 dimensions.
 * transform:scale() is applied only to #a4-scaler (never to content).
 *   --fit-scale   auto-computed  =  (viewerWidth - gutter) / pageWidthPx  (≤ 1)
 *   --user-scale  user-controlled, default 1.0
 *   --final-scale CSS calc(var(--fit-scale) * var(--user-scale))   ← used in transform
 *
 * Pagination rules
 * ────────────────
 *   TABLE  → splitTable()  — fills remaining height row-by-row; clones <thead>
 *   BLOCK  → splitBlock()  — always recurse into children; never place whole
 *   ATOMIC → placeAtomic() — move to fresh page; scale-down if taller than page
 *   data-paginate="keep"   → treated as ATOMIC (agent hint)
 *   .page-break            → force new page
 *
 * Header / footer
 * ───────────────
 * Supplied as HTML strings via PaginateReportInput (from layout.header / layout.footer).
 * Stored in <template> elements, cloned into every .a4-page.
 * NOT extracted from the source HTML — that parsing is removed entirely.
 *
 * Print
 * ─────
 * @page { size: WIDTHmm HEIGHTmm; margin:0 }
 * #a4-scaler { transform:none }  — content prints at true A4, no scaling artefacts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationMargins {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
}

export interface PaginateReportInput {
  /** One string per source report page.  Not pre-combined. */
  htmlPages: string[];
  /** From layout.header — injected verbatim into every A4 page header slot. */
  headerHtml?: string;
  /** From layout.footer — injected verbatim into every A4 page footer slot. */
  footerHtml?: string;
  orientation: 'portrait' | 'landscape';
  margins?: Partial<PaginationMargins>;
}

// PostMessage shapes (exported so layout component can import the types)
export type PaginationMessage =
  | { type: 'PAGINATION_PROGRESS'; current: number; total: number }
  | { type: 'PAGINATION_COMPLETE'; totalPages: number }
  | { type: 'FIT_SCALE'; scale: number }
  | { type: 'SET_USER_SCALE'; scale: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const PORTRAIT_W_MM  = 210;
const PORTRAIT_H_MM  = 297;
const LANDSCAPE_W_MM = 297;
const LANDSCAPE_H_MM = 210;

const DEFAULT_MARGINS: PaginationMargins = {
  topMm: 10, bottomMm: 10, leftMm: 15, rightMm: 15,
};

const MM_TO_PX = 3.7795275591; // 1 mm in CSS px at 96 dpi

// Tailwind static CSS — loaded as a base/fallback alongside the Play CDN.
// v2.2.19 provides standard utility classes; Play CDN adds JIT on top.
const TAILWIND_STATIC =
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css';

// Regex to DETECT (not strip) the Tailwind Play CDN script tag.
// Used to extract it from source HTML so we can inject it into the iframe head.
const TAILWIND_PLAY_RE =
  /<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/gi;

// Regex to capture the full Play CDN <script> tag (for extraction)
const TAILWIND_PLAY_CAPTURE_RE =
  /<script\b([^>]*)src=["'](https:\/\/cdn\.tailwindcss\.com[^"']*["'])[^>]*><\/script>/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripMarkdownFences(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return m?.[1]?.trim() ?? t;
}

function mm(v: number): number { return v * MM_TO_PX; }

// djb2-style hash for deduplication (string → short hex)
function quickHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// ─── CSS Generator ────────────────────────────────────────────────────────────

function buildIframeCSS(
  pageWmm: number, pageHmm: number, margins: PaginationMargins,
): string {
  const pageWpx = mm(pageWmm);
  const pageHpx = mm(pageHmm);

  return /* css */`
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }

    /* ── Scale variables ── */
    :root {
      --fit-scale:   1;
      --user-scale:  1;
      --final-scale: 1;   /* JS sets this = fit * user directly */
      --page-gap:    24px;
    }

    /* ── Viewer (fills iframe, scrollable) ── */
    #a4-viewer {
      position: fixed;
      inset: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: #9a9a9a;
      padding: var(--page-gap);
      box-sizing: border-box;
    }

    /* ── Scaler (transform applied here ONLY) ── */
    #a4-scaler {
      width: ${pageWpx}px;
      transform: scale(var(--final-scale));
      transform-origin: top center;
      display: flex;
      flex-direction: column;
      gap: var(--page-gap);
      margin: 0 auto;
      /* margin-bottom patched by JS to collapse dead space after scale */
    }

    /* ── Individual A4 page ── */
    .a4-page {
      width: ${pageWpx}px;
      height: ${pageHpx}px;
      min-height: ${pageHpx}px;
      max-height: ${pageHpx}px;
      background: white;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: relative;
    }

    .a4-page-header { flex-shrink: 0; flex-grow: 0; width: 100%; }

    .a4-page-content {
      flex: 1 1 auto;
      overflow: hidden;
      min-height: 0;
      width: 100%;
      padding: ${margins.topMm}mm ${margins.rightMm}mm ${margins.bottomMm}mm ${margins.leftMm}mm;
      box-sizing: border-box;
    }

    .a4-page-footer { flex-shrink: 0; flex-grow: 0; width: 100%; }

    /* ── Staging (hidden but in-flow for CSS resolution) ── */
    /*
     * Width = FULL page width (not content width).
     * Agent HTML often declares the full A4 page width on its outermost
     * container (e.g. .report-container { width: 297mm }). Giving staging
     * the same width lets the browser lay out the content at its intended
     * dimensions so heights measure correctly. The content-area margins are
     * applied by .a4-page-content padding when pages are created.
     */
    #staging {
      visibility: hidden;
      position: absolute;
      top: 0;
      left: 0;
      width: ${pageWpx}px;
      pointer-events: none;
      z-index: -1;
    }

    /* ── Scrollbar styling ── */
    * { scrollbar-width: thin; scrollbar-color: rgba(150,150,150,.4) transparent; }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: rgba(150,150,150,.4); border-radius: 3px; }
    *::-webkit-scrollbar-thumb:hover { background: rgba(150,150,150,.6); }
    *::-webkit-scrollbar-button { display: none; }

    /* ── Print ── */
    @media print {
      @page { size: ${pageWmm}mm ${pageHmm}mm; margin: 0; }

      #a4-viewer {
        position: static;
        overflow: visible;
        background: white;
        padding: 0;
      }
      #a4-scaler {
        transform: none !important;
        width: auto;
        margin: 0;
        gap: 0;
      }
      .a4-page {
        box-shadow: none;
        page-break-after: always;
        break-after: page;
        margin: 0;
      }
      .a4-page:last-child {
        page-break-after: avoid;
        break-after: auto;
      }
      #staging { display: none; }
    }

    /* ── Narrow viewports ── */
    @media screen and (max-width: ${pageWpx}px) {
      .a4-page { width: 100%; }
    }
  `;
}

// ─── Pagination JS Generator ──────────────────────────────────────────────────

function buildPaginationScript(
  pageWmm: number, pageHmm: number, margins: PaginationMargins,
): string {
  // These values are embedded as literals in the generated JS
  const pageWpx = mm(pageWmm);
  const pageHpx = mm(pageHmm);

  const contentPadding =
    `${margins.topMm}mm ${margins.rightMm}mm ${margins.bottomMm}mm ${margins.leftMm}mm`;

  return /* js */`
(function () {
'use strict';

// ── Globals ────────────────────────────────────────────────────────────────
var PAGE_W_PX      = ${pageWpx};
var PAGE_H_PX      = ${pageHpx};
var CONTENT_PAD    = '${contentPadding}';
var GUTTER_PX      = 48;   // total horizontal breathing room around pages

var viewer         = null;
var scaler         = null;
var staging        = null;
var headerTpl      = null;
var footerTpl      = null;
var currentPage    = null;  // current .a4-page-content div
var currentH       = 0;     // height used in current content area
var availableH     = 0;     // usable height in current content area
var totalPageCount = 0;

// ── Entry ──────────────────────────────────────────────────────────────────
function init() {
  viewer    = document.getElementById('a4-viewer');
  scaler    = document.getElementById('a4-scaler');
  staging   = document.getElementById('staging');
  headerTpl = document.getElementById('header-tpl');
  footerTpl = document.getElementById('footer-tpl');

  if (!viewer || !scaler || !staging) {
    console.error('[Paginator] Required DOM elements missing — aborting.');
    postToParent({ type: 'PAGINATION_COMPLETE', totalPages: 0 });
    return;
  }


  // Listen for parent messages (zoom control)
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'SET_USER_SCALE') return;
    var u = parseFloat(e.data.scale) || 1;
    document.documentElement.style.setProperty('--user-scale', String(u));
    recomputeFinalScale();
  });

  processAllPages();
}

// ── Process each source page sequentially ─────────────────────────────────
function processAllPages() {
  var pages = window.__PAGES__ || [];
  if (pages.length === 0) {
    postToParent({ type: 'PAGINATION_COMPLETE', totalPages: 0 });
    return;
  }

  var index = 0;

  function processNext() {
    if (index >= pages.length) {
      onAllPagesProcessed();
      return;
    }
    processSinglePage(pages[index], index, pages.length, function () {
      index++;
      // Yield to browser between pages so it can paint progress
      requestAnimationFrame(function () { setTimeout(processNext, 0); });
    });
  }

  processNext();
}

// ── Process a single source HTML page ─────────────────────────────────────
function processSinglePage(rawHtml, pageIndex, totalSourcePages, done) {
  // 1. Inject head assets — external scripts tracked, styles injected.
  //    Returns HEAD inline scripts (e.g. tailwind.config) to run after CDN loads.
  var headInlineScripts = injectHeadAssets(rawHtml);

  // 2. Extract body content into staging
  var body = extractBody(rawHtml);
  staging.innerHTML = body;

  // 3. Strip ONLY explicitly-marked layout elements from the body.
  if (headerTpl && headerTpl.innerHTML && headerTpl.innerHTML.trim()) {
    Array.from(staging.querySelectorAll(
      '[data-template="header"], [data-role="header"], [data-paginate-header]'
    )).forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  }
  if (footerTpl && footerTpl.innerHTML && footerTpl.innerHTML.trim()) {
    Array.from(staging.querySelectorAll(
      '[data-template="footer"], [data-role="footer"], [data-paginate-footer]'
    )).forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
  }

  // 4. Wait for ALL external CDN scripts (Chart.js, Tailwind CDN, etc.) to load.
  waitForExternalScripts(function () {

    // 5. Run HEAD inline scripts NOW — after CDN is ready.
    //    Critical: tailwind.config = {...} lives in <head> and must run after
    //    the Tailwind Play CDN loads so the 'tailwind' global exists.
    //    Without this step, custom color classes like bg-status-off-track,
    //    bg-risk-extreme etc. are never registered and render as transparent.
    headInlineScripts.forEach(function (src) {
      try { (0, eval)(src); } catch (e) {
        console.warn('[Paginator] Head script eval error:', e);
      }
    });

    // 6. Run BODY inline scripts (chart init, data binding, etc.)
    //    CDN libraries are guaranteed loaded; tailwind.config is now set.
    runInlineScripts(staging);

    // 7. Wait for Tailwind JIT (re-processes with custom config via refresh())
    //    + chart first-render to settle before measuring element heights.
    waitForStyles(function () {

      // 7. Pre-pass: strip explicit height/overflow constraints from top-level children
      prePassStripHeights(staging);

      // 8. FORCE NEW A4 PAGE for every source page after the first.
      //    Each source HTML page must always start on its own A4 page.
      if (pageIndex > 0) {
        currentPage = null;
        currentH    = 0;
      }

      // 9. Paginate
      paginateStaging();

      // 10. Clean up staging
      staging.innerHTML = '';

      // 11. Progress notification
      postToParent({ type: 'PAGINATION_PROGRESS', current: pageIndex + 1, total: totalSourcePages });

      done();
    });
  });
}


function onAllPagesProcessed() {
  stampPageNumbers();
  resizeAllCharts();
  fixHorizontalOverflow();
  setupResizeObserver();
  postToParent({ type: 'PAGINATION_COMPLETE', totalPages: totalPageCount });
}

// ── Horizontal overflow fix ───────────────────────────────────────────────
// Agent HTML often hardcodes a fixed width (e.g. width:297mm) on an outer
// container that matches the full page width — but the A4 content area is
// narrower (page width minus left+right margins). This causes the content
// to overflow horizontally. The browser then shrinks the entire viewport to
// fit, making everything look smaller than intended.
//
// Fix: after all pagination is done, scan every direct child of every page's
// content area. If a child's scrollWidth exceeds the content area's clientWidth,
// apply transform:scale() to shrink it to fit — same approach as placeAtomic
// uses for vertical overflow. transform:scale() scales the visual render only;
// it doesn't affect the DOM layout of other elements.
function fixHorizontalOverflow() {
  var pages = scaler.querySelectorAll('.a4-page-content');
  pages.forEach(function (contentArea) {
    var availW = contentArea.clientWidth;
    if (availW <= 0) return;

    Array.from(contentArea.children).forEach(function (child) {
      // Also strip any hardcoded width that's wider than the content area
      // (e.g. width:297mm on an inner div) so scrollWidth measures correctly
      var cs = window.getComputedStyle(child);
      var childW = child.scrollWidth;

      if (childW > availW + 2) {  // +2px tolerance for rounding
        var scale = availW / childW;
        // Combine with any existing transform (e.g. height scale from placeAtomic)
        var existingTransform = child.style.transform || '';
        if (existingTransform && existingTransform.indexOf('scale') !== -1) {
          // Already has a scale — take the minimum of both axes
          var existingMatch = existingTransform.match(/scale\(([^)]+)\)/);
          if (existingMatch) {
            var existingScale = parseFloat(existingMatch[1]);
            scale = Math.min(scale, existingScale);
          }
        }
        child.style.transformOrigin = 'top left';
        child.style.transform       = 'scale(' + scale + ')';
        // Collapse the dead space to the right after scaling
        child.style.marginRight = ((childW * scale) - childW) + 'px';
        // Adjust reported height so vertical layout remains correct
        var naturalH = child.offsetHeight;
        if (naturalH > 0) {
          child.style.marginBottom = ((naturalH * scale) - naturalH) + 'px';
        }
      }
    });
  });
}

// ── External script registry ──────────────────────────────────────────────
//
// All external <script src="..."> tags from every source page share a single
// registry. Each unique src URL is loaded at most ONCE for the entire report,
// regardless of how many source pages reference it. This means:
//   • Chart.js CDN → loaded once; all pages' chart scripts use the same instance
//   • Tailwind Play CDN → loaded once; JIT runs once for the whole iframe
//
// waitForExternalScripts(cb) calls cb only after every pending script has
// fired its onload or onerror event, guaranteeing that inline scripts which
// call 'new Chart(...)' or 'tailwind.config = ...' always have the library
// available.
// ── External script registry — SEQUENTIAL loading ───────────────────────────
//
// Scripts are loaded ONE AT A TIME in document order. Each script waits for
// the previous to finish before starting. This is critical for plugins that
// depend on a library being fully executed first, e.g.:
//   chart.js must execute before chartjs-plugin-datalabels
//   chartjs-plugin-datalabels runs its IIFE with window.Chart — if Chart.js
//   hasn't loaded yet, window.Chart is undefined and ChartDataLabels is never
//   created, causing ReferenceError: ChartDataLabels is not defined.
//
// All script URLs are counted upfront so waitForExternalScripts knows the
// total expected load count and doesn't fire prematurely after the first script.

var _scriptRegistry  = {};   // src → 'pending' | 'loaded' | 'error'
var _pendingCount    = 0;    // total outstanding (counted upfront, settled on load)
var _waitCallbacks   = [];   // queued waitForExternalScripts callbacks
var _scriptQueue     = [];   // { src, attrs } — sequential load queue

function _onScriptSettled(src, status) {
  _scriptRegistry[src] = status;
  _pendingCount = Math.max(0, _pendingCount - 1);
  if (_pendingCount === 0 && _waitCallbacks.length > 0) {
    var cbs = _waitCallbacks.slice();
    _waitCallbacks = [];
    cbs.forEach(function (cb) { cb(); });
  }
  // Load the next script in the queue (sequential chaining)
  _loadNextScript();
}

function _loadNextScript() {
  if (_scriptQueue.length === 0) return;
  var item = _scriptQueue.shift();
  var script = document.createElement('script');
  script.src = item.src;
  item.attrs.forEach(function (attr) { script.setAttribute(attr.name, attr.value); });
  script.onload  = function () { _onScriptSettled(item.src, 'loaded'); };
  script.onerror = function () {
    console.warn('[Paginator] External script failed to load:', item.src);
    _onScriptSettled(item.src, 'error');
  };
  document.head.appendChild(script);
}

// Call cb once all injected external scripts have settled (load or error).
// If none are pending, cb fires on the next animation frame.
function waitForExternalScripts(cb) {
  if (_pendingCount === 0) {
    requestAnimationFrame(cb);
  } else {
    _waitCallbacks.push(cb);
  }
}

// ── Head asset injection (deduped) ────────────────────────────────────────
var injectedHashes = {};

function injectHeadAssets(rawHtml) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(rawHtml, 'text/html');

  // ── External scripts — queue for sequential loading ────────────────────
  // Scan ALL scripts (head + body). Count all new ones upfront so
  // _pendingCount is correct before any onload fires.
  var newSrcs = [];
  Array.from(doc.querySelectorAll('script[src]')).forEach(function (s) {
    var src = s.getAttribute('src') || '';
    if (!src || _scriptRegistry[src]) return;
    _scriptRegistry[src] = 'queued';   // reserve before any async work
    _pendingCount++;
    var attrs = Array.from(s.attributes)
      .filter(function (a) { return a.name !== 'src'; })
      .map(function (a) { return { name: a.name, value: a.value }; });
    _scriptQueue.push({ src: src, attrs: attrs });
    newSrcs.push(src);
  });

  // Kick off the queue only if it was empty before we added items.
  // If scripts were already loading (shouldn't happen with sequential pages
  // but safe to guard), the queue will drain naturally via _loadNextScript.
  if (newSrcs.length > 0 && _scriptQueue.length === newSrcs.length) {
    _loadNextScript();
  }

  // ── <link> tags (deduped by href) ──────────────────────────────────────
  doc.head.querySelectorAll('link').forEach(function (el) {
    var href = el.getAttribute('href') || '';
    if (!href) return;
    var key = 'link:' + href;
    if (injectedHashes[key]) return;
    injectedHashes[key] = true;
    document.head.appendChild(el.cloneNode(true));
  });

  // ── <style> tags (deduped by content hash) ─────────────────────────────
  // Scan the ENTIRE document (head + body) — agent HTML often puts <style>
  // blocks in the body. Missing body-level styles causes class selectors to
  // fail silently because the CSS rule never exists in the iframe head.
  doc.querySelectorAll('style').forEach(function (el) {
    var text = el.textContent || '';
    var key  = 'style:' + hashStr(text);
    if (injectedHashes[key]) return;
    injectedHashes[key] = true;
    document.head.appendChild(el.cloneNode(true));
  });

  // ── Collect HEAD inline scripts ───────────────────────────────────────────
  // These are scripts in <head> that have no src — e.g. tailwind.config = {...}
  // They are NOT executed here. They are returned to the caller so they can be
  // run AFTER all CDN scripts have loaded (tailwind must exist before we set
  // tailwind.config) and BEFORE tailwind.refresh() is called.
  var headScripts = [];
  Array.from(doc.head.querySelectorAll('script:not([src])')).forEach(function (s) {
    var src = (s.textContent || '').trim();
    if (src) headScripts.push(src);
  });
  return headScripts;
}


function hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// ── Body extraction ───────────────────────────────────────────────────────
// Uses DOMParser — no regex literals means no backslash-stripping inside
// the TypeScript template literal that generates this script.
function extractBody(rawHtml) {
  try {
    var parser = new DOMParser();
    var doc = parser.parseFromString(rawHtml, 'text/html');
    return doc.body ? doc.body.innerHTML : rawHtml;
  } catch (e) {
    // Last-resort string fallback — find body content by index, no regex
    var bodyOpen  = rawHtml.indexOf('<body');
    var bodyClose = rawHtml.lastIndexOf('</body>');
    if (bodyOpen !== -1 && bodyClose !== -1) {
      var gtIdx = rawHtml.indexOf('>', bodyOpen);
      if (gtIdx !== -1 && gtIdx < bodyClose) {
        return rawHtml.slice(gtIdx + 1, bodyClose);
      }
    }
    // Nothing recognisable — return the whole string as-is
    return rawHtml;
  }
}

// ── Inline script runner ──────────────────────────────────────────────────
function runInlineScripts(container) {
  var scripts = Array.from(container.querySelectorAll('script:not([src])'));
  if (scripts.length === 0) return;

  // ── Two-phase DOMContentLoaded strategy ───────────────────────────────────
  //
  // PHASE 1 — COLLECT: patch addEventListener to collect (not fire) DCL
  //   handlers while each script evals. This lets every script complete its
  //   top-level declarations (const D = {...}, function buildTable, etc.)
  //   before any handler runs.
  //
  // PHASE 2 — FIRE: after ALL scripts have been eval'd, fire every collected
  //   handler synchronously. All variables the handlers close over are fully
  //   defined at this point. Elements are still in staging (not yet paginated)
  //   so document.getElementById('tbody-projects') finds them correctly.
  //
  // Why not fire synchronously mid-eval (previous attempt):
  //   In indirect eval (0, eval)(src), firing a DCL handler that references
  //   a const declared EARLIER in the same src works in theory, but in
  //   practice async-loaded library globals (ChartDataLabels) may not be
  //   ready, causing the handler to throw mid-execution and leave later
  //   getElementById calls unexecuted.
  //
  // Why not setTimeout (original attempt):
  //   Browsers fire requestAnimationFrame BEFORE setTimeout(fn, 0).
  //   The 10-rAF waitForStyles completes before the setTimeout fires,
  //   so pagination runs on empty tbodies — data appears after the fact
  //   in the wrong DOM position.
  //
  // Two-phase (collect then fire after all evals) solves both problems.

  var dclHandlers = [];

  var origWinAdd = window.addEventListener.bind(window);
  var origDocAdd = document.addEventListener.bind(document);

  window.addEventListener = function (type, handler, opts) {
    if (type === 'DOMContentLoaded') { dclHandlers.push(handler); return; }
    return origWinAdd(type, handler, opts);
  };
  document.addEventListener = function (type, handler, opts) {
    if (type === 'DOMContentLoaded') { dclHandlers.push(handler); return; }
    return origDocAdd(type, handler, opts);
  };

  // Phase 1: eval all scripts — variables defined, handlers collected
  scripts.forEach(function (script) {
    var src = script.textContent || '';
    if (!src.trim()) return;
    try { (0, eval)(src); } catch (e) {
      console.warn('[Paginator] Script eval error:', e);
    }
  });

  // Restore originals before firing handlers
  window.addEventListener   = origWinAdd;
  document.addEventListener = origDocAdd;

  // Phase 2 — fire all collected DCL handlers.
  //
  // NULL-SAFE getElementById PROXY:
  // Agent scripts call getElementById for elements that may not exist in the
  // current page's HTML (e.g. id="page-label" missing from template,
  // id="printed-on" only in the footer div). A single null dereference
  // (null.textContent = ...) throws and aborts the ENTIRE handler — all
  // subsequent calls including buildTable/innerHTML never run → empty tables.
  //
  // Fix: patch getElementById to return an orphan <div> for missing elements.
  // Setting textContent/innerHTML on a detached div is a harmless no-op.
  // Real staging elements are returned as-is.
  var _origGetById = document.getElementById.bind(document);
  document.getElementById = function (id) {
    return _origGetById(id) || document.createElement('div');
  };

  dclHandlers.forEach(function (handler) {
    try {
      handler(new Event('DOMContentLoaded'));
    } catch (e) {
      console.warn('[Paginator] DOMContentLoaded handler error:', e);
    }
  });

  // Restore real getElementById
  document.getElementById = _origGetById;
}

// ── waitFrames ────────────────────────────────────────────────────────────
function waitFrames(n, cb) {
  if (n <= 0) { cb(); return; }
  requestAnimationFrame(function () { waitFrames(n - 1, cb); });
}


// ── waitForStyles ─────────────────────────────────────────────────────────
// Waits for CSS frameworks (especially Tailwind JIT Play CDN) to finish
// generating and applying styles after content is injected into staging.
//
// Strategy:
//  1. Call tailwind.refresh() if available — triggers an immediate JIT scan
//     of all elements currently in the DOM (including staging content).
//  2. Wait 10 animation frames — at 60fps this is ~167ms, enough for:
//     • Tailwind MutationObserver to fire and generate classes
//     • Custom fonts to load (first frame renders with fallback; later frames
//       render with the web font, changing element heights)
//     • Chart.js or other init scripts to complete their first render
//
// This replaces the old waitFrames(3,...) which was too short for JIT.
function waitForStyles(cb) {
  // Trigger Tailwind JIT rescan if the Play CDN has loaded
  if (window.tailwind) {
    try { window.tailwind.refresh(); } catch (e) {}
  }
  waitFrames(10, cb);
}
// ── Pre-pass: strip height constraints ────────────────────────────────────
// Applied only to direct children of staging — enough to expose real content
// height without disrupting deeply-nested layout intent.
var HEIGHT_CLASSES = [
  'h-screen', 'h-full', 'h-auto',
  'min-h-screen', 'min-h-full',
  'max-h-screen', 'max-h-full',
  'overflow-hidden', 'overflow-auto', 'overflow-scroll',
];

function prePassStripHeights(container) {
  var pageW = PAGE_W_PX;
  Array.from(container.children).forEach(function (child) {
    // ── Strip height constraints ─────────────────────────────────────────
    child.style.height    = 'auto';
    child.style.minHeight = '0';
    child.style.maxHeight = 'none';
    child.style.overflow  = 'visible';
    HEIGHT_CLASSES.forEach(function (cls) { child.classList.remove(cls); });

    // ── Strip width constraints wider than the page ──────────────────────
    // Agent HTML often sets a fixed full-page width on the outermost
    // container (e.g. width:297mm via inline style OR a CSS class).
    // Since staging is now full page-width, anything wider than PAGE_W_PX
    // is genuinely oversized and must be reset to 100% so it reflows
    // correctly inside the content-area padding of each A4 page.
    //
    // Check offsetWidth (reflects computed CSS class widths, not just inline)
    // rather than child.style.width (only catches inline styles).
    if (child.offsetWidth > pageW + 2) {
      child.style.width    = '100%';
      child.style.maxWidth = '100%';
    } else {
      // Even if it fits, remove any explicit mm/px width declaration so
      // it reflows to 100% of the content area when moved to a page.
      var inlineW = child.style.width || '';
      if (inlineW && inlineW.indexOf('%') === -1 && inlineW !== 'auto') {
        child.style.width = '100%';
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function paginateStaging() {
  var children = Array.from(staging.children);
  if (children.length === 0) return;
  // Ensure we have at least one page started
  if (!currentPage) createNewPage();
  for (var i = 0; i < children.length; i++) smartPlace(children[i]);
}

// ── Create a new A4 page ──────────────────────────────────────────────────
// All structural elements get explicit inline styles so the layout is
// guaranteed regardless of CSS load timing or style conflicts from
// source HTML stylesheets injected into the iframe <head>.
function createNewPage() {
  totalPageCount++;

  var page = document.createElement('div');
  page.className = 'a4-page';
  // Inline styles — cannot be overridden by source HTML class rules
  page.style.cssText = [
    'width:'          + PAGE_W_PX + 'px',
    'height:'         + PAGE_H_PX + 'px',
    'min-height:'     + PAGE_H_PX + 'px',
    'max-height:'     + PAGE_H_PX + 'px',
    'overflow:hidden',
    'display:flex',
    'flex-direction:column',
    'flex-shrink:0',
    'flex-grow:0',
    'background:white',
    'box-shadow:0 4px 20px rgba(0,0,0,0.25)',
    'position:relative',
    'box-sizing:border-box',
  ].join(';');

  // ── Header ──────────────────────────────────────────────────────────────
  if (headerTpl && headerTpl.innerHTML && headerTpl.innerHTML.trim()) {
    var hd = document.createElement('div');
    hd.className   = 'a4-page-header';
    hd.style.cssText = 'flex-shrink:0;flex-grow:0;width:100%;box-sizing:border-box;';
    // innerHTML copy: works for both <template> (legacy) and hidden <div> (current)
    hd.innerHTML = headerTpl.innerHTML;
    page.appendChild(hd);
  }

  // ── Content area ────────────────────────────────────────────────────────
  var content = document.createElement('div');
  content.className   = 'a4-page-content';
  content.style.cssText = [
    'flex:1 1 auto',
    'overflow:hidden',
    'min-height:0',
    'width:100%',
    'box-sizing:border-box',
    'padding:' + CONTENT_PAD,
  ].join(';');
  page.appendChild(content);

  // ── Footer ──────────────────────────────────────────────────────────────
  if (footerTpl && footerTpl.innerHTML && footerTpl.innerHTML.trim()) {
    var ft = document.createElement('div');
    ft.className   = 'a4-page-footer';
    ft.style.cssText = 'flex-shrink:0;flex-grow:0;width:100%;box-sizing:border-box;padding:0 ' + ${mm(margins.rightMm )} + 'px ' + ${mm(margins.bottomMm)} + 'px ' + ${mm(margins.leftMm )} + 'px;';
    ft.innerHTML   = footerTpl.innerHTML;
    page.appendChild(ft);
  }

  scaler.appendChild(page);

  currentPage = content;
  currentH    = 0;

  // Compute usable height inside the content area (excluding padding).
  // Accessing clientHeight forces a synchronous layout reflow.
  var cs = window.getComputedStyle(content);
  availableH = content.clientHeight
    - (parseFloat(cs.paddingTop)    || 0)
    - (parseFloat(cs.paddingBottom) || 0);

  // Fallback: if clientHeight is still 0 (very first paint, scale not settled)
  // compute from page height minus header/footer measured heights.
  if (availableH <= 0) {
    var headerEl = page.querySelector('.a4-page-header');
    var footerEl = page.querySelector('.a4-page-footer');
    var headerH  = headerEl ? headerEl.offsetHeight : 0;
    var footerH  = footerEl ? footerEl.offsetHeight : 0;
    var marginTopPx    = ${mm(margins.topMm)};
    var marginBottomPx = ${mm(margins.bottomMm)};
    availableH = PAGE_H_PX - headerH - footerH - marginTopPx - marginBottomPx;
  }

  return content;
}

// ── Outer height including margins ────────────────────────────────────────
function outerH(el) {
  if (!el) return 0;
  var s = window.getComputedStyle(el);
  return el.offsetHeight
    + (parseFloat(s.marginTop)    || 0)
    + (parseFloat(s.marginBottom) || 0);
}

// ── Chart resize helper ───────────────────────────────────────────────────
function resizeChartsIn(el) {
  if (!window.Chart) return;
  el.querySelectorAll('canvas').forEach(function (c) {
    var chart = window.Chart.getChart(c);
    if (chart) { try { chart.resize(); } catch (_) {} }
  });
}

// ── Element type classifier ───────────────────────────────────────────────
function classifyElement(el) {
  var tag = (el.tagName || '').toLowerCase();

  // Agent hint: keep whole
  if (el.dataset && el.dataset.paginate === 'keep') return 'atomic';

  if (tag === 'table') return 'table';

  // Canvas, img, svg — always atomic
  if (tag === 'canvas' || tag === 'img' || tag === 'svg') return 'atomic';

  // Any element containing a canvas is treated as atomic (chart containers)
  if (el.querySelector && el.querySelector('canvas')) return 'atomic';

  // Block containers with children → recurse
  var blockTags = ['div','section','article','main','ul','ol','dl','figure','aside','nav'];
  if (blockTags.indexOf(tag) >= 0 && el.children && el.children.length > 0) return 'block';

  return 'atomic';
}

// ─── SPLIT: TABLE ─────────────────────────────────────────────────────────
// Fills remaining space on the current page row-by-row, continues on new pages.
// <thead> is cloned and repeated on every continuation page.
function splitTable(table) {
  var thead = table.querySelector('thead');
  var tbody = table.querySelector('tbody') || table;
  var allRows = Array.from(tbody.querySelectorAll(':scope > tr'));

  if (allRows.length === 0) { placeAtomic(table); return; }

  function makeShell() {
    var t = table.cloneNode(false);   // clones attributes (class, style) only
    t.style.width = '100%';
    if (thead) t.appendChild(thead.cloneNode(true));
    var tb = document.createElement('tbody');
    t.appendChild(tb);
    return { table: t, tbody: tb };
  }

  var rowIndex = 0;

  while (rowIndex < allRows.length) {
    var shell = makeShell();
    currentPage.appendChild(shell.table);
    var rowsFit = 0;

    for (var r = rowIndex; r < allRows.length; r++) {
      shell.tbody.appendChild(allRows[r]);
      var tableH = outerH(shell.table);

      if (currentH + tableH > availableH && rowsFit === 0 && currentH > 0) {
        // First row overflows current page — open fresh page and retry
        shell.tbody.removeChild(allRows[r]);
        currentPage.removeChild(shell.table);
        createNewPage();
        shell = makeShell();
        currentPage.appendChild(shell.table);
        shell.tbody.appendChild(allRows[r]);
        tableH = outerH(shell.table);
      }

      if (currentH + tableH > availableH && rowsFit > 0) {
        // Row pushed us over — remove it and break
        shell.tbody.removeChild(allRows[r]);
        break;
      }

      rowsFit++;
    }

    currentH += outerH(shell.table);
    rowIndex += rowsFit;
    if (rowsFit === 0) {
      // Safety: row is too tall for any page — force place it
      shell.tbody.appendChild(allRows[rowIndex]);
      currentH += outerH(shell.table);
      rowIndex++;
    }
    if (rowIndex < allRows.length) createNewPage();
  }
}

// ─── SPLIT: BLOCK ────────────────────────────────────────────────
// Unwraps the container and recurses each child through smartPlace.
// Each child is placed individually — tables get splitTable, blocks recurse.
// This is the simplest correct approach: no shell cloning, no double headers.
function splitBlock(el) {
  var kids = Array.from(el.children);
  if (kids.length === 0) { placeAtomic(el); return; }
  for (var c = 0; c < kids.length; c++) smartPlace(kids[c]);
}

// ─── SPLIT: ATOMIC ────────────────────────────────────────────────────────
// Cannot split — move to a fresh page. If still taller than a full page,
// scale it down (better than clipping).
function placeAtomic(el) {
  if (currentH > 0) createNewPage();
  currentPage.appendChild(el);
  resizeChartsIn(el);
  var h = outerH(el);
  if (h > availableH) {
    // Scale down to fit — only this element, not the content area
    var scale = (availableH / h) * 0.97;
    el.style.transformOrigin = 'top left';
    el.style.transform       = 'scale(' + scale + ')';
    el.style.marginBottom    = ((h * scale) - h) + 'px';
    h = availableH;
  }
  currentH += h;
}

// ─── MAIN PLACER ──────────────────────────────────────────────────────────
// Decision tree (see architecture doc above)
function smartPlace(child) {

  // ── Page-break hint ──────────────────────────────────────────────────────
  if (child.classList && child.classList.contains('page-break')) {
    if (currentH > 0) createNewPage();
    return;
  }

  // Strip height constraints from this element before measuring
  // (handles nested wrappers that weren't caught by the top-level pre-pass)
  child.style.height    = 'auto';
  child.style.minHeight = '0';
  child.style.maxHeight = 'none';
  child.style.overflow  = 'visible';
  HEIGHT_CLASSES.forEach(function (cls) { child.classList.remove(cls); });

  // Place tentatively in current page to measure
  currentPage.appendChild(child);
  resizeChartsIn(child);

  // ── Horizontal overflow fix ──────────────────────────────────────────────
  // If the child is wider than the content area (e.g. agent HTML declares
  // width:297mm on an element placed inside a padded content zone), scale it
  // down to fit. This prevents the page from being squished by the browser
  // to accommodate the overflow, which is the "content shrinks in viewport"
  // problem. We scale the element itself, not the whole page.
  var contentW = currentPage.clientWidth;
  if (contentW > 0 && child.scrollWidth > contentW + 4) {
    var hScale = contentW / child.scrollWidth;
    child.style.transformOrigin = 'top left';
    child.style.transform       = 'scale(' + hScale + ')';
    // Collapse the horizontal dead space so siblings don't float right
    child.style.marginRight = ((child.scrollWidth * hScale) - child.scrollWidth) + 'px';
  }

  var h    = outerH(child);
  var type = classifyElement(child);

  // ── Fits on current page ─────────────────────────────────────────────────
  if (currentH + h <= availableH) {
    // Block overflow check: scrollHeight >> offsetHeight means the element
    // has an explicit height (h-screen, height:100vh) clipping real content.
    // Recurse into it so table rows flow to continuation pages.
    if (type === 'block' && child.scrollHeight > child.offsetHeight + 10) {
      currentPage.removeChild(child);
      splitBlock(child);
      return;
    }
    currentH += h;
    return;
  }

  // ── Doesn't fit — remove and route by type ───────────────────────────────
  currentPage.removeChild(child);

  if (type === 'table') { splitTable(child); return; }

  if (type === 'block') { splitBlock(child); return; }

  // ATOMIC
  if (h <= availableH) {
    // Fits on a fresh page
    createNewPage();
    currentPage.appendChild(child);
    resizeChartsIn(child);
    currentH = outerH(child);
  } else {
    // Too tall for any page — scale down
    placeAtomic(child);
  }
}

// ── Stamp page numbers ────────────────────────────────────────────────────
function stampPageNumbers() {
  var pages = scaler.querySelectorAll('.a4-page');
  var total = pages.length;
  pages.forEach(function (page, idx) {
    page.querySelectorAll('[data-page="current"]').forEach(function (el) {
      el.textContent = String(idx + 1);
    });
    page.querySelectorAll('[data-page="total"]').forEach(function (el) {
      el.textContent = String(total);
    });
  });
}

// ── Second-pass chart resize ──────────────────────────────────────────────
// All canvases are now in their final DOM positions with final dimensions.
function resizeAllCharts() {
  if (!window.Chart) return;
  scaler.querySelectorAll('canvas').forEach(function (c) {
    var chart = window.Chart.getChart(c);
    if (chart) { try { chart.resize(); } catch (_) {} }
  });
}

// ── Scale management ─────────────────────────────────────────────────────
function recomputeFinalScale() {
  var root    = document.documentElement;
  var fitS    = parseFloat(root.style.getPropertyValue('--fit-scale'))  || 1;
  var userS   = parseFloat(root.style.getPropertyValue('--user-scale')) || 1;
  var final   = Math.round(fitS * userS * 10000) / 10000;
  root.style.setProperty('--final-scale', String(final));
  updateScrollCorrection(final);
}

function updateScrollCorrection(finalScale) {
  // Collapse the dead vertical space caused by scale < 1
  // so the scrollbar accurately reflects visual content height.
  var naturalH = scaler.scrollHeight;
  var deadPx   = naturalH * (1 - finalScale);
  // Negative margin collapses the gap below the scaled content
  scaler.style.marginBottom = '-' + Math.max(0, deadPx - 24) + 'px';
}

// ── ResizeObserver ────────────────────────────────────────────────────────
function setupResizeObserver() {
  if (typeof ResizeObserver === 'undefined') return;

  new ResizeObserver(function (entries) {
    var entry = entries[0];
    if (!entry) return;
    var viewerW  = entry.contentRect.width;
    if (viewerW === 0) return;

    var fitScale = Math.min(1, (viewerW - GUTTER_PX) / PAGE_W_PX);
    fitScale     = Math.round(fitScale * 10000) / 10000;

    document.documentElement.style.setProperty('--fit-scale', String(fitScale));
    recomputeFinalScale();
    postToParent({ type: 'FIT_SCALE', scale: fitScale });
  }).observe(viewer);

  // Trigger immediately for initial layout
  var initialW = viewer.clientWidth;
  if (initialW > 0) {
    var initialFit = Math.min(1, (initialW - GUTTER_PX) / PAGE_W_PX);
    document.documentElement.style.setProperty('--fit-scale', String(initialFit));
    recomputeFinalScale();
  }
}

// ── postMessage helper ────────────────────────────────────────────────────
function postToParent(msg) {
  try { window.parent.postMessage(msg, '*'); } catch (_) {}
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Already loaded — defer one tick so the iframe is fully painted
  setTimeout(init, 0);
}

})();
  `;
}

// ─── Main export: paginateReport ─────────────────────────────────────────────

export function paginateReport(input: PaginateReportInput): string {
  const { htmlPages, headerHtml = '', footerHtml = '', orientation, margins: userMargins } = input;

  const margins: PaginationMargins = { ...DEFAULT_MARGINS, ...userMargins };

  const pageWmm = orientation === 'landscape' ? LANDSCAPE_W_MM : PORTRAIT_W_MM;
  const pageHmm = orientation === 'landscape' ? LANDSCAPE_H_MM : PORTRAIT_H_MM;

  // Collect all head assets from every source page for initial injection.
  // The pagination script also does this per-page, but pre-injecting common
  // assets (fonts, shared styles) avoids a flash of unstyled content on
  // the first page.
  const sharedHeadParts = extractSharedHeadAssets(htmlPages);

  // Encode pages as JSON for embedding in the srcdoc
  const pagesJson = JSON.stringify(htmlPages.map(stripMarkdownFences))
    // Escape </script> inside the JSON so the browser doesn't close the tag early
    .replace(/<\/script>/gi, '<\\/script>');

  const configJson = JSON.stringify({ pageWmm, pageHmm, orientation, margins });

  const css = buildIframeCSS(pageWmm, pageHmm, margins);
  const js  = buildPaginationScript(pageWmm, pageHmm, margins);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Static Tailwind — always present, loaded once before any content -->
  <link rel="stylesheet" href="${TAILWIND_STATIC}">

  <!-- Shared assets extracted from source pages (fonts, shared styles) -->
  ${sharedHeadParts}

  <style>${css}</style>
</head>
<body>

  <!-- Staging: in-flow but invisible — CSS frameworks resolve styles here -->
  <div id="staging"></div>

  <!-- Header / footer holders: regular hidden divs — NOT <template>.
       Using live-DOM divs means Tailwind JIT scans their classes and generates
       CSS for them (e.g. footer-line, flex, justify-end, text-[9px]).
       <template> is inert: Tailwind never scans it and document.getElementById
       cannot reach its content, so data-population scripts silently fail.
       Being hidden (top:-9999px) keeps them out of the visual layout while
       staying in the live document tree. -->
  <div id="header-tpl"
       style="visibility:hidden;position:absolute;top:-9999px;left:-9999px;pointer-events:none;width:0;height:0;overflow:hidden;"
       aria-hidden="true">${headerHtml}</div>

  <div id="footer-tpl"
       style="visibility:hidden;position:absolute;top:-9999px;left:-9999px;pointer-events:none;width:0;height:0;overflow:hidden;"
       aria-hidden="true">${footerHtml}</div>

  <!-- Scrollable viewer -->
  <div id="a4-viewer">
    <div id="a4-scaler"></div>
  </div>

  <!-- Source data (embedded — no postMessage needed for init) -->
  <script>
    window.__PAGES__  = ${pagesJson};
    window.__CONFIG__ = ${configJson};
  </script>

  <!-- Pagination engine -->
  <script>${js}</script>

</body>
</html>`;
}

// ─── Head asset extractor (server-side / TS context) ─────────────────────────
// Extracts deduplicated <link> and <style> tags from all source pages to
// pre-inject into the iframe <head>. Runs in the TS/Node context (not browser).

function extractSharedHeadAssets(htmlPages: string[]): string {
  const seenLinks  = new Set<string>();
  const seenStyles = new Set<string>();
  const parts: string[] = [];
  let   playCdnTag = '';   // extracted once — injected before static CSS

  for (const rawHtml of htmlPages) {
    const html = stripMarkdownFences(rawHtml);
    // Do NOT strip the Play CDN — we want it to run for JIT class generation.
    // Capture it once for pre-injection into the iframe <head>.
    if (!playCdnTag) {
      const m = html.match(TAILWIND_PLAY_CAPTURE_RE);
      if (m) playCdnTag = m[0];
    }

    // Extract <link> tags (skip Tailwind static — already loaded separately)
    const linkRe = /<link\b([^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const tag  = m[0];
      const href = (m[1].match(/href=["']([^"']+)["']/) || [])[1] || '';
      if (!href || href === TAILWIND_STATIC) continue;
      if (seenLinks.has(href)) continue;
      seenLinks.add(href);
      parts.push(tag);
    }

    // Extract <style> blocks
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((m = styleRe.exec(html)) !== null) {
      const content = m[1].trim();
      const hash    = quickHash(content);
      if (seenStyles.has(hash)) continue;
      seenStyles.add(hash);
      parts.push(m[0]);
    }
  }

  // Prepend Play CDN so Tailwind initialises before content loads.
  if (playCdnTag) parts.unshift(playCdnTag);
  return parts.join('\n  ');
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

export interface UsePaginatedReportOptions {
  orientation: 'portrait' | 'landscape';
  headerHtml?: string;
  footerHtml?: string;
  margins?: Partial<PaginationMargins>;
  /**
   * User zoom level from toolbar. Default 1.0.
   * Changes are forwarded to the iframe via postMessage — no srcdoc regeneration.
   */
  userScale?: number;
  /**
   * The mounted iframe element. Required for forwarding userScale changes.
   * Pass iframeRef.current from the layout component.
   */
  iframeElement?: HTMLIFrameElement | null;
}

export interface UsePaginatedReportReturn {
  /** Full srcdoc string — set this as <iframe srcdoc={iframeHtml} /> */
  iframeHtml: string;
  /** True while the iframe is still paginating source pages. */
  isPaginating: boolean;
  /** Progress through source pages, e.g. { current: 2, total: 4 } */
  progress: { current: number; total: number };
  /** Total number of A4 pages produced across all source pages. */
  totalPageCount: number;
  /** Latest fitScale reported by the iframe (for optional toolbar display). */
  fitScale: number;
}

export function usePaginatedReport(
  htmlPages: string[] | undefined,
  options: UsePaginatedReportOptions,
): UsePaginatedReportReturn {
  const {
    orientation, headerHtml, footerHtml, margins,
    userScale = 1, iframeElement,
  } = options;

  const [iframeHtml,     setIframeHtml]     = useState('');
  const [isPaginating,   setIsPaginating]   = useState(false);
  const [progress,       setProgress]       = useState({ current: 0, total: 0 });
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [fitScale,       setFitScale]       = useState(1);

  // Stable ref to the most-recently-rendered iframeHtml, so the reset guard
  // in the message handler can detect stale messages from old iframes.
  const generationRef = useRef(0);

  // ── Generate srcdoc whenever source pages / layout change ─────────────────
  useEffect(() => {
    const pages = htmlPages?.filter(Boolean) ?? [];
    if (pages.length === 0) {
      setIframeHtml('');
      setIsPaginating(false);
      setProgress({ current: 0, total: 0 });
      setTotalPageCount(0);
      return;
    }

    const gen = ++generationRef.current;   // bump generation

    setIsPaginating(true);
    setProgress({ current: 0, total: pages.length });
    setTotalPageCount(0);

    const html = paginateReport({ htmlPages: pages, headerHtml, footerHtml, orientation, margins });

    // Only commit if this is still the latest generation (guards against
    // rapid input changes causing out-of-order setState calls).
    if (gen === generationRef.current) {
      setIframeHtml(html);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    htmlPages?.join('\u241E') ?? '',  // stable join — avoids deep array equality
    headerHtml,
    footerHtml,
    orientation,
    JSON.stringify(margins),          // stable comparison for partial object
  ]);

  // ── Handle messages from the iframe ───────────────────────────────────────
  useEffect(() => {
    function onMessage(event: MessageEvent<PaginationMessage>) {
      const msg = event.data;
      if (!msg?.type) return;

      switch (msg.type) {
        case 'PAGINATION_PROGRESS':
          setProgress({ current: msg.current, total: msg.total });
          break;
        case 'PAGINATION_COMPLETE':
          setTotalPageCount(msg.totalPages);
          setIsPaginating(false);
          break;
        case 'FIT_SCALE':
          setFitScale(msg.scale);
          break;
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ── Forward userScale to the live iframe (no srcdoc regeneration) ─────────
  useEffect(() => {
    if (!iframeElement?.contentWindow) return;
    const msg: PaginationMessage = { type: 'SET_USER_SCALE', scale: userScale };
    iframeElement.contentWindow.postMessage(msg, '*');
  }, [userScale, iframeElement]);

  return { iframeHtml, isPaginating, progress, totalPageCount, fitScale };
}

export default usePaginatedReport;