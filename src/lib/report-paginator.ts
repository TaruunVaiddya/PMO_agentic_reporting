/**
 * Report Pagination System
 *
 * Handles wrapping LLM-generated HTML reports in A4-page containers.
 * Injects a script that runs AFTER the page loads (and Tailwind generates styles)
 * to properly split content across multiple A4 pages.
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
  pageWidthMm: 210,    // A4 width
  pageHeightMm: 297,   // A4 height
  marginTopMm: 10,
  marginBottomMm: 10,
  marginLeftMm: 15,
  marginRightMm: 15,
  contentScale: 1,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Strip markdown code fences from HTML content
 */
function stripMarkdownCodeFences(content: string): string {
  const trimmed = content.trim();

  const codeBlockPatterns = [
    /^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/,
    /^```(?:html)?\s*([\s\S]*?)\s*```$/,
    /^`{3,}(?:html)?\s*\n?([\s\S]*?)\n?\s*`{3,}$/,
  ];

  for (const pattern of codeBlockPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return trimmed;
}

/**
 * Extract parts from HTML document
 */
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

  // Get head content (styles, scripts, etc.)
  const headContent = doc.head?.innerHTML || '';

  // Get body class
  const bodyClass = doc.body?.className || '';

  // Find header
  const header = doc.querySelector('[data-template="header"]') || doc.querySelector('header');
  const headerHtml = header?.outerHTML || '';

  // Find footer
  const footer = doc.querySelector('[data-template="footer"]') || doc.querySelector('footer');
  const footerHtml = footer?.outerHTML || '';

  // Find main content
  const main = doc.querySelector('[data-template="content"]') || doc.querySelector('main');

  // Get the inner HTML of main content (without the main wrapper)
  let mainContent = '';
  if (main) {
    mainContent = main.innerHTML;
  } else {
    // Fallback: get body content excluding header and footer
    const body = doc.body;
    if (body) {
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelector('header')?.remove();
      clone.querySelector('footer')?.remove();
      clone.querySelector('[data-template="header"]')?.remove();
      clone.querySelector('[data-template="footer"]')?.remove();
      // Also remove scripts for the clone used for content
      clone.querySelectorAll('script').forEach(s => s.remove());
      mainContent = clone.innerHTML;
    }
  }

  // Extract inline scripts from body (for Chart.js, etc.)
  // These need to run AFTER pagination completes
  const bodyScripts: string[] = [];
  const scripts = doc.body?.querySelectorAll('script:not([src])') || [];
  scripts.forEach(script => {
    // Skip if it's inside header/footer (already handled separately)
    const isInHeader = header?.contains(script);
    const isInFooter = footer?.contains(script);
    if (!isInHeader && !isInFooter) {
      const scriptContent = script.textContent || '';
      if (scriptContent.trim()) {
        bodyScripts.push(scriptContent);
      }
    }
  });

  return {
    headContent,
    headerHtml,
    footerHtml,
    mainContent,
    bodyClass,
    bodyScripts,
  };
}

/**
 * Generate CSS for A4 page layout
 */
