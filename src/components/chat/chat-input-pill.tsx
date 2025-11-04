"use client";

import React, { useState, useRef } from 'react';
import {
  PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Globe, FileText, MessageCircleQuestion, Plus, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ChatMode = 'web-search' | 'report-generation' | 'data-qa' | null;

interface ChatInputPillProps {
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChatInputPill({
  onSubmit,
  placeholder = "Ask anything",
  className = "",
  disabled = false
}: ChatInputPillProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ChatMode>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleModeSelect = (mode: ChatMode) => {
    setSelectedMode(prev => prev === mode ? null : mode);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (disabled || !inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const message = {
        text: inputValue,
        files: [],
        mode: selectedMode
      };
      await onSubmit(message);
      setInputValue('');
      setSelectedMode(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const maxHeight = 120; // Max ~5 lines
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  };

  const getModeIcon = () => {
    switch (selectedMode) {
      case 'web-search':
        return <Globe className="h-4 w-4" />;
      case 'report-generation':
        return <FileText className="h-4 w-4" />;
      case 'data-qa':
        return <MessageCircleQuestion className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getModeLabel = () => {
    switch (selectedMode) {
      case 'web-search':
        return 'Web Search';
      case 'report-generation':
        return 'Report';
      case 'data-qa':
        return 'Data Q&A';
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className={cn(
        "relative flex items-center gap-2 px-4 py-2.5",
        "bg-black/40 backdrop-blur-sm border border-white/15",
        "rounded-full shadow-2xl transition-all duration-200",
        "hover:border-white/20 focus-within:border-white/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {/* Plus icon dropdown for mode selection */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              "hover:bg-white/10 active:bg-white/15 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {selectedMode ? (
              <div className="flex items-center gap-1.5 text-white/90">
                {getModeIcon()}
              </div>
            ) : (
              <Plus className="h-5 w-5 text-white/60" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="bg-black/90 backdrop-blur-sm border-white/15 min-w-[200px]"
          >
            <DropdownMenuItem
              onClick={() => handleModeSelect('web-search')}
              className={cn(
                "cursor-pointer flex items-center gap-2 px-3 py-2.5",
                "text-white/90 hover:!bg-white/10 hover:!text-white focus:!bg-white/10 focus:!text-white",
                selectedMode === 'web-search' && "bg-white/5"
              )}
            >
              <Globe className="h-4 w-4" />
              <span>Web Search</span>
              {selectedMode === 'web-search' && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeSelect('report-generation')}
              className={cn(
                "cursor-pointer flex items-center gap-2 px-3 py-2.5",
                "text-white/90 hover:!bg-white/10 hover:!text-white focus:!bg-white/10 focus:!text-white",
                selectedMode === 'report-generation' && "bg-white/5"
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Report Generation</span>
              {selectedMode === 'report-generation' && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeSelect('data-qa')}
              className={cn(
                "cursor-pointer flex items-center gap-2 px-3 py-2.5",
                "text-white/90 hover:!bg-white/10 hover:!text-white focus:!bg-white/10 focus:!text-white",
                selectedMode === 'data-qa' && "bg-white/5"
              )}
            >
              <MessageCircleQuestion className="h-4 w-4" />
              <span>Data Q&A</span>
              {selectedMode === 'data-qa' && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
              )}
            </DropdownMenuItem>
            {selectedMode && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem
                  onClick={() => handleModeSelect(null)}
                  className="cursor-pointer text-white/60 hover:!bg-white/10 hover:!text-white/80 focus:!bg-white/10 focus:!text-white/80 px-3 py-2"
                >
                  <span className="text-sm">Clear selection</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mode indicator badge */}
        {selectedMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
            <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
              {getModeLabel()}
            </span>
          </div>
        )}

        {/* Input textarea */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-white/90 placeholder:text-white/40",
            "text-sm resize-none outline-none",
            "disabled:cursor-not-allowed min-h-[24px] max-h-[120px]",
            "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          )}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!inputValue.trim() || isSubmitting || disabled}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            "bg-white text-black transition-all duration-200",
            "hover:bg-white/90 active:scale-95",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}
