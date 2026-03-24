"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWebPreview } from '../viewer-provider';
import { LoadingOverlay, iframeIsolationStyles } from './shared';

export interface ReportLayoutProps {
    src?: string;
    htmlContent?: string;
    className?: string;
    onIframeRef?: (iframe: HTMLIFrameElement | null) => void;
    streamingStatusText?: string;
    // Specific to paginated layouts:
    editMode?: boolean;
    onEditModeReady?: (iframe: HTMLIFrameElement) => void;
    enablePagination?: boolean;
    onPaginationComplete?: (pageCount: number) => void;
    // Original view only:
    /** Max-width of the content wrapper in px. Default 900. */
    originalWidth?: number;
}

export const OriginalLayout: React.FC<ReportLayoutProps> = ({
    src,
    htmlContent,
    className,
    onIframeRef,
    originalWidth = 900,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { setIsLoading } = useWebPreview();
    const [iframeSrcDoc, setIframeSrcDoc] = useState<string>('');

    const injectOriginalIsolation = (html: string, widthPx: number): string => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const maxWidthRule = widthPx > 0 ? `${widthPx}px` : 'none';

        // ── Inject isolation + reset styles ──────────────────────────────────
        // We intentionally do NOT constrain body width here — agent HTML often
        // sets body { width: 297mm } or uses .report-container { width: 297mm }
        // which would override any body max-width rule we inject, causing the
        // content to span the full iframe width.
        //
        // Instead we reset body to be a neutral full-width scroll container
        // and wrap the body's content in a centred wrapper div (below).
        const resetStyles = `
<style data-original-view="true">
  ${iframeIsolationStyles.replace(/<\/?style[^>]*>/gi, '')}
  html {
    background: #9a9a9a !important;
  }
  html, body {
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
    background: #9a9a9a !important;
    overflow-x: hidden !important;
  }
  /* Wrapper div injected by us — agent styles never target #__orig_wrap__ */
  #__orig_wrap__ {
    background: #fff;
    max-width: ${maxWidthRule};
    margin: 32px auto !important;
    padding: 32px 40px !important;
    min-height: calc(100vh - 64px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    border-radius: 4px;
    box-sizing: border-box;
    overflow-x: auto;
  }
  /* Prevent agent table styles from overflowing the wrapper */
  #__orig_wrap__ table {
    max-width: 100%;
    box-sizing: border-box;
  }
  @media screen and (max-width: ${Math.max(960, widthPx)}px) {
    #__orig_wrap__ {
      max-width: 95%;
      margin: 16px auto !important;
      padding: 24px 20px !important;
    }
  }
  @media print {
    html, body { background: white !important; }
    #__orig_wrap__ {
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }
</style>`;

        if (!doc.head.innerHTML.includes('data-original-view="true"')) {
            doc.head.insertAdjacentHTML('beforeend', resetStyles);
        }

        // ── Wrap body content in our centred div ──────────────────────────────
        // Moves all existing body children into #__orig_wrap__ so they are
        // constrained by our max-width without fighting agent body/root styles.
        if (doc.body && !doc.body.querySelector('#__orig_wrap__')) {
            const wrapper = doc.createElement('div');
            wrapper.id = '__orig_wrap__';

            // Move every current body child into the wrapper
            while (doc.body.firstChild) {
                wrapper.appendChild(doc.body.firstChild);
            }
            doc.body.appendChild(wrapper);
        }

        // ── Extract and re-run inline scripts ─────────────────────────────────
        // DOMParser doesn't execute scripts. We collect them, remove from DOM,
        // and re-inject as an eval runner so Chart.js init etc. still works.
        // Two-phase approach: collect all DCL handlers after all scripts eval,
        // then fire them — same pattern as the pagination engine.
        const bodyScripts: string[] = [];
        doc.body?.querySelectorAll('script:not([src])').forEach((script) => {
            const scriptSrc = script.textContent?.trim() || '';
            if (scriptSrc) bodyScripts.push(scriptSrc);
            script.remove();
        });

        if (bodyScripts.length > 0) {
            const encodedScripts = JSON
                .stringify(bodyScripts)
                .replace(/<\/script>/gi, '<\\/script>');

            const runner = `
<script>
(function () {
  var scripts = ${encodedScripts};
  if (scripts.length === 0) return;

  // Two-phase: collect DCL handlers during eval, fire after all scripts done
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

  scripts.forEach(function (src) {
    try { (0, eval)(src); } catch (e) {
      console.warn('[OriginalView] Script eval error:', e);
    }
  });

  window.addEventListener   = origWinAdd;
  document.addEventListener = origDocAdd;

  // Null-safe getElementById — prevents one missing element aborting the handler
  var _origGet = document.getElementById.bind(document);
  document.getElementById = function (id) {
    return _origGet(id) || document.createElement('div');
  };

  dclHandlers.forEach(function (handler) {
    try { handler(new Event('DOMContentLoaded')); } catch (e) {
      console.warn('[OriginalView] DOMContentLoaded handler error:', e);
    }
  });

  document.getElementById = _origGet;
})();
</script>`;
            doc.body?.insertAdjacentHTML('beforeend', runner);
        }

        if (doc.body && !doc.body.querySelector('script[data-original-width-listener="true"]')) {
            doc.body.insertAdjacentHTML('beforeend', `
<script data-original-width-listener="true">
(function () {
  function applyWidth(w) {
    var wrap = document.getElementById('__orig_wrap__');
    if (wrap) {
      wrap.style.maxWidth = (w === 0 ? 'none' : w + 'px');
    }
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'SET_ORIGINAL_WIDTH') return;
    applyWidth(e.data.width);
  });

  applyWidth(${widthPx});
})();
</script>`);
        }

        return doc.documentElement?.outerHTML || html;
    };

    useEffect(() => {
        if (src) {
            setIframeSrcDoc('');
        } else if (htmlContent) {
            setIframeSrcDoc(injectOriginalIsolation(htmlContent, originalWidth));
        }
    }, [htmlContent, src, originalWidth]);

    // Forward width changes to the live iframe via postMessage — no srcdoc regen needed.
    useEffect(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage({ type: 'SET_ORIGINAL_WIDTH', width: originalWidth }, '*');
    }, [iframeSrcDoc, originalWidth]);

    useEffect(() => {
        onIframeRef?.(iframeRef.current);
    }, [iframeSrcDoc, onIframeRef]);

    const hasContent = !!(htmlContent || src);

    return (
        <div className={cn('flex-1 bg-black/40 overflow-auto relative', className)}>
            {!hasContent && <LoadingOverlay />}
            <iframe
                ref={iframeRef}
                src={src}
                srcDoc={iframeSrcDoc || undefined}
                className={cn("w-full h-full border-0", !hasContent && "opacity-0")}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setIsLoading(false)}
                title="Preview (Original)"
            />
        </div>
    );
};
