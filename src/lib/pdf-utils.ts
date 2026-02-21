
/**
 * Utility functions for PDF generation and printing
 */

export type PdfOrientation = 'portrait' | 'landscape';

export const capturePdfFromIframe = async (
    iframe: HTMLIFrameElement,
    filename: string,
    orientation: PdfOrientation = 'portrait'
) => {
    const { default: jsPDF } = await import('jspdf');

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
    }

    // Find A4 pages in the iframe
    const pages = iframeDoc.querySelectorAll('.a4-page');
    console.log('[PDF] Found pages in preview iframe:', pages.length);

    if (pages.length === 0) {
        throw new Error('No pages found to export');
    }

    // A4 dimensions based on orientation
    const isLandscape = orientation === 'landscape';
    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    // Create PDF
    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
    });

    // We need to capture each page from within the iframe's context
    // Inject html2canvas into the iframe and capture there
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
        throw new Error('Cannot access iframe window');
    }

    // Add html2canvas to iframe if not present
    if (!(iframeWindow as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
            const script = iframeDoc.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2canvas'));
            iframeDoc.head.appendChild(script);
        });

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use html2canvas from iframe context
    const iframeHtml2Canvas = (iframeWindow as any).html2canvas;
    if (!iframeHtml2Canvas) {
        throw new Error('html2canvas not available in iframe');
    }

    // Capture each page
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        const canvas = await iframeHtml2Canvas(page, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (_clonedDoc: Document, clonedElement: HTMLElement) => {
                // html2canvas does NOT support CSS zoom (causes overlapping text).
                // Swap zoom with transform:scale() on the cloned DOM — html2canvas
                // fully supports CSS transforms, producing identical visual output.
                const content = clonedElement.querySelector('.a4-page-content') as HTMLElement | null;
                if (!content) return;
                const zoomVal = parseFloat(content.style.zoom) || 1;
                if (zoomVal === 1 || zoomVal <= 0) return;

                content.style.zoom = '';
                content.style.transform = `scale(${zoomVal})`;
                content.style.transformOrigin = 'top left';
                content.style.overflow = 'visible';
            },
        });

        // Convert to image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Add page to PDF
        if (i > 0) {
            pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        console.log(`[PDF] Captured page ${i + 1}/${pages.length}`);
    }

    // Save PDF
    pdf.save(`${filename || 'report'}.pdf`);
};

export const printToPdf = async (
    html: string,
    filename: string,
    orientation: PdfOrientation = 'portrait'
) => {
    // Open new window with print-optimized content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
    }

    const isLandscape = orientation === 'landscape';
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;

    // Add print styles
    const printHtml = html.replace(
        '</head>',
        `<style>
      @media print {
        @page { size: A4 ${orientation}; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .a4-page-container { background: white !important; padding: 0 !important; gap: 0 !important; }
        .a4-page {
          width: ${pageWidth}mm !important; height: ${pageHeight}mm !important;
          box-shadow: none !important; margin: 0 !important;
          page-break-after: always !important;
        }
        .a4-page:last-child { page-break-after: auto !important; }
        .header-template, .footer-template, .content-source { display: none !important; }
      }
    </style></head>`
    );

    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Wait and print
    await new Promise(resolve => setTimeout(resolve, 2000));
    printWindow.print();

    // Close the window after a short delay to ensure print dialog has handled it
    setTimeout(() => printWindow.close(), 1000);
};
