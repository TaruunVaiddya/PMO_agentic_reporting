/**
 * Utility functions for PDF generation and printing
 *
 * ─── Root cause of landscape truncation ─────────────────────────────────────
 *
 * The pagination engine applies `zoom: 0.75` to `.a4-page-content` for
 * landscape mode.  CSS zoom affects flex layout: the browser gives the content
 * div a LARGER CSS height (≈ natural ÷ zoom) so that after zoom the visual
 * height fills the available space.  The paginator measures `clientHeight` on
 * this larger CSS height and packs rows to fill it.
 *
 * html2canvas does not support CSS zoom.  In the cloned document the content
 * div has no zoom, so flex gives it only the natural (smaller) CSS height.
 * Rows that were packed for the larger live height overflow this smaller clone
 * height and are clipped by `overflow:hidden` on the page — causing the last
 * 1–2 rows to be cut off.
 *
 * ─── Fix: expand-then-scale with 133% wrapper ───────────────────────────────
 *
 * onclone does three things:
 *
 *   1. Remove `zoom` from .a4-page-content so html2canvas can render children.
 *
 *   2. Expand the page element height to `pdfHeight / zoom` mm.
 *      Now flex gives the content div the same large CSS height the live page
 *      had, so all rows fit without clipping.
 *
 *   3. Wrap all content-div children in a 133% × 133% div with
 *      `transform: scale(zoom)`.  This makes every child appear visually at
 *      zoom × natural size — identical to the UI.  Width is handled correctly
 *      because the wrapper is the same proportional size in both dimensions.
 *
 * pdf.addImage() is called with the original pdfHeight (not the expanded
 * height), so jsPDF scales the taller canvas back down — the vertical
 * compression is exactly 1/invScale = zoom, matching the UI.  Width is not
 * compressed (pdfWidth stays the same), but since the wrapper approach makes
 * children render at full content-div width, this is consistent with what the
 * user observed as "correct" with the previous wrapper fix.
 *
 * Portrait pages (zoom === 1) skip all of the above entirely.
 */

export type PdfOrientation = 'portrait' | 'landscape';
export type PreviewOrientation = 'original' | 'portrait' | 'landscape';

const HTML2CANVAS_CDN =
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

const ensureHtml2Canvas = async (iframeDoc: Document, iframeWindow: Window) => {
    if ((iframeWindow as any).html2canvas) {
        return (iframeWindow as any).html2canvas as typeof import('html2canvas').default;
    }

    await new Promise<void>((resolve, reject) => {
        const script = iframeDoc.createElement('script');
        script.src = HTML2CANVAS_CDN;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        iframeDoc.head.appendChild(script);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const html2canvasFn = (iframeWindow as any).html2canvas as typeof import('html2canvas').default | undefined;
    if (!html2canvasFn) {
        throw new Error('html2canvas not available in iframe');
    }

    return html2canvasFn;
};

const getOriginalPageElement = (iframeDoc: Document): HTMLElement => {
    const body = iframeDoc.body;
    if (!body) {
        throw new Error('No content found to export');
    }

    return (iframeDoc.getElementById('__orig_wrap__') as HTMLElement | null) || body;
};

const canvasToFile = async (canvas: HTMLCanvasElement, filename: string): Promise<File> => {
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error('Failed to create image blob'));
        }, 'image/png');
    });

    return new File([blob], filename, { type: 'image/png' });
};

