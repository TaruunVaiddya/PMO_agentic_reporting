
/**
 * Utility functions for PDF generation and printing
 */

export const capturePdfFromIframe = async (iframe: HTMLIFrameElement, filename: string) => {
    const { default: jsPDF } = await import('jspdf');
    // html2canvas is dynamically imported inside the iframe context usually, 
    // but here we just need jsPDF to be imported dynamically to keep bundle size low if needed.
    // The original implementation logic for capturing follows.

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

    // A4 dimensions
    const a4Width = 210;
    const a4Height = 297;

    // Create PDF
    const pdf = new jsPDF({
        orientation: 'portrait',
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

    // Capture each page
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        // Use html2canvas from iframe context
        const iframeHtml2Canvas = (iframeWindow as any).html2canvas;
        if (!iframeHtml2Canvas) {
            throw new Error('html2canvas not available in iframe');
        }

        const canvas = await iframeHtml2Canvas(page, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // Convert to image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Add page to PDF
        if (i > 0) {
            pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, a4Width, a4Height);
        console.log(`[PDF] Captured page ${i + 1}/${pages.length}`);
    }

    // Save PDF
    pdf.save(`${filename || 'report'}.pdf`);
};

export const printToPdf = async (html: string, filename: string) => {
    // Open new window with print-optimized content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
    }

    // Add print styles
    const printHtml = html.replace(
        '</head>',
        `<style>
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .a4-page-container { background: white !important; padding: 0 !important; gap: 0 !important; }
        .a4-page {
          width: 210mm !important; height: 297mm !important;
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
