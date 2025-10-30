"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatLoadingIndicatorProps {
  className?: string;
}

export const ChatLoadingIndicator: React.FC<ChatLoadingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn("flex items-start gap-4 p-6 animate-in fade-in duration-500", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full metallic-bg border border-border/50 flex items-center justify-center relative overflow-hidden">
          {/* Metallic shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center relative z-10">
            <svg 
              className="w-4 h-4 text-primary animate-pulse" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Loading Content */}
      <div className="flex-1 space-y-3">
        {/* Animated dots */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">
            Thinking...
          </span>
        </div>

        {/* Skeleton lines */}
        <div className="space-y-2">
          <div className="h-3 bg-muted/50 rounded-md w-3/4 animate-pulse"></div>
          <div className="h-3 bg-muted/50 rounded-md w-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
          <div className="h-3 bg-muted/50 rounded-md w-5/6 animate-pulse" style={{ animationDelay: '200ms' }}></div>
        </div>

        {/* Shimmer effect */}
        <div className="relative overflow-hidden h-20 rounded-lg bg-muted/20">
          <div 
            className="absolute inset-0 -translate-x-full animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animationDuration: '2s',
              animationIterationCount: 'infinite',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Alternative minimal loading indicator
export const ChatLoadingIndicatorMinimal: React.FC<ChatLoadingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-4 p-6 animate-in fade-in duration-300", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full metallic-bg border border-border/50 animate-pulse flex items-center justify-center relative overflow-hidden">
          {/* Metallic shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm relative z-10"></div>
        </div>
      </div>

      {/* Typing animation */}
      <div className="flex items-center gap-1.5 px-4 py-3 metallic-card rounded-2xl">
        <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

// Spinner-style loading indicator
export const ChatLoadingIndicatorSpinner: React.FC<ChatLoadingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-4 p-6 animate-in fade-in duration-300", className)}>
      {/* Avatar with spinner */}
      <div className="flex-shrink-0 relative">
        <div className="w-8 h-8 rounded-full metallic-bg border border-border/50 flex items-center justify-center relative overflow-hidden">
          {/* Metallic shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center relative z-10">
            <svg 
              className="w-4 h-4 text-primary" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <path 
                fill="currentColor"
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
                opacity="0.2"
              />
              <path 
                fill="currentColor"
                d="M12 2v4c3.309 0 6 2.691 6 6h4c0-5.523-4.477-10-10-10z"
              >
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">AI is thinking</span>
        <span className="text-xs text-muted-foreground">Processing your request...</span>
      </div>
    </div>
  );
};

