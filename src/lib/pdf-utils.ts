
export type PdfOrientation = 'portrait' | 'landscape';

export const capturePdfFromIframe = async (
    iframe: HTMLIFrameElement,
    filename: string,
    orientation: PdfOrientation = 'portrait'
) => {
    const { default: jsPDF } = await import('jspdf');

    const iframeDoc = iframe.contentDocument;
    const iframeWindow = iframe.contentWindow;
    if (!iframeDoc || !iframeWindow) {
        throw new Error('Cannot access iframe document');
    }

    const pages = iframeDoc.querySelectorAll('.a4-page');
    console.log('[PDF] Found pages in preview iframe:', pages.length);

    if (pages.length === 0) {
        throw new Error('No pages found to export');
    }

    const isLandscape = orientation === 'landscape';
    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
    });

    // Inject html2canvas into the iframe if not already present
    if (!(iframeWindow as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
            const script = iframeDoc.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2canvas'));
            iframeDoc.head.appendChild(script);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const iframeHtml2Canvas = (iframeWindow as any).html2canvas;
    if (!iframeHtml2Canvas) {
        throw new Error('html2canvas not available in iframe');
    }

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        const canvas = await iframeHtml2Canvas(page, {
            scale: 2,                  // 2× for retina-quality PDF
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
                const content = clonedElement.querySelector(
                    '.a4-page-content'
                ) as HTMLElement | null;
                if (!content) return;

                // ── Read zoom value from inline cssText ─────────────────────
                // parseFloat('0.75!important') → 0.75  (stops at non-numeric)
                // parseFloat('') → NaN → falls back to 1 (no zoom)
                const zoomMatch = content.style.cssText.match(/zoom\s*:\s*([\d.]+)/i);
                const zoomVal = zoomMatch ? parseFloat(zoomMatch[1]) : 1;
                if (!zoomVal || zoomVal === 1 || zoomVal <= 0) return;

                // ── Remove zoom ─────────────────────────────────────────────
                // Setting via cssText rewrite preserves other properties cleanly
                content.style.cssText = content.style.cssText
                    .replace(/zoom\s*:\s*[^;]+;?/gi, '')
                    .trim();

                // ── Build scale wrapper ─────────────────────────────────────
                //
                // Goal: visually identical to zoom:N inside the content box.
                //
                // zoom:N behaviour:
                //   - element visual size = natural × N
                //   - element LAYOUT size = natural × N  (shrinks layout too)
                //
                // Our wrapper:
                //   - wrapper CSS size = 100%/N × 100%/N  (oversized before scale)
                //   - transform:scale(N) from top-left
                //   - visual size after scale = (100%/N × N) = 100% of content box
                //   - every child is scaled identically → same as zoom:N on parent
                //
                const invScale = 1 / zoomVal;             // e.g. 1/0.75 = 1.3333

                const wrapper = clonedDoc.createElement('div');
                wrapper.style.cssText = [
                    `width:${invScale * 100}%`,            // e.g. 133.33%
                    `height:${invScale * 100}%`,
                    `transform:scale(${zoomVal})`,         // e.g. scale(0.75)
                    `transform-origin:top left`,
                    `overflow:hidden`,
                    `position:relative`,
                    `flex-shrink:0`,
                ].join(';');

                // Move all children of content into wrapper
                while (content.firstChild) {
                    wrapper.appendChild(content.firstChild);
                }
                content.appendChild(wrapper);
                content.style.overflow = 'hidden';
            },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        console.log(`[PDF] Captured page ${i + 1}/${pages.length}`);
    }

    pdf.save(`${filename || 'report'}.pdf`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Print-to-PDF via browser dialog
// (Perfect fidelity, but shows the print dialog — user selects "Save as PDF")
// ─────────────────────────────────────────────────────────────────────────────

export const printToPdf = async (
    html: string,
    filename: string,
    orientation: PdfOrientation = 'portrait'
) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
    }

    const isLandscape = orientation === 'landscape';
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

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
    </style></head>`
    );

    printWindow.document.write(printHtml);
    printWindow.document.close();

    await new Promise(resolve => setTimeout(resolve, 2000));
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
};