function generatePageCSS(config: Required<PaginationConfig>): string {
  const { pageWidthMm, pageHeightMm, marginTopMm, marginBottomMm, marginLeftMm, marginRightMm, contentScale } = config;

  return `
    /* Custom scrollbar */
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(150, 150, 150, 0.4) transparent;
    }
    *::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    *::-webkit-scrollbar-track {
      background: transparent;
    }
    *::-webkit-scrollbar-thumb {
      background: rgba(150, 150, 150, 0.4);
      border-radius: 3px;
    }
    *::-webkit-scrollbar-thumb:hover {
      background: rgba(150, 150, 150, 0.6);
    }
    *::-webkit-scrollbar-button {
      display: none;
    }

    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    /* Page container styles */
    .a4-page-container {
      --page-scale: 1;
      background: #525659 !important;
      min-height: 100vh !important;
      padding: 20px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: calc(20px * var(--page-scale)) !important;
    }

    /* Individual A4 page - STRICT fixed dimensions */
    .a4-page {
      width: ${pageWidthMm}mm !important;
      height: ${pageHeightMm}mm !important;
      min-height: ${pageHeightMm}mm !important;
      max-height: ${pageHeightMm}mm !important;
      background: white !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
      
    }

    /* Page header */
    .a4-page-header {
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    /* Page content area */
    .a4-page-content {
      flex: 1 1 auto !important;
      overflow: hidden !important;
      padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm !important;
      min-height: 0 !important;
    }

    /* Page footer */
    .a4-page-footer {
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }

    /* Content source: visually hidden but still laid out for measurement.
       The pagination script will set display:none after it finishes. */
    .content-source {
      position: absolute !important;
      visibility: hidden !important;
      pointer-events: none !important;${contentScale !== 1 ? `\n      zoom: ${contentScale} !important;` : ''}
    }

    /* Print styles */
    @media print {
      .a4-page-container {
        background: white !important;
        padding: 0 !important;
        gap: 0 !important;
      }

      .a4-page {
        box-shadow: none !important;
        page-break-after: always;
        transform: none !important;
        margin-bottom: 0 !important;
      }

      .a4-page:last-child {
        page-break-after: avoid;
      }
    }

    /* Responsive adjustments */
    @media screen and (max-width: 900px) {
      .a4-page-container {
        // padding: 10px !important;
      }

      .a4-page {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
    }
  `;
}

/**
 * Generate JavaScript that runs after page load to paginate content
 */
