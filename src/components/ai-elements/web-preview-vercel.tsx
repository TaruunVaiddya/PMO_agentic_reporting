"use client";

import React, { useRef, useEffect, useState, useContext, createContext } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WebPreviewContextType {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WebPreviewContext = createContext<WebPreviewContextType | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error('WebPreview components must be used within WebPreview');
  }
  return context;
};

// Main WebPreview Component
export interface WebPreviewProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
}

export const WebPreview: React.FC<WebPreviewProps> = ({
  children,
  className,
  style,
  defaultUrl = '',
  onUrlChange,
}) => {
  const [url, setUrl] = useState(defaultUrl);
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange?.(newUrl);
  };

  const contextValue: WebPreviewContextType = {
    url,
    setUrl: handleUrlChange,
    isLoading,
    setIsLoading,
  };

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={cn(
          'flex flex-col bg-background overflow-hidden',
          className
        )}
        style={style}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

// WebPreviewNavigation Component
export interface WebPreviewNavigationProps {
  children?: React.ReactNode;
  className?: string;
}

export const WebPreviewNavigation: React.FC<WebPreviewNavigationProps> = ({
  children,
  className,
}) => {
  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-2 bg-muted/30 border-b border-border',
          className
        )}
      >
        {children}
      </div>
    </TooltipProvider>
  );
};

// WebPreviewNavigationButton Component
export interface WebPreviewNavigationButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

export const WebPreviewNavigationButton: React.FC<WebPreviewNavigationButtonProps> = ({
  children,
  onClick,
  tooltip,
  disabled = false,
  className,
}) => {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn('h-9 w-9 rounded-md hover:bg-accent cursor-pointer', className)}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

// WebPreviewUrl Component
export interface WebPreviewUrlProps {
  src?: string;
  className?: string;
  readOnly?: boolean;
}

export const WebPreviewUrl: React.FC<WebPreviewUrlProps> = ({
  src,
  className,
  readOnly = false,
}) => {
  const { url, setUrl } = useWebPreview();
  const [inputValue, setInputValue] = useState(src || url || '');

  useEffect(() => {
    if (src) {
      setInputValue(src);
      setUrl(src);
    }
  }, [src, setUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readOnly) {
      setUrl(inputValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex justify-center px-2">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border hover:border-border/80 transition-colors h-9',
          className
        )}
        style={{ width: '60%', maxWidth: '600px' }}
      >
        <div className="flex-1 overflow-hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            readOnly={readOnly}
            className="w-full bg-transparent text-xs text-foreground text-center outline-none border-none"
            placeholder="Enter URL..."
          />
        </div>
      </div>
    </form>
  );
};

// WebPreviewBody Component
export interface WebPreviewBodyProps {
  src?: string;
  htmlContent?: string; // Complete HTML document string
  className?: string;
}

export const WebPreviewBody: React.FC<WebPreviewBodyProps> = ({
  src,
  htmlContent,
  className,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setIsLoading } = useWebPreview();

  const [iframeSrcDoc, setIframeSrcDoc] = React.useState<string>('');

  useEffect(() => {
    if (src) {
      // If src is provided, clear srcDoc to use src instead
      setIframeSrcDoc('');
    } else if (htmlContent) {
      // Use the complete HTML directly - no processing needed!
      setIframeSrcDoc(htmlContent);
    }
  }, [htmlContent, src]);

  const hasContent = !!(htmlContent || src);

  return (
    <div className={cn('flex-1 bg-muted/20 overflow-hidden relative', className)}>
      {!hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 z-10">
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            {/* Loading text */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Generating Your Report</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Your interactive report is being created. This will only take a moment...
              </p>
            </div>

            {/* Animated dots */}
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        srcDoc={iframeSrcDoc || undefined}
        className={cn("w-full h-full border-0", !hasContent && "opacity-0")}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setIsLoading(false)}
        title="Preview"
      />
    </div>
  );
};

WebPreview.displayName = 'WebPreview';
WebPreviewNavigation.displayName = 'WebPreviewNavigation';
WebPreviewNavigationButton.displayName = 'WebPreviewNavigationButton';
WebPreviewUrl.displayName = 'WebPreviewUrl';
WebPreviewBody.displayName = 'WebPreviewBody';
