import React from 'react';

export const LoadingOverlay = () => null;

export const iframeIsolationStyles = `
  <style data-isolation="true">
    :where(html) { background: transparent; }
    :where(body) {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      color: #000;
      background: transparent;
    }
    * { scrollbar-width: thick; scrollbar-color: rgba(128, 128, 128, 0.3) transparent; }
    *::-webkit-scrollbar { width: 8px; height: 8px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.3); transition: background 0.2s ease; border-radius: 4px; }
    *::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.5); }
    *::-webkit-scrollbar-button { display: none; }
  </style>
`;