function generatePaginationScript(config: Required<PaginationConfig>, bodyScripts: string[] = []): string {
  const { pageWidthMm, pageHeightMm, marginTopMm, marginBottomMm, marginLeftMm, marginRightMm, contentScale } = config;

  // Convert mm to px (approximate)
  const mmToPx = 3.7795275591; // 96 DPI
  const pageHeightPx = pageHeightMm * mmToPx;
  const marginTopPx = marginTopMm * mmToPx;
  const marginBottomPx = marginBottomMm * mmToPx;

  // Zoom style for content areas (shrinks content in landscape)
  const zoomStyle = contentScale !== 1 ? ` zoom: ${contentScale} !important;` : '';

  // Create padding string for content area
  const contentPadding = `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`;

  // Escape scripts for embedding
  const escapedScripts = bodyScripts.map(script =>
    script.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  );

  return `
    (function() {
      // Wait for everything to load (including Tailwind and Chart.js CDN)
      function waitForLoad(callback) {
        if (document.readyState === 'complete') {
          setTimeout(callback, 100);
        } else {
          window.addEventListener('load', function() {
            setTimeout(callback, 100);
          });
        }
      }

      waitForLoad(function() {
        console.log('[Paginator] Starting — running body scripts first for accurate measurement');

        var container = document.querySelector('.a4-page-container');
        var contentSource = document.querySelector('.content-source');
        var headerTemplate = document.querySelector('.header-template');
        var footerTemplate = document.querySelector('.footer-template');

        if (!container || !contentSource) {
          console.log('[Paginator] Missing elements, skipping');
          return;
        }

        // ── STEP 1: Run Chart.js / body scripts on content-source FIRST ──
        // Charts render at their real responsive sizes (pie=1:1, bar=2:1, etc.)
        // so we can measure actual heights before paginating.
        ${escapedScripts.length > 0 ? `
        console.log('[Paginator] Executing ${escapedScripts.length} body scripts on content-source...');
        try {
          ${escapedScripts.map((script, idx) => `
          (function() {
            ${script}
          })();
          `).join('\n')}
          console.log('[Paginator] Body scripts executed');
        } catch (err) {
          console.error('[Paginator] Error in body scripts:', err);
        }
        ` : '// No body scripts to run'}

        // ── STEP 2: Wait one frame for Chart.js to finish rendering ──
        requestAnimationFrame(function() {
          setTimeout(function() {
            console.log('[Paginator] Measuring and paginating');

            // Snapshot children as a static array before we start moving them
            var children = Array.from(contentSource.children);
            console.log('[Paginator] Content children:', children.length);

            // Clear the placeholder page
            container.innerHTML = '';

            // ── Page creation ──
            var currentPage = null;
            var currentContent = null;
            var currentHeight = 0;
            var availableHeight = 0;
            var pageCount = 0;

            function createNewPage() {
              pageCount++;
              var page = document.createElement('div');
              page.className = 'a4-page';
              page.style.cssText = 'width: ${pageWidthMm}mm !important; height: ${pageHeightMm}mm !important; min-height: ${pageHeightMm}mm !important; max-height: ${pageHeightMm}mm !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; flex-shrink: 0 !important; flex-grow: 0 !important; background: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; position: relative !important; margin: 0 auto !important; transform: scale(var(--page-scale)) !important; transform-origin: top center !important; margin-bottom: calc(${pageHeightMm}mm * (var(--page-scale) - 1)) !important;';

              if (headerTemplate) {
                var header = document.createElement('div');
                header.className = 'a4-page-header';
                header.style.cssText = 'flex-shrink: 0 !important; flex-grow: 0 !important;';
                header.innerHTML = headerTemplate.innerHTML;
                page.appendChild(header);
              }

              var content = document.createElement('div');
              content.className = 'a4-page-content';
              content.style.cssText = 'flex: 1 1 auto !important; overflow: hidden !important; padding: ${contentPadding} !important; min-height: 0 !important;${zoomStyle}';
              page.appendChild(content);

              if (footerTemplate) {
                var footer = document.createElement('div');
                footer.className = 'a4-page-footer';
                footer.style.cssText = 'flex-shrink: 0 !important; flex-grow: 0 !important;';
                footer.innerHTML = footerTemplate.innerHTML;
                page.appendChild(footer);
              }

              container.appendChild(page);
              currentPage = page;
              currentContent = content;
              currentHeight = 0;

              // Measure the REAL available height from the rendered flex layout.
              // clientHeight = inner height of the content area (after flex allocates
              // space for header + footer), minus its own CSS padding.
              // This is the exact pixel budget we can fill with children.
              availableHeight = content.clientHeight;

              console.log('[Paginator] New page', pageCount, '— availableHeight:', availableHeight);
              return { page: page, content: content };
            }

            // Helper: get total outer height of an element including margins
            function getOuterHeight(el) {
              var style = getComputedStyle(el);
              var marginTop = parseFloat(style.marginTop) || 0;
              var marginBottom = parseFloat(style.marginBottom) || 0;
              return el.offsetHeight + marginTop + marginBottom;
            }

            // Start first page
            createNewPage();

            // ── STEP 3: Move children into pages (not clone) ──
            // Because Chart.js already rendered on these exact canvas elements,
            // moving preserves the rendered chart pixels and correct dimensions.
            for (var i = 0; i < children.length; i++) {
              var child = children[i]; // actual DOM node — appendChild moves it

              // Move into current page to measure
              currentContent.appendChild(child);
              var childHeight = getOuterHeight(child);

              console.log('[Paginator] Child', i, 'height:', childHeight, '(offsetHeight:', child.offsetHeight, ') accumulated:', currentHeight + childHeight, '/', availableHeight);

              if (currentHeight + childHeight > availableHeight && currentHeight > 0) {
                // Overflows — move to a new page
                currentContent.removeChild(child);
                createNewPage();
                currentContent.appendChild(child);
                currentHeight = getOuterHeight(child);
              } else {
                currentHeight += childHeight;
              }
            }

            // ── Update page numbers ──
            var pages = container.querySelectorAll('.a4-page');
            var totalPages = pages.length;

            pages.forEach(function(page, index) {
              var num = index + 1;
              page.querySelectorAll('[data-page="current"]').forEach(function(el) { el.textContent = num; });
              page.querySelectorAll('[data-page="total"]').forEach(function(el) { el.textContent = totalPages; });
            });

            console.log('[Paginator] Created', totalPages, 'pages');

            // Hide the now-empty content source and templates
            contentSource.style.display = 'none';
            if (headerTemplate) headerTemplate.style.display = 'none';
            if (footerTemplate) footerTemplate.style.display = 'none';

            // ── Dynamic Scaling for small screens ──
            var mmToPx = 3.7795275591;
            var pageWidthPx = ${pageWidthMm} * mmToPx;
            var resizeObserver = new ResizeObserver(function(entries) {
              for (var j = 0; j < entries.length; j++) {
                var entry = entries[j];
                // padding = 40px, scrollbar approx 15px
                var availableWidth = entry.contentRect.width;
                if (availableWidth === 0) continue; // Hidden
                var scale = Math.min(1, (availableWidth - 40) / pageWidthPx);
                container.style.setProperty('--page-scale', scale.toString());
              }
            });
            resizeObserver.observe(container);

            window.__paginationComplete = true;
          }, 50);
        });
      });
    })();
  `;
}

