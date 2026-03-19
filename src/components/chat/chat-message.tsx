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
import { Badge } from '@/components/ui/badge';
import { ChatStatus } from '@/types/chat';
import { Shimmer } from "@/components/ai-elements/shimmer";
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
  onPreviewClick?: (toolCall: ToolCallData, isAutoOpen?: boolean) => void;
  onReportOutputUpdate?: (report: any) => void;
  activeReportId?: string | null;
  status?: ChatStatus
}

export const ChatMessage = React.memo(({
  message,
  onCopy,
  onRetry,
  onLike,
  onDislike,
  onPreviewClick,
  onReportOutputUpdate,
  activeReportId,
  status
}: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const isAssistant = message.sender === 'assistant';

  // Process events if available (new approach) - preserving order
  const processedEvents = React.useMemo(() => {
    if (!message.events || message.events.length === 0) return null;

    // Ordered items maintain the true sequence of events including interleaved text
    const orderedItems: Array<{
      type: 'reasoning' | 'tool_call' | 'task' | 'report' | 'text';
      idx: number;
      data: any;
    }> = [];

    const toolCallsMap = new Map<string, { data: any; idx: number }>();
    const tasksMap = new Map<string, { data: any; idx: number }>();

    // Track in-progress text and reasoning blocks
    let currentTextChunks: string[] = [];
    let currentTextStartIdx = -1;

    let currentReasoningChunks: string[] = [];
    let currentReasoningStartIdx = -1;

    // Flush any accumulated text into orderedItems as a text block
    const flushText = () => {
      if (currentTextChunks.length > 0) {
        orderedItems.push({
          type: 'text',
          idx: currentTextStartIdx,
          data: { content: currentTextChunks.join('') }
        });
        currentTextChunks = [];
        currentTextStartIdx = -1;
      }
    };

    // Single pass through events
    for (let idx = 0; idx < message.events.length; idx++) {
      const event = message.events[idx];

      switch (event.event) {
        case 'reasoning':
          // Reasoning interrupts text; flush any pending text first
          flushText();

          if (event.data.delta) {
            if (currentReasoningStartIdx === -1) {
              currentReasoningStartIdx = idx;
            }
            currentReasoningChunks.push(event.data.delta);
          }
          if (event.data.complete) {
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
          // Tool calls interrupt text; flush any pending text first
          flushText();

          {
            const existing = toolCallsMap.get(event.data.id);
            if (existing) {
              existing.data = { ...existing.data, ...event.data };
            } else {
              toolCallsMap.set(event.data.id, { data: event.data, idx });
              orderedItems.push({
                type: 'tool_call',
                idx,
                data: { id: event.data.id }
              });
            }
          }
          break;

        case 'task':
          // Tasks interrupt text; flush any pending text first
          flushText();

          {
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
          }
          break;

        case 'report':
          // Reports interrupt text; flush any pending text first
          flushText();

          {
            const existingReport = toolCallsMap.get(event.data.id);
            if (existingReport) {
              existingReport.data = { ...existingReport.data, ...event.data };
            } else {
              toolCallsMap.set(event.data.id, { data: event.data, idx });
              orderedItems.push({
                type: 'report',
                idx,
                data: { id: event.data.id }
              });
            }
          }
          break;

        case 'delta':
          // Accumulate text — do NOT flush; consecutive deltas form one text block
          if (currentTextStartIdx === -1) {
            currentTextStartIdx = idx;
          }
          currentTextChunks.push(event.data.delta);
          break;
      }
    }

    // Flush any trailing text that wasn't interrupted
    flushText();

    // If there's incomplete reasoning at the end, add it
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

    // Fill in the actual tool call, report, and task data (resolve placeholders)
    for (let i = 0; i < orderedItems.length; i++) {
      const item = orderedItems[i];
      if (item.type === 'tool_call') {
        const toolData = toolCallsMap.get(item.data.id);
        if (toolData) item.data = toolData.data;
      } else if (item.type === 'report') {
        const reportData = toolCallsMap.get(item.data.id);
        if (reportData) item.data = reportData.data;
      } else if (item.type === 'task') {
        const taskData = tasksMap.get(item.data.id);
        if (taskData) item.data = taskData.data;
      }
    }

    return { orderedItems };
  }, [message.events]);

  return (
    <Message
      from={message.sender}
      className="group/message w-full max-w-full"
    >
      <div className={cn(
        "w-full flex flex-col gap-2",
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Render events in their true backend order */}
        {isAssistant && processedEvents && (
          <>
            {processedEvents.orderedItems.map((item, itemIdx) => {
              if (item.type === 'reasoning') {
                return (
                  <ReasoningBlock
                    key={`reasoning-${item.idx}-${itemIdx}`}
                    data={item.data}
                    status={status}
                  />
                );
              }

              if (item.type === 'text') {
                return (
                  <MessageContent
                    key={`text-${item.idx}-${itemIdx}`}
                    variant="contained"
                    data-user={false}
                  >
                    <Response className='w-full'>
                      {item.data.content}
                    </Response>
                  </MessageContent>
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

              if (item.type === 'report') {
                return (
                  <ReportBlock
                    key={`report-${item.data.id}-${itemIdx}`}
                    report={item.data}
                    onPreviewClick={onPreviewClick}
                    onReportOutputUpdate={onReportOutputUpdate}
                    isActive={activeReportId === item.data.id}
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

        {/* Message content — only rendered for legacy (non-events) path or user messages */}
        {(!processedEvents || isUser) && (
          <MessageContent
            variant="contained"
            data-user={isUser}
          >
            {isAssistant ? (
              <Response className='w-full'>
                {message.content}
              </Response>
            ) : (
              <div className="w-full font-medium">
                {message.content}
              </div>
            )}
          </MessageContent>
        )}

        {/* Streaming indicator - shown at the end when streaming */}
        {isAssistant && message.isStreaming && status !== 'Failed' && (
          <div className="flex items-center gap-1 mt-1 ml-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_4px_rgba(var(--primary),0.4)]" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_4px_rgba(var(--primary),0.4)]" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_4px_rgba(var(--primary),0.4)]" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error indicator - shown when status is Failed */}
        {isAssistant && status === 'Failed' && (
          <div className="flex items-center gap-2 mt-2 ml-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0"
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
            <div className="flex-1">
              <p className="text-xs text-red-500 font-bold uppercase tracking-tight">Response Failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">An error occurred while generating the response.</p>
            </div>
          </div>
        )}

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
), (prevProps, nextProps) => {
  return (
    prevProps.data.content === nextProps.data.content &&
    prevProps.data.complete === nextProps.data.complete &&
    prevProps.data.duration === nextProps.data.duration &&
    prevProps.status === nextProps.status
  );
});

const ToolCallBlock = React.memo(({ toolCall, onPreviewClick }: { toolCall: any; onPreviewClick?: (toolCall: any, isAutoOpen?: boolean) => void }) => {
  const toolTitle = toolCall.name === 'generate_preview' ? 'Dashboard Preview' : toolCall.name || 'Tool';

  return (
    <div className="w-full max-w-full">
      <Tool className="w-full border border-border rounded-lg bg-muted/20">

        <ToolHeader
          title={toolTitle}
          type={toolCall.name || 'tool'}
          state={toolCall.state}
          className="text-foreground/80 font-semibold"
        />
        <ToolContent>
          {/* Show input if available */}
          {toolCall.input && (
            <div className="space-y-2 p-4 max-w-full">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Parameters
              </h4>
              <div className="rounded-md bg-muted/50 border border-border">
                <CodeBlock code={JSON.stringify(toolCall.input, null, 2)} language="json" />
              </div>
            </div>
          )}

          {/* Show output if available */}
          <div className="p-4 ">
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
                onClick={() => onPreviewClick?.(toolCall, false)}
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
}, (prevProps, nextProps) => {
  return (
    prevProps.toolCall.id === nextProps.toolCall.id &&
    prevProps.toolCall.name === nextProps.toolCall.name &&
    prevProps.toolCall.state === nextProps.toolCall.state &&
    prevProps.toolCall.input === nextProps.toolCall.input &&
    prevProps.toolCall.output === nextProps.toolCall.output &&
    prevProps.toolCall.errorText === nextProps.toolCall.errorText
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
), (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.description === nextProps.task.description &&
    JSON.stringify(prevProps.task.files) === JSON.stringify(nextProps.task.files)
  );
});

const ReportBlock = React.memo(({ report, onPreviewClick, onReportOutputUpdate, isActive }: {
  report: any;
  onPreviewClick?: (report: any, isAutoOpen?: boolean) => void;
  onReportOutputUpdate?: (report: any) => void;
  isActive?: boolean;
}) => {
  const reportTitle = report.name || 'Web Report';
  const isCompleted = report.state === 'output-available';
  const isError = report.state === 'output-error';
  const isStreaming = !isCompleted && !isError;
  const hasAutoOpenedRef = React.useRef(false);
  const hasUpdatedOutputRef = React.useRef(false);

  // State for lazy loading report content
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);
  const [fetchedHtmlContent, setFetchedHtmlContent] = React.useState<string | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Import the type guards and fetch utility
  const { isReportIdReference, fetchReportById } = React.useMemo(
    () => require('@/lib/report-api'),
    []
  );

  // Determine if this report has a report_id reference
  const hasReportIdReference = React.useMemo(
    () => isCompleted && report.output && isReportIdReference(report.output),
    [isCompleted, report.output, isReportIdReference]
  );

  // Auto-open preview when report event first appears (streaming only)
  React.useEffect(() => {
    const shouldAutoOpen = (report.state === 'input-streaming' || report.state === 'input-available')
      && onPreviewClick
      && !hasAutoOpenedRef.current;

    if (shouldAutoOpen) {
      hasAutoOpenedRef.current = true;
      onPreviewClick(report, true);
    }
  }, [report.state, onPreviewClick]);

  // Update preview when output becomes available (streaming with direct HTML)
  React.useEffect(() => {
    if (isCompleted && report.output && onReportOutputUpdate && !hasUpdatedOutputRef.current) {
      if (!isReportIdReference(report.output)) {
        hasUpdatedOutputRef.current = true;
        onReportOutputUpdate(report);
      }
    }
  }, [isCompleted, report.output, onReportOutputUpdate, report.id, report, isReportIdReference]);

  // Fetch report content when user clicks (lazy loading)
  const handleFetchAndPreview = React.useCallback(async () => {
    if (!isCompleted || !onPreviewClick) return;

    if (fetchedHtmlContent) {
      const reportWithFetchedContent = { ...report, output: fetchedHtmlContent };
      onPreviewClick(reportWithFetchedContent, false);
      return;
    }

    if (hasReportIdReference && report.output && typeof report.output === 'object') {
      const reportId = report.output.report_id;

      try {
        setIsLoadingReport(true);
        setFetchError(null);

        const htmlContent = await fetchReportById(reportId);
        setFetchedHtmlContent(htmlContent?.html);

        const reportWithFetchedContent = { ...report, output: htmlContent };
        onPreviewClick(reportWithFetchedContent, false);
      } catch (error) {
        console.error('Failed to fetch report:', error);
        setFetchError(error instanceof Error ? error.message : 'Failed to load report');
      } finally {
        setIsLoadingReport(false);
      }
      return;
    }

    onPreviewClick(report, false);
  }, [
    isCompleted,
    onPreviewClick,
    fetchedHtmlContent,
    hasReportIdReference,
    report,
    fetchReportById
  ]);

  const getStatusInfo = () => {
    if (isError || fetchError) {
      return {
        icon: <XCircleIcon className="size-5 text-red-500" />,
        text: 'Error',
        color: 'text-red-400'
      };
    }
    if (isLoadingReport) {
      return {
        icon: <ClockIcon className="size-5 text-blue-500 animate-spin" />,
        text: 'Loading...',
        color: 'text-blue-400'
      };
    }
    if (isCompleted) {
      return {
        icon: <CheckCircleIcon className="size-5 text-green-500" />,
        text: 'Completed',
        color: 'text-green-400'
      };
    }
    return {
      icon: <ClockIcon className="size-5 text-blue-500 animate-pulse" />,
      text: 'Generating...',
      color: 'text-blue-400'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border bg-muted/20 p-4 transition-all duration-200 relative",
        isCompleted && !isLoadingReport && "cursor-pointer hover:border-primary/50 hover:bg-muted/40",
        isLoadingReport && "opacity-75",
        isActive && "border-primary ring-1 ring-primary/50 bg-primary/5"
      )}
      onClick={handleFetchAndPreview}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-in zoom-in duration-300">
          NOW VIEWING
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {statusInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-tight">{reportTitle}</h3>
            <span className={cn("text-[10px] font-bold uppercase", statusInfo.color)}>{statusInfo.text}</span>
          </div>

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="w-4 h-4" />
              <span>Preview opening automatically...</span>
            </div>
          )}

          {isCompleted && !isLoadingReport && !fetchError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="w-4 h-4" />
              <span>Click to view report</span>
            </div>
          )}

          {(isError && report.errorText) || fetchError ? (
            <p className="text-xs text-red-400 mt-1">
              {fetchError || report.errorText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.report.id === nextProps.report.id &&
    prevProps.report.state === nextProps.report.state &&
    prevProps.report.output === nextProps.report.output &&
    prevProps.report.name === nextProps.report.name &&
    prevProps.report.errorText === nextProps.report.errorText &&
    prevProps.isActive === nextProps.isActive
  );
});

ReasoningBlock.displayName = 'ReasoningBlock';
ToolCallBlock.displayName = 'ToolCallBlock';
TaskBlock.displayName = 'TaskBlock';
ReportBlock.displayName = 'ReportBlock';