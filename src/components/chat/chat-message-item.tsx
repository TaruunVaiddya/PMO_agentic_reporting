"use client";

import React, { useMemo } from 'react';
import { ChatMessage, type ChatMessageData } from './chat-message';
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
        content:chatItem.userMessage.content as string,
        sender: 'user',
        timestamp: chatItem.created_at ?? new Date(),
      });
    }

    // Add assistant message
    if (chatItem.assistantMessage) {
      const assistantMsg = chatItem.assistantMessage;
      let isStreaming = chatItem.status !== 'Completed';
      
      // Handle content based on status
      let content = '';
      let reasoning = undefined;
      let reasoningDuration = undefined;
      let reasoningStreaming = false;
      let tasks = undefined;
      let toolCalls = undefined;
      
      // Handle content based on its type, not just status
      if (typeof assistantMsg.content === 'string') {
        // Still streaming or just completed but content is still string
        content = assistantMsg.content;
        isStreaming = chatItem.status !== 'Completed';
        
        // Extract reasoning from the message structure during streaming
        if ((assistantMsg as any).reasoning) {
          reasoning = (assistantMsg as any).reasoning.content;
          reasoningDuration = (assistantMsg as any).reasoning.duration;
          reasoningStreaming = !(assistantMsg as any).reasoning.complete;
        }
      } else if (Array.isArray(assistantMsg.content)) {
        // Complete - process ContentEvent array
        const events = assistantMsg.content as ContentEvent[];
        
        // Extract data from events
        const textChunks: string[] = [];
        const taskList: any[] = [];
        const toolCallList: any[] = [];
        
        events.forEach(event => {
          switch (event.event) {
            case 'reasoning':
              if (event.data.complete) {
                reasoning = events
                  .filter(e => e.event === 'reasoning' && e.data.delta)
                  .map(e => (e as any).data.delta)
                  .join('');
                reasoningDuration = event.data.duration;
              }
              break;
              
            case 'task':
              // Collect all tasks
              const existingTaskIndex = taskList.findIndex(t => t.id === event.data.task.id);
              if (existingTaskIndex >= 0) {
                taskList[existingTaskIndex] = event.data.task;
              } else {
                taskList.push(event.data.task);
              }
              break;
              
            case 'tool_call':
              // Collect all tool calls
              const existingToolIndex = toolCallList.findIndex(t => t.id === event.data.id);
              if (existingToolIndex >= 0) {
                toolCallList[existingToolIndex] = { ...toolCallList[existingToolIndex], ...event.data };
              } else {
                toolCallList.push(event.data);
              }
              break;
              
            case 'delta':
              textChunks.push(event.data.delta);
              break;
              
            case 'metadata':
              // Can handle metadata if needed
              break;
          }
        });
        
        content = textChunks.join('');
        tasks = taskList.length > 0 ? taskList : undefined;
        toolCalls = toolCallList.length > 0 ? toolCallList : undefined;
        isStreaming = false;
      }
      
      messageList.push({
        id: assistantMsg.id,
        content,
        sender: 'assistant',
        timestamp: new Date(),
        reasoning,
        reasoningDuration,
        reasoningStreaming,
        isStreaming,
        tasks,
        toolCalls,
      });
    }

    return messageList;
  }, [chatItem]);

  // Don't render if no messages
  if (messages.length === 0) return null;

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
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if chatId changes
  return prevProps.chatId === nextProps.chatId;
});

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