export const capturePdfFromIframe = async (
    iframe: HTMLIFrameElement,
    filename: string,
    orientation: PdfOrientation = 'portrait',
) => {
    const { default: jsPDF } = await import('jspdf');

    const iframeDoc    = iframe.contentDocument;
    const iframeWindow = iframe.contentWindow;
    if (!iframeDoc || !iframeWindow) {
        throw new Error('Cannot access iframe document');
    }

    const pages = iframeDoc.querySelectorAll('.a4-page');
    console.log('[PDF] Found pages in preview iframe:', pages.length);
    if (pages.length === 0) throw new Error('No pages found to export');

    const isLandscape = orientation === 'landscape';
    const pdfWidth    = isLandscape ? 297 : 210;   // mm
    const pdfHeight   = isLandscape ? 210 : 297;   // mm

    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

    const iframeHtml2Canvas = await ensureHtml2Canvas(iframeDoc, iframeWindow);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        const canvas = await iframeHtml2Canvas(page, {
            scale:           2,        // 2× for retina-quality output
            useCORS:         true,
            allowTaint:      true,
            backgroundColor: '#ffffff',
            logging:         false,

            onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {

                // ── Detect zoom value from inline cssText ───────────────────
                const content = clonedElement.querySelector(
                    '.a4-page-content',
                ) as HTMLElement | null;
                if (!content) return;

                // parseFloat handles the `!important` suffix gracefully:
                // parseFloat('0.75!important') → 0.75
                const zoomMatch = content.style.cssText.match(/zoom\s*:\s*([\d.]+)/i);
                const zoomVal   = zoomMatch ? parseFloat(zoomMatch[1]) : 1;
                if (!zoomVal || zoomVal === 1 || zoomVal <= 0) return;

                const invScale = 1 / zoomVal;   // 1.333… for zoom:0.75

                // ── Step 1: remove zoom from content div ────────────────────
                content.style.cssText = content.style.cssText
                    .replace(/zoom\s*:\s*[^;]+;?/gi, '')
                    .trim();

                // ── Step 2: expand page height ──────────────────────────────
                //
                // Without zoom the flex algorithm gives the content div only its
                // natural (smaller) CSS height.  The paginator measured rows
                // against the larger CSS height the live page had with zoom.
                // Expanding the page to pdfHeight/zoom makes flex allocate the
                // same large CSS height → all rows fit, nothing is clipped.
                //
                // addImage is called at pdfHeight (not the expanded height), so
                // jsPDF compresses the taller canvas back to pdfHeight → the
                // vertical scale factor is exactly zoom (e.g. 0.75), matching UI.
                clonedElement.style.height    = `${pdfHeight * invScale}mm`;
                clonedElement.style.minHeight = `${pdfHeight * invScale}mm`;
                clonedElement.style.maxHeight = 'none';

                // Keep width clipping at pdfWidth — the wrapper handles horizontal
                // appearance correctly without changing the page width.
                clonedElement.style.overflow = 'hidden';

                // ── Step 3: 133% × 133% wrapper with scale(zoom) ───────────
                //
                // Children need to APPEAR at zoom × natural size (matching the UI).
                // The wrapper is (1/zoom × 100%) in both dimensions, then scaled
                // back by zoom from the top-left corner.  Every child's 100% width
                // resolves to the larger wrapper width → after scale, visual width
                // equals the original content-div visual width in the live page.
                const wrapper = clonedDoc.createElement('div');
                wrapper.style.cssText = [
                    `width:${invScale * 100}%`,          // e.g. 133.33%
                    `height:${invScale * 100}%`,          // e.g. 133.33%
                    `transform:scale(${zoomVal})`,        // e.g. scale(0.75)
                    'transform-origin:top left',
                    'overflow:hidden',
                    'flex-shrink:0',
                ].join(';');

                while (content.firstChild) wrapper.appendChild(content.firstChild);
                content.appendChild(wrapper);

                // Allow the wrapper to be fully visible within the expanded page
                content.style.overflow = 'visible';
                content.style.flex     = '1 1 auto';
            },
        });

        // ── Add to PDF ──────────────────────────────────────────────────────
        //
        // pdfWidth  × pdfHeight is passed explicitly.  When the page was
        // expanded to pdfHeight/zoom, the canvas is proportionally taller.
        // jsPDF stretches the image to fit pdfWidth × pdfHeight, applying the
        // zoom compression vertically.  Width is placed at pdfWidth unchanged,
        // consistent with the 133% wrapper visual output.
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        console.log(`[PDF] Captured page ${i + 1}/${pages.length}`);
    }

    pdf.save(`${filename || 'report'}.pdf`);
};

