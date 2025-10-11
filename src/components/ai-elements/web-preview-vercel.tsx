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
          'flex items-center justify-center gap-1 px-2 py-2 bg-muted/30 border-b border-border',
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
      className={cn('h-7 w-7 rounded-md hover:bg-accent', className)}
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
    <form onSubmit={handleSubmit} className="mx-1 flex-1" style={{ maxWidth: '70%' }}>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border hover:border-border/80 transition-colors h-9',
          className
        )}
      >
        <div className="flex-1 overflow-hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            readOnly={readOnly}
            className="w-full bg-transparent text-xs text-foreground outline-none border-none"
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
  html?: string;
  css?: string;
  js?: string;
  className?: string;
}

export const WebPreviewBody: React.FC<WebPreviewBodyProps> = ({
  src,
  html,
  css,
  js,
  className,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setIsLoading } = useWebPreview();

  const generateDocument = () => {
    if (!html && !css && !js) return '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
      line-height: 1.5;
    }
    ${css || ''}
  </style>
</head>
<body>
  ${html || ''}
  <script>
    try {
      ${js || ''}
    } catch (error) {
      console.error('JavaScript Error:', error);
    }
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;

      if (src) {
        iframe.src = src;
      } else if (html || css || js) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          setIsLoading(true);
          doc.open();
          doc.write(generateDocument());
          doc.close();
          setIsLoading(false);
        }
      }
    }
  }, [html, css, js, src, setIsLoading]);

  return (
    <div className={cn('flex-1 bg-muted/20 overflow-hidden', className)}>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setIsLoading(false)}
        title="Preview"
      />
    </div>
  );
};

// WebPreviewConsole Component
export interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export interface WebPreviewConsoleProps {
  logs?: ConsoleLog[];
  className?: string;
  maxHeight?: string;
}

export const WebPreviewConsole: React.FC<WebPreviewConsoleProps> = ({
  logs = [],
  className,
  maxHeight = '200px',
}) => {
  const getLogColor = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-foreground';
    }
  };

  const getLogIcon = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return '✖';
      case 'warn':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '›';
    }
  };

  if (!logs.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-t border-border bg-muted/10 p-3 font-mono text-xs overflow-auto',
        className
      )}
      style={{ maxHeight }}
    >
      <div className="space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className={cn('flex-shrink-0', getLogColor(log.level))}>
              {getLogIcon(log.level)}
            </span>
            <span className="flex-1 text-muted-foreground break-all">
              {log.message}
            </span>
            <span className="flex-shrink-0 text-muted-foreground/50 text-[10px]">
              {log.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Display names
WebPreview.displayName = 'WebPreview';
WebPreviewNavigation.displayName = 'WebPreviewNavigation';
WebPreviewNavigationButton.displayName = 'WebPreviewNavigationButton';
WebPreviewUrl.displayName = 'WebPreviewUrl';
WebPreviewBody.displayName = 'WebPreviewBody';
WebPreviewConsole.displayName = 'WebPreviewConsole';
