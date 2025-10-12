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
  PromptInputSubmit,
  PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Globe, FileText, MessageCircleQuestion } from 'lucide-react';
import { MetallicButton } from '@/components/ui/metallic-button';

export type ChatMode = 'web-search' | 'report-generation' | 'data-qa' | null;

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
  const [selectedMode, setSelectedMode] = useState<ChatMode>(null);

  const handleModeToggle = (mode: ChatMode) => {
    setSelectedMode(prev => prev === mode ? null : mode);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if (disabled) return;

    setIsSubmitting(true);

    try {
      const messageWithMode = {
        ...message,
        mode: selectedMode
      };
      await onSubmit(messageWithMode);
      setInputValue('');
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
          <div className="flex items-center gap-1.5">
            <MetallicButton
              type="button"
              onClick={() => handleModeToggle('web-search')}
              isActive={selectedMode === 'web-search'}
              variant="compact"
              disabled={disabled}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Web Search</span>
            </MetallicButton>

            <MetallicButton
              type="button"
              onClick={() => handleModeToggle('report-generation')}
              isActive={selectedMode === 'report-generation'}
              variant="compact"
              disabled={disabled}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Report Generation</span>
            </MetallicButton>

            <MetallicButton
              type="button"
              onClick={() => handleModeToggle('data-qa')}
              isActive={selectedMode === 'data-qa'}
              variant="compact"
              disabled={disabled}
            >
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              <span>Data Q&A</span>
            </MetallicButton>
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