export const captureSinglePagePdfFromIframe = async (
    iframe: HTMLIFrameElement,
    filename: string,
) => {
    const { default: jsPDF } = await import('jspdf');

    const iframeDoc    = iframe.contentDocument;
    const iframeWindow = iframe.contentWindow;
    if (!iframeDoc || !iframeWindow) {
        throw new Error('Cannot access iframe document');
    }

    const iframeHtml2Canvas = await ensureHtml2Canvas(iframeDoc, iframeWindow);
    const captureElement = getOriginalPageElement(iframeDoc);
    const rect = captureElement.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width || captureElement.scrollWidth || 0));
    const height = Math.max(1, Math.ceil(rect.height || captureElement.scrollHeight || 0));

    const canvas = await iframeHtml2Canvas(captureElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        onclone: (clonedDoc: Document) => {
            const clonedBody = clonedDoc.body;
            if (!clonedBody) return;

            // Preserve the visible page card, but remove surrounding body space
            // so the exported PDF matches the wrapper exactly.
            clonedBody.style.margin = '0';
            clonedBody.style.padding = '0';
            clonedBody.style.maxWidth = 'none';
            clonedBody.style.minHeight = '0';
            clonedBody.style.boxShadow = 'none';
            clonedBody.style.borderRadius = '0';
            clonedBody.style.background = 'transparent';
            clonedBody.style.overflow = 'visible';

            const clonedWrap = clonedDoc.getElementById('__orig_wrap__') as HTMLElement | null;
            if (clonedWrap) {
                clonedWrap.style.margin = '0';
                clonedWrap.style.maxWidth = 'none';
            }
        },
    });

    const pxToMm = 25.4 / 96;
    const maxPdfDimMm = 5000;
    const rawWidthMm = canvas.width * pxToMm;
    const rawHeightMm = canvas.height * pxToMm;
    const scale = Math.min(
        1,
        maxPdfDimMm / rawWidthMm,
        maxPdfDimMm / rawHeightMm,
    );
    const pageWidthMm = rawWidthMm * scale;
    const pageHeightMm = rawHeightMm * scale;

    const pdf = new jsPDF({
        orientation: pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pageWidthMm, pageHeightMm],
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);
    pdf.save(`${filename || 'report'}.pdf`);
};

export const capturePreviewThumbnailFromIframe = async (
    iframe: HTMLIFrameElement,
    filename: string,
    orientation: PreviewOrientation = 'original',
) => {
    const iframeDoc = iframe.contentDocument;
    const iframeWindow = iframe.contentWindow;
    if (!iframeDoc || !iframeWindow) {
        throw new Error('Cannot access iframe document');
    }

    const iframeHtml2Canvas = await ensureHtml2Canvas(iframeDoc, iframeWindow);

    let captureElement: HTMLElement | null = null;
    if (orientation === 'original') {
        captureElement = getOriginalPageElement(iframeDoc);
    } else {
        captureElement = iframeDoc.querySelector('.a4-page') as HTMLElement | null;
        if (!captureElement) {
            captureElement = iframeDoc.body;
        }
    }

    if (!captureElement) {
        throw new Error('No content found to capture');
    }

    const rect = captureElement.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width || captureElement.scrollWidth || 0));
    const height = Math.max(1, Math.ceil(rect.height || captureElement.scrollHeight || 0));

    const canvas = await iframeHtml2Canvas(captureElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
    });

    return canvasToFile(canvas, `${filename || 'template'}.png`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Print-to-PDF via browser print dialog
// Perfect fidelity but shows the system dialog — user selects "Save as PDF"
// ─────────────────────────────────────────────────────────────────────────────

export const printToPdf = async (
    html: string,
    filename: string,
    orientation: PdfOrientation = 'portrait',
) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
    }

    const isLandscape = orientation === 'landscape';
    const pageWidth   = isLandscape ? 297 : 210;
    const pageHeight  = isLandscape ? 210 : 297;

    const printHtml = html.replace(
        '</head>',
        `<style>
      @media print {
        @page { size: A4 ${orientation}; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .a4-page-container {
          background: white !important;
          padding: 0 !important;
          gap: 0 !important;
        }
        .a4-page {
          width: ${pageWidth}mm !important;
          height: ${pageHeight}mm !important;
          box-shadow: none !important;
          margin: 0 !important;
          page-break-after: always !important;
          overflow: hidden !important;
        }
        .a4-page:last-child { page-break-after: auto !important; }
        .header-template,
        .footer-template,
        .content-source { display: none !important; }
      }
    </style></head>`,
    );

    printWindow.document.write(printHtml);
    printWindow.document.close();
    await new Promise(resolve => setTimeout(resolve, 2000));
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
};