// ============================================================================
// Main Pagination Function
// ============================================================================

export async function paginateReport(
  htmlString: string,
  config: PaginationConfig = {}
): Promise<string> {
  console.log('[paginateReport] Starting pagination');

  if (!htmlString || htmlString.trim().length < 50) {
    console.log('[paginateReport] Content too short, returning as-is');
    return htmlString;
  }

  // Strip markdown code fences
  const cleanedHtml = stripMarkdownCodeFences(htmlString);
  console.log('[paginateReport] Cleaned HTML length:', cleanedHtml.length);

  // Merge config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Parse the HTML document
  const parsed = parseHtmlDocument(cleanedHtml);
  console.log('[paginateReport] Parsed:', {
    headContentLength: parsed.headContent.length,
    hasHeader: !!parsed.headerHtml,
    hasFooter: !!parsed.footerHtml,
    mainContentLength: parsed.mainContent.length,
    bodyScriptsCount: parsed.bodyScripts.length,
  });

  // Generate page CSS and pagination script (pass body scripts for chart re-initialization)
  const pageCSS = generatePageCSS(finalConfig);
  const paginationScript = generatePaginationScript(finalConfig, parsed.bodyScripts);

  // Compute widths from config for hidden measurement containers
  const pageW = finalConfig.pageWidthMm;
  const contentW = pageW - finalConfig.marginLeftMm - finalConfig.marginRightMm;

  // Build the paginated HTML with script that runs after load
  const paginatedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${parsed.headContent}
  <style>
    ${pageCSS}
  </style>
</head>
<body class="${parsed.bodyClass}">
  <!-- Hidden templates for header/footer -->
  ${parsed.headerHtml ? `<div class="header-template" style="position:absolute;visibility:hidden;width:${pageW}mm;">${parsed.headerHtml}</div>` : ''}
  ${parsed.footerHtml ? `<div class="footer-template" style="position:absolute;visibility:hidden;width:${pageW}mm;">${parsed.footerHtml}</div>` : ''}

  <!-- Hidden content source -->
  <div class="content-source" style="position:absolute;visibility:hidden;width:${contentW}mm;">
    ${parsed.mainContent}
  </div>

  <!-- Page container (populated by script) -->
  <div class="a4-page-container">
    <!-- Initial loading page -->
    <div class="a4-page" style="display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;color:#666;">
        <div style="font-size:14px;">Formatting report...</div>
      </div>
    </div>
  </div>

  <!-- Pagination script runs after Tailwind loads -->
  <script>
    ${paginationScript}
  </script>
</body>
</html>`;

  console.log('[paginateReport] Built paginated HTML, length:', paginatedHtml.length);
  return paginatedHtml;
}

// ============================================================================
// Utility: Check if HTML needs pagination
// ============================================================================

export function needsPagination(htmlString: string): boolean {
  if (!htmlString || htmlString.trim().length < 100) {
    return false;
  }
  return true;
}
