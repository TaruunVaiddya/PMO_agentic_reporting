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
  onPreviewClick
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
          status={chatItem?.status}
        />
      ))}
      {shouldShowLoading && <ChatLoadingIndicator />}
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if chatId changes
  return prevProps.chatId === nextProps.chatId;
});

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
