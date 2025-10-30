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
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Monitor, WrenchIcon, CircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatStatus } from '@/types/chat';

// Use types from our centralized chat types
export interface TaskData {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
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
  isStreaming?: boolean;
  events?: import('@/types/chat').ContentEvent[]; // New: ordered events array
  // Legacy fields (deprecated, kept for backward compatibility)
  reasoning?: string;
  reasoningDuration?: number;
  reasoningStreaming?: boolean;
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
  status?: ChatStatus
}

export const ChatMessage = React.memo(({
  message,
  onCopy,
  onRetry,
  onLike,
  onDislike,
  onPreviewClick,
  status
}: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const isAssistant = message.sender === 'assistant';

  // Process events if available (new approach) - preserving order
  const processedEvents = React.useMemo(() => {
    if (!message.events || message.events.length === 0) return null;

    // Create ordered items that maintain the sequence of events
    const orderedItems: Array<{
      type: 'reasoning' | 'tool_call' | 'task' | 'text';
      idx: number;
      data: any;
    }> = [];
    
    const toolCallsMap = new Map<string, { data: any; idx: number }>();
    const tasksMap = new Map<string, { data: any; idx: number }>();
    const textChunks: string[] = [];
    let currentReasoningChunks: string[] = [];
    let currentReasoningStartIdx = -1;

    // Single pass through events for better performance
    for (let idx = 0; idx < message.events.length; idx++) {
      const event = message.events[idx];
      
      switch (event.event) {
        case 'reasoning':
          if (event.data.delta) {
            if (currentReasoningStartIdx === -1) {
              currentReasoningStartIdx = idx;
            }
            currentReasoningChunks.push(event.data.delta);
          }
          if (event.data.complete) {
            // Add completed reasoning block at its position
            orderedItems.push({
              type: 'reasoning',
              idx: currentReasoningStartIdx,
              data: {
                content: currentReasoningChunks.join(''),
                duration: event.data.duration,
                complete: true
              }
            });
            currentReasoningChunks = [];
            currentReasoningStartIdx = -1;
          }
          break;

        case 'tool_call':
          // Track tool call and its first occurrence index
          const existing = toolCallsMap.get(event.data.id);
          if (existing) {
            // Update existing tool call data
            existing.data = { ...existing.data, ...event.data };
          } else {
            // First time seeing this tool call
            toolCallsMap.set(event.data.id, { data: event.data, idx });
            orderedItems.push({
              type: 'tool_call',
              idx,
              data: { id: event.data.id } // Placeholder, will be filled later
            });
          }
          break;

        case 'task':
          const existingTask = tasksMap.get(event.data.task.id);
          const taskStatus: TaskStatus = event.data.task.status === 'error' 
            ? 'failed' 
            : event.data.task.status as TaskStatus;
          
          if (existingTask) {
            existingTask.data = { ...existingTask.data, ...event.data.task, status: taskStatus };
          } else {
            tasksMap.set(event.data.task.id, { data: { ...event.data.task, status: taskStatus }, idx });
            orderedItems.push({
              type: 'task',
              idx,
              data: { id: event.data.task.id }
            });
          }
          break;

        case 'delta':
          textChunks.push(event.data.delta);
          break;
      }
    }

    // If there's incomplete reasoning, add it
    if (currentReasoningChunks.length > 0) {
      orderedItems.push({
        type: 'reasoning',
        idx: currentReasoningStartIdx,
        data: {
          content: currentReasoningChunks.join(''),
          complete: false
        }
      });
    }

    // Fill in the actual tool call and task data
    for (let i = 0; i < orderedItems.length; i++) {
      const item = orderedItems[i];
      if (item.type === 'tool_call') {
        const toolData = toolCallsMap.get(item.data.id);
        if (toolData) {
          item.data = toolData.data;
        }
      } else if (item.type === 'task') {
        const taskData = tasksMap.get(item.data.id);
        if (taskData) {
          item.data = taskData.data;
        }
      }
    }

    return {
      orderedItems,
      textContent: textChunks.join('')
    };
  }, [message.events]);

  return (
    <Message
      from={message.sender}
      className="group/message w-full"
    >
      <div className={cn(
        "w-full flex flex-col gap-2",
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Render events in their actual order */}
        {isAssistant && processedEvents && (
          <>
            {processedEvents.orderedItems.map((item, itemIdx) => {
              // Render based on item type
              if (item.type === 'reasoning') {
                return (
                  <ReasoningBlock
                    key={`reasoning-${item.idx}-${itemIdx}`}
                    data={item.data}
                    status={status}
                  />
                );
              }

              if (item.type === 'tool_call') {
                return (
                  <ToolCallBlock
                    key={`tool-${item.data.id}-${itemIdx}`}
                    toolCall={item.data}
                    onPreviewClick={onPreviewClick}
                  />
                );
              }

              if (item.type === 'task') {
                return (
                  <TaskBlock
                    key={`task-${item.data.id}-${itemIdx}`}
                    task={item.data}
                  />
                );
              }

              return null;
            })}
          </>
        )}

        {/* Legacy: Show reasoning for assistant messages if available (backward compatibility) */}
        {isAssistant && !processedEvents && message.reasoning && (
          <div className="w-full">
            <Reasoning
              isStreaming={message.reasoningStreaming}
              duration={message.reasoningDuration}
              className="mb-3"
              defaultOpen={status !== 'Completed'}
            >
              <ReasoningTrigger />
              <ReasoningContent>{message.reasoning}</ReasoningContent>
            </Reasoning>
          </div>
        )}

        {/* Legacy: Show tasks for assistant messages if available (backward compatibility) */}
        {isAssistant && !processedEvents && message.tasks && message.tasks.length > 0 && (
          <div className="w-full mb-3">
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

        {/* Legacy: Show tool calls for assistant messages if available (backward compatibility) */}
        {isAssistant && !processedEvents && message.toolCalls && message.toolCalls.length > 0 && (
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
                  if (toolCall.name === 'generate_preview' && toolCall.state === 'output-available') {
                    onPreviewClick?.(toolCall);
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
            <Response className='w-full'>
              {processedEvents ? processedEvents.textContent : message.content}
            </Response>
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

// Memoized sub-components for better performance
const ReasoningBlock = React.memo(({ data, status }: { data: any; status?: ChatStatus }) => (
  <div className="w-full">
    <Reasoning
      isStreaming={!data.complete}
      duration={data.duration}
      className="mb-3"
      defaultOpen={!data.complete || status !== 'Completed'}
    >
      <ReasoningTrigger />
      <ReasoningContent>{data.content}</ReasoningContent>
    </Reasoning>
  </div>
));

const ToolCallBlock = React.memo(({ toolCall, onPreviewClick }: { toolCall: any; onPreviewClick?: (toolCall: any) => void }) => {
  const toolTitle = toolCall.name === 'generate_preview' ? 'Dashboard Preview' : toolCall.name || 'Tool';
  
  return (
    <div className="w-full">
      <Tool className="border border-white/20 rounded-lg">
        <ToolHeader
          title={toolTitle}
          type={toolCall.name || 'tool'}
          state={toolCall.state}
          className="text-white/85"
        />
        <ToolContent>
          {/* Show input if available */}
          {toolCall.input && (
            <div className="space-y-2 p-4">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Parameters
              </h4>
              <div className="rounded-md bg-muted/50 border border-white/10">
                <CodeBlock code={JSON.stringify(toolCall.input, null, 2)} language="json" />
              </div>
            </div>
          )}
          
          {/* Show output if available */}
          <div className="p-4">
            {(toolCall.output || toolCall.errorText) && (
              <div className="rounded-md bg-muted/50 border border-white/10 overflow-x-auto">
                <ToolOutput
                  output={toolCall.output}
                  errorText={toolCall.errorText}
                  className=" !border-none !rounded-none"
                />
              </div>
            )}
          </div>
          
          {/* Special handling for generate_preview tool */}
          {toolCall.state === 'output-available' && toolCall.name === 'generate_preview' && toolCall.output && (
            <div className="p-4 border-t">
              <button
                onClick={() => onPreviewClick?.(toolCall)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Monitor className="w-4 h-4" />
                <span>Open Preview</span>
              </button>
            </div>
          )}
        </ToolContent>
      </Tool>
    </div>
  );
});

const TaskBlock = React.memo(({ task }: { task: any }) => (
  <div className="w-full">
    <Task>
      <TaskTrigger
        title="Agent Task"
        taskCount={1}
        completedCount={task.status === 'completed' ? 1 : 0}
      />
      <TaskContent>
        <TaskItem status={task.status}>
          <span className="font-medium">{task.title}</span>
          {task.description && (
            <span className="text-muted-foreground ml-2">
              {task.description}
            </span>
          )}
          {task.files && task.files.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {task.files.map((file: string, idx: number) => (
                <TaskItemFile key={idx}>{file}</TaskItemFile>
              ))}
            </div>
          )}
        </TaskItem>
      </TaskContent>
    </Task>
  </div>
));

ReasoningBlock.displayName = 'ReasoningBlock';
ToolCallBlock.displayName = 'ToolCallBlock';
TaskBlock.displayName = 'TaskBlock'