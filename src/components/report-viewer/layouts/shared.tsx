import React from 'react';

export const LoadingOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 z-10">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Generating Your Report</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Your interactive report is being created. This will only take a moment...
                </p>
            </div>
            <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

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
