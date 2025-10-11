"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
  type TaskStatus
} from '@/components/ai-elements/task';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolOutput
} from '@/components/ai-elements/tool';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Monitor, WrenchIcon, CircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface TaskData {
  id: string;
  title: string;
  status: TaskStatus;
  description?: string;
  files?: string[];
}

export interface ToolCallData {
  id: string;
  name: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
  onPreviewClick?: () => void;
}

export interface ChatMessageData {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  files?: any[];
  reasoning?: string;
  isStreaming?: boolean;
  reasoningDuration?: number;
  tasks?: TaskData[];
  toolCalls?: ToolCallData[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  onCopy: (content: string) => void;
  onRetry: (messageId: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onPreviewClick?: (toolCall: ToolCallData) => void;
}

export const ChatMessage = React.memo(({
  message,
  onCopy,
  onRetry,
  onLike,
  onDislike,
  onPreviewClick
}: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const isAssistant = message.sender === 'assistant';

  return (
    <Message
      from={message.sender}
      className="group/message"
    >
      <div className={cn(
        "flex flex-col gap-2 w-full",
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Show reasoning for assistant messages if available */}
        {isAssistant && message.reasoning && (
          <div className="w-full max-w-2xl">
            <Reasoning
              isStreaming={message.isStreaming}
              duration={message.reasoningDuration}
              className="mb-3"
            >
              <ReasoningTrigger />
              <ReasoningContent>{message.reasoning}</ReasoningContent>
            </Reasoning>
          </div>
        )}

        {/* Show tasks for assistant messages if available */}
        {isAssistant && message.tasks && message.tasks.length > 0 && (
          <div className="w-full max-w-2xl mb-3">
            <Task>
              <TaskTrigger
                title="Agent Tasks"
                taskCount={message.tasks.length}
                completedCount={message.tasks.filter(t => t.status === 'completed').length}
              />
              <TaskContent>
                {message.tasks.map(task => (
                  <TaskItem key={task.id} status={task.status}>
                    <span className="font-medium">{task.title}</span>
                    {task.description && (
                      <span className="text-muted-foreground ml-2">
                        {task.description}
                      </span>
                    )}
                    {task.files && task.files.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {task.files.map((file, idx) => (
                          <TaskItemFile key={idx}>{file}</TaskItemFile>
                        ))}
                      </div>
                    )}
                  </TaskItem>
                ))}
              </TaskContent>
            </Task>
          </div>
        )}

        {/* Show tool calls for assistant messages if available */}
        {isAssistant && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-3 mb-3">
            {message.toolCalls.map(toolCall => (
              <div
                key={toolCall.id}
                className={cn(
                  "relative rounded-lg p-4 transition-all duration-200 bg-muted/30",
                  toolCall.state === 'output-available' && toolCall.name === 'generate_preview'
                    ? "cursor-pointer hover:bg-muted/50 active:bg-muted/60"
                    : ""
                )}
                onClick={() => {
                  console.log('🔍 Tool card clicked:', {
                    state: toolCall.state,
                    name: toolCall.name,
                    hasOutput: !!toolCall.output,
                    outputHtml: !!toolCall.output?.html
                  });

                  // Always try to call onPreviewClick for generate_preview tools that are completed
                  if (toolCall.name === 'generate_preview' && toolCall.state === 'output-available') {
                    console.log('✅ Calling onPreviewClick...');
                    onPreviewClick?.(toolCall);
                  } else {
                    console.log('❌ Not calling onPreviewClick - state:', toolCall.state, 'name:', toolCall.name);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <WrenchIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {toolCall.name === 'generate_preview' ? 'Dashboard Preview' : toolCall.name}
                  </span>
                  {toolCall.state === 'input-streaming' && (
                    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
                      <CircleIcon className="size-4" />
                      Pending
                    </Badge>
                  )}
                  {toolCall.state === 'input-available' && (
                    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
                      <ClockIcon className="size-4 animate-pulse" />
                      Running
                    </Badge>
                  )}
                  {toolCall.state === 'output-available' && (
                    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
                      <CheckCircleIcon className="size-4 text-green-600" />
                      Completed
                    </Badge>
                  )}
                  {toolCall.state === 'output-error' && (
                    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
                      <XCircleIcon className="size-4 text-red-600" />
                      Error
                    </Badge>
                  )}
                </div>

                {toolCall.state === 'output-available' && toolCall.name === 'generate_preview' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Monitor className="w-3 h-3" />
                    <span>Click to open preview →</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <MessageContent
          variant="contained"
          data-user={isUser}
        >
          {isAssistant ? (
            <Response>{message.content}</Response>
          ) : (
            <div className="w-full">
              {message.content}
            </div>
          )}
        </MessageContent>

        {/* Actions */}
        <Actions className={cn(
          isUser
            ? 'opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 justify-end'
            : 'justify-start'
        )}>
          {isUser ? (
            <Action
              tooltip="Copy message"
              onClick={() => onCopy(message.content)}
            >
              <Copy className="size-4" />
            </Action>
          ) : (
            <>
              <Action
                tooltip="Copy message"
                onClick={() => onCopy(message.content)}
              >
                <Copy className="size-4" />
              </Action>
              <Action
                tooltip="Regenerate response"
                onClick={() => onRetry(message.id)}
              >
                <RefreshCw className="size-4" />
              </Action>
              <Action
                tooltip="Good response"
                onClick={() => onLike(message.id)}
              >
                <ThumbsUp className="size-4" />
              </Action>
              <Action
                tooltip="Bad response"
                onClick={() => onDislike(message.id)}
              >
                <ThumbsDown className="size-4" />
              </Action>
            </>
          )}
        </Actions>
      </div>
    </Message>
  );
});

ChatMessage.displayName = 'ChatMessage';