"use client";

/**
 * Demo page to showcase different loading indicator styles
 * This file is for demo purposes only - you can delete it after choosing your preferred style
 */

import React from 'react';
import { ChatLoadingIndicator, ChatLoadingIndicatorMinimal, ChatLoadingIndicatorSpinner } from './chat-loading-indicator';

export default function LoadingIndicatorDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Loading Indicator Options</h1>
          <p className="text-muted-foreground">Choose your preferred loading style for the chat interface</p>
        </div>

        <div className="space-y-8">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <h2 className="font-semibold">1. Full Loading Indicator (Default)</h2>
              <p className="text-sm text-muted-foreground">Shows animated dots, thinking text, and skeleton lines with shimmer effect</p>
            </div>
            <div className="bg-card">
              <ChatLoadingIndicator />
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <h2 className="font-semibold">2. Minimal Loading Indicator</h2>
              <p className="text-sm text-muted-foreground">Simple and clean - just animated dots in a bubble</p>
            </div>
            <div className="bg-card">
              <ChatLoadingIndicatorMinimal />
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <h2 className="font-semibold">3. Spinner Loading Indicator</h2>
              <p className="text-sm text-muted-foreground">Professional spinner with status text</p>
            </div>
            <div className="bg-card">
              <ChatLoadingIndicatorSpinner />
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="font-semibold text-blue-500 mb-2">How to Switch Styles</h3>
          <p className="text-sm text-muted-foreground">
            To use a different style, simply replace <code className="bg-muted px-1 py-0.5 rounded">ChatLoadingIndicator</code> 
            {' '}with one of the other components in{' '}
            <code className="bg-muted px-1 py-0.5 rounded">chat-message-item.tsx</code>:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li><code className="bg-muted px-1 py-0.5 rounded">ChatLoadingIndicatorMinimal</code> - for minimal style</li>
            <li><code className="bg-muted px-1 py-0.5 rounded">ChatLoadingIndicatorSpinner</code> - for spinner style</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


