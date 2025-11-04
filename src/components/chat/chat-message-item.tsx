"use client";

import React, { useMemo } from 'react';
import { ChatMessage, type ChatMessageData } from './chat-message';
import { ChatLoadingIndicator } from './chat-loading-indicator';
import useChatItem from '@/hooks/chat-store-hooks/use-chat-item';
import type { ChatItemType, ContentEvent } from '@/types/chat';

interface ChatMessageItemProps {
  chatId: string;
  onCopy: (content: string) => void;
  onRetry: (messageId: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onPreviewClick?: (toolCall: any) => void;
  onReportOutputUpdate?: (report: any) => void;
}

/**
 * Memoized message item component that subscribes to a single chat item
 * Only re-renders when the specific chat item changes
 */
const ChatMessageItem = React.memo(({
  chatId,
  onCopy,
  onRetry,
  onLike,
  onDislike,
  onPreviewClick,
  onReportOutputUpdate
}: ChatMessageItemProps) => {
  // Subscribe to this specific chat item
  const chatItem = useChatItem(chatId);

  // Convert chat item to message data format
  const messages = useMemo((): ChatMessageData[] => {
    if (!chatItem) return [];

    const messageList: ChatMessageData[] = [];

    // Add user message
    if (chatItem.userMessage) {
      messageList.push({
        id: chatItem.userMessage.id,
        content: chatItem.userMessage.content as string,
        sender: 'user',
        timestamp: chatItem.created_at ?? new Date(),
      });
    }

    // Add assistant message
    if (chatItem.assistantMessage) {
      const assistantMsg = chatItem.assistantMessage;
      
      // Check if content is events array or string
      if (Array.isArray(assistantMsg.content)) {
        // Pass events array directly
        messageList.push({
          id: assistantMsg.id,
          content: '', // Will be computed from events
          sender: 'assistant',
          timestamp: new Date(),
          isStreaming: chatItem.status !== 'Completed',
          events: assistantMsg.content as ContentEvent[],
        });
      } else {
        // Plain string content (for history/fallback)
        messageList.push({
          id: assistantMsg.id,
          content: assistantMsg.content,
          sender: 'assistant',
          timestamp: new Date(),
          isStreaming: chatItem.status !== 'Completed',
        });
      }
    }

    return messageList;
  }, [chatItem]);

  // Don't render if no messages
  if (messages.length === 0) return null;

  // Check if we should show loading indicator
  const shouldShowLoading = chatItem?.status === 'Not_Started' ||
                             (chatItem?.userMessage && !chatItem?.assistantMessage);

  // Check if we should show error message
  const shouldShowError = chatItem?.status === 'Failed' && !chatItem?.assistantMessage;

  return (
    <>
      {messages.map((message, idx) => (
        <ChatMessage
          key={idx}
          message={message}
          onCopy={onCopy}
          onRetry={onRetry}
          onLike={onLike}
          onDislike={onDislike}
          onPreviewClick={onPreviewClick}
          onReportOutputUpdate={onReportOutputUpdate}
          status={chatItem?.status}
        />
      ))}
      {shouldShowLoading && <ChatLoadingIndicator />}
      {shouldShowError && (
        <div className="flex items-start gap-4 p-6 animate-in fade-in duration-500">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-400">Something went wrong</span>
            </div>
            <p className="text-sm text-white/70">
              An error occurred while processing your request. Please try again after some time.
            </p>
            <button
              onClick={() => onRetry(chatId)}
              className="mt-2 text-xs text-white/50 hover:text-white/80 underline transition-colors"
            >
              Click here to retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if chatId changes
  return prevProps.chatId === nextProps.chatId;
});

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
