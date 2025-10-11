"use client";

import React, { useState } from 'react';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
  PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Plus, Search, Globe } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = "What would you like to know?",
  className = "",
  disabled = false
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (disabled) return;

    setIsSubmitting(true);

    try {
      await onSubmit(message);
      setInputValue(''); // Reset input after successful submission
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className={`border border-white/15 bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl divide-white/15 ${className}`}
      accept="image/*"
      multiple
      maxFiles={10}
      maxFileSize={10 * 1024 * 1024}
    >
      <PromptInputBody className="bg-transparent custom-scrollbar">
        <PromptInputAttachments>
          {(attachment) => (
            <PromptInputAttachment
              data={attachment}
              className="border-white/10 bg-black/10"
            />
          )}
        </PromptInputAttachments>
        <PromptInputTextarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="text-white/90 placeholder:text-white/40 text-base"
          disabled={disabled}
        />
      </PromptInputBody>
      <PromptInputToolbar className="bg-black/10">
        <PromptInputTools>
          <div className="flex items-center gap-1">
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger className="text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
              </PromptInputActionMenuTrigger>
              <PromptInputActionMenuContent className="bg-card border-white/10">
                <PromptInputActionAddAttachments className="text-white/80 hover:bg-black/20 hover:text-white" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>

            <button
              type="button"
              className="p-2 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors"
              disabled={disabled}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="px-3 py-2 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors flex items-center gap-2 text-sm"
              disabled={disabled}
            >
              <Globe className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={(!inputValue.trim() && !isSubmitting) || disabled}
          status={isSubmitting ? 'submitted' : 'ready'}
          className="bg-white hover:bg-white/90 text-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        />
      </PromptInputToolbar>
    </PromptInput>
  );
}