"use client";

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

export interface WebPreviewContextType {
    url: string;
    setUrl: (url: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const WebPreviewContext = createContext<WebPreviewContextType | null>(null);

export const useWebPreview = () => {
    const context = useContext(WebPreviewContext);
    if (!context) {
        throw new Error('WebPreview components must be used within WebPreview');
    }
    return context;
};

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
            <TooltipProvider>
                <div
                    className={cn('flex flex-col bg-background overflow-hidden', className)}
                    style={style}
                >
                    {children}
                </div>
            </TooltipProvider>
        </WebPreviewContext.Provider>
    );
};
