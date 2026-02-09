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
  const { pageWidthMm, pageHeightMm, marginTopMm, marginBottomMm, marginLeftMm, marginRightMm } = config;

  return `
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
      background: #525659 !important;
      min-height: 100vh !important;
      padding: 20px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 20px !important;
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

    /* Content source (hidden after pagination) */
    .content-source {
      display: none !important;
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
      }

      .a4-page:last-child {
        page-break-after: avoid;
      }
    }

    /* Responsive adjustments */
    @media screen and (max-width: 900px) {
      .a4-page-container {
        padding: 10px !important;
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
  const { pageHeightMm, marginTopMm, marginBottomMm, marginLeftMm, marginRightMm } = config;

  // Convert mm to px (approximate)
  const mmToPx = 3.7795275591; // 96 DPI
  const pageHeightPx = pageHeightMm * mmToPx;
  const marginTopPx = marginTopMm * mmToPx;
  const marginBottomPx = marginBottomMm * mmToPx;

  // Create padding string for content area
  const contentPadding = `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`;

  // Escape scripts for embedding
  const escapedScripts = bodyScripts.map(script =>
    script.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  );

  return `
    (function() {
      // Wait for everything to load (including Tailwind)
      function waitForLoad(callback) {
        if (document.readyState === 'complete') {
          // Add extra delay for Tailwind to process
          setTimeout(callback, 100);
        } else {
          window.addEventListener('load', function() {
            setTimeout(callback, 100);
          });
        }
      }

      waitForLoad(function() {
        console.log('[Paginator] Starting pagination after load');

        const container = document.querySelector('.a4-page-container');
        const contentSource = document.querySelector('.content-source');
        const headerTemplate = document.querySelector('.header-template');
        const footerTemplate = document.querySelector('.footer-template');

        if (!container || !contentSource) {
          console.log('[Paginator] Missing elements, skipping');
          return;
        }

        // Get dimensions
        const pageHeight = ${pageHeightPx};
        const headerHeight = headerTemplate ? headerTemplate.offsetHeight : 0;
        const footerHeight = footerTemplate ? footerTemplate.offsetHeight : 0;
        const marginTop = ${marginTopPx};
        const marginBottom = ${marginBottomPx};
        const availableHeight = pageHeight - headerHeight - footerHeight - marginTop - marginBottom;

        console.log('[Paginator] Dimensions:', { pageHeight, headerHeight, footerHeight, availableHeight });

        // Get all direct children of content source
        const children = Array.from(contentSource.children);
        console.log('[Paginator] Content children:', children.length);

        // Remove existing pages
        container.innerHTML = '';

        // Create pages
        let currentPage = null;
        let currentContent = null;
        let currentHeight = 0;
        let pageCount = 0;

        function createNewPage() {
          pageCount++;
          const page = document.createElement('div');
          page.className = 'a4-page';
          // Set inline styles to guarantee fixed A4 dimensions
          page.style.cssText = 'width: 210mm !important; height: 297mm !important; min-height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; flex-shrink: 0 !important; flex-grow: 0 !important; background: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; position: relative !important;';

          // Add header
          if (headerTemplate) {
            const header = document.createElement('div');
            header.className = 'a4-page-header';
            header.style.cssText = 'flex-shrink: 0 !important; flex-grow: 0 !important;';
            header.innerHTML = headerTemplate.innerHTML;
            page.appendChild(header);
          }

          // Add content area
          const content = document.createElement('div');
          content.className = 'a4-page-content';
          content.style.cssText = 'flex: 1 1 auto !important; overflow: hidden !important; padding: ${contentPadding} !important; min-height: 0 !important;';
          page.appendChild(content);

          // Add footer
          if (footerTemplate) {
            const footer = document.createElement('div');
            footer.className = 'a4-page-footer';
            footer.style.cssText = 'flex-shrink: 0 !important; flex-grow: 0 !important;';
            // Update page numbers
            let footerHtml = footerTemplate.innerHTML;
            footer.innerHTML = footerHtml;
            // Will update total pages later
            page.appendChild(footer);
          }

          container.appendChild(page);
          currentPage = page;
          currentContent = content;
          currentHeight = 0;

          return { page, content };
        }

        // Track canvas ID mappings for chart re-initialization
        const canvasIdMap = new Map();
        let canvasCounter = 0;

        // Start with first page
        createNewPage();

        // Add children to pages
        for (let i = 0; i < children.length; i++) {
          const child = children[i].cloneNode(true);

          // Handle canvas elements - give them unique IDs
          const canvases = child.querySelectorAll ? child.querySelectorAll('canvas') : [];
          canvases.forEach(canvas => {
            const originalId = canvas.id;
            if (originalId) {
              const newId = originalId + '_page_' + canvasCounter++;
              canvas.id = newId;
              canvasIdMap.set(originalId, newId);
              // Store original ID as data attribute for script reference
              canvas.setAttribute('data-original-id', originalId);
            }
          });

          // Also check if child itself is a canvas
          if (child.tagName === 'CANVAS' && child.id) {
            const originalId = child.id;
            const newId = originalId + '_page_' + canvasCounter++;
            child.id = newId;
            canvasIdMap.set(originalId, newId);
            child.setAttribute('data-original-id', originalId);
          }

          // Temporarily add to measure
          currentContent.appendChild(child);
          const childHeight = child.offsetHeight;

          // Check if it fits
          if (currentHeight + childHeight > availableHeight && currentHeight > 0) {
            // Doesn't fit, remove and create new page
            currentContent.removeChild(child);
            createNewPage();
            currentContent.appendChild(child);
            currentHeight = child.offsetHeight;
          } else {
            currentHeight += childHeight;
          }
        }

        // Update all page numbers
        const pages = container.querySelectorAll('.a4-page');
        const totalPages = pages.length;

        pages.forEach((page, index) => {
          const currentPageNum = index + 1;

          // Update data-page="current" elements
          const currentEls = page.querySelectorAll('[data-page="current"]');
          currentEls.forEach(el => el.textContent = currentPageNum);

          // Update data-page="total" elements
          const totalEls = page.querySelectorAll('[data-page="total"]');
          totalEls.forEach(el => el.textContent = totalPages);
        });

        // Log page dimensions to verify A4 sizing
        pages.forEach((page, index) => {
          console.log('[Paginator] Page', index + 1, 'dimensions:', {
            offsetHeight: page.offsetHeight,
            offsetWidth: page.offsetWidth,
            computedHeight: getComputedStyle(page).height,
            computedWidth: getComputedStyle(page).width
          });
        });

        console.log('[Paginator] Created', totalPages, 'pages');

        // Re-initialize charts after pagination
        // Store canvas ID map globally for chart scripts to use
        window.__canvasIdMap = canvasIdMap;
        window.__paginationComplete = true;

        // Override getElementById to handle remapped canvas IDs
        const originalGetElementById = document.getElementById.bind(document);
        document.getElementById = function(id) {
          // First try to find by original ID in paginated content
          const mapped = window.__canvasIdMap && window.__canvasIdMap.get(id);
          if (mapped) {
            const el = originalGetElementById(mapped);
            if (el) return el;
          }
          // Also try to find by data-original-id
          const byDataAttr = document.querySelector('[data-original-id="' + id + '"]');
          if (byDataAttr) return byDataAttr;
          // Fallback to original behavior
          return originalGetElementById(id);
        };

        console.log('[Paginator] Canvas ID map:', Object.fromEntries(canvasIdMap));

        // Run body scripts after pagination (for Chart.js, etc.)
        ${escapedScripts.length > 0 ? `
        console.log('[Paginator] Running ${escapedScripts.length} body scripts for charts...');
        try {
          ${escapedScripts.map((script, idx) => `
          // Script ${idx + 1}
          (function() {
            ${script}
          })();
          `).join('\n')}
          console.log('[Paginator] Chart scripts executed successfully');
        } catch (err) {
          console.error('[Paginator] Error running chart scripts:', err);
        }
        ` : '// No body scripts to run'}
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
  ${parsed.headerHtml ? `<div class="header-template" style="position:absolute;visibility:hidden;width:210mm;">${parsed.headerHtml}</div>` : ''}
  ${parsed.footerHtml ? `<div class="footer-template" style="position:absolute;visibility:hidden;width:210mm;">${parsed.footerHtml}</div>` : ''}

  <!-- Hidden content source -->
  <div class="content-source" style="position:absolute;visibility:hidden;width:180mm;">
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
