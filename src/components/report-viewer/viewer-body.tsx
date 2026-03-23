"use client";

import React from 'react';
import { OriginalLayout } from './layouts/original-layout';
import { A4PortraitLayout } from './layouts/a4-portrait-layout';
import { A4LandscapeLayout } from './layouts/a4-landscape-layout';
import { PageOrientation } from './viewer-controls';

/**
 * WebPreviewBody
 *
 * Routes to the correct layout component based on `orientation`.
 *
 *   'original'  → OriginalLayout   (single scrollable view, no A4 framing)
 *   'portrait'  → A4PortraitLayout  (210 × 297 mm, paginated)
 *   'landscape' → A4LandscapeLayout (297 × 210 mm, paginated)
 *
 * Props are split by concern:
 *   • htmlPages / headerHtml / footerHtml  — paginated layouts only
 *   • htmlContent                          — original layout only (also used
 *                                           by controls for copy/download)
 *   • All other props forwarded to all layouts.
 */
export interface WebPreviewBodyProps {
    // ── Paginated layouts (portrait / landscape) ──────────────────────────
    /** One HTML string per source page. NOT pre-combined. */
    htmlPages?: string[];
    /** From layout.header — injected into every A4 page header. */
    headerHtml?: string;
    /** From layout.footer — injected into every A4 page footer. */
    footerHtml?: string;
    /**
     * User zoom multiplier (from toolbar).  Default = 1.0.
     * Forwarded via postMessage — does NOT regenerate the srcdoc.
     */
    userScale?: number;
    /** Called once when pagination fully completes with total A4 page count. */
    onTotalPageCount?: (count: number) => void;
    /** Called whenever the iframe recomputes its fit-scale (viewer resize). */
    onFitScaleChange?: (scale: number) => void;

    // ── Original layout ───────────────────────────────────────────────────
    /** Raw HTML string — used by OriginalLayout and by controls for copy/download. */
    htmlContent?: string;
    /** Optional URL — passed through to OriginalLayout if set. */
    src?: string;

    // ── Shared ────────────────────────────────────────────────────────────
    orientation?: PageOrientation;
    /**
     * Called with the mounted iframe element.
     * Use for print (iframe.contentWindow.print()) and edit-mode injection.
     */
    onIframeRef?: (iframe: HTMLIFrameElement | null) => void;
    streamingStatusText?: string;
    className?: string;
}

export const WebPreviewBody: React.FC<WebPreviewBodyProps> = ({
    orientation = 'portrait',
    // Paginated props
    htmlPages,
    headerHtml,
    footerHtml,
    userScale,
    onTotalPageCount,
    onFitScaleChange,
    // Original props
    htmlContent,
    src,
    // Shared
    onIframeRef,
    streamingStatusText,
    className,
}) => {
    if (orientation === 'original') {
        // Derive htmlContent from htmlPages if not explicitly provided —
        // ensures original view always renders even when only htmlPages are passed.
        const effectiveHtmlContent = htmlContent ?? htmlPages?.join('\n') ?? '';
        return (
            <OriginalLayout
                htmlContent={effectiveHtmlContent}
                src={src}
                onIframeRef={onIframeRef}
                streamingStatusText={streamingStatusText}
                className={className}
            />
        );
    }

    // Shared paginated props
    const paginatedProps = {
        htmlPages,
        headerHtml,
        footerHtml,
        userScale,
        onTotalPageCount,
        onFitScaleChange,
        onIframeRef,
        streamingStatusText,
        className,
    };

    if (orientation === 'landscape') {
        return <A4LandscapeLayout {...paginatedProps} />;
    }

    return <A4PortraitLayout {...paginatedProps} />;
};