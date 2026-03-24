"use client";

import React, { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { ChatInputPill } from '@/components/chat/chat-input-pill';
import ChatMessageItem from '@/components/chat/chat-message-item';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@/components/ai-elements/conversation';
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewControls,
  PreviewMode,
  PageOrientation
} from '@/components/report-viewer';
import { useSidebar } from '@/contexts/sidebar-context';
import { cn } from '@/lib/utils';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import useChatIds from '@/hooks/chat-store-hooks/use-chat-ids';
import { ChatProviderContext } from '@/contexts/chat-provider';
import SSEChatHandler from '@/services/chat-service';
import type { ToolCallData } from '@/components/chat/chat-message';
import { ChatListType, ChatStoreType } from '@/types/chat';
import { fetcher } from '@/lib/get-fetcher';
import { useEditMode } from '@/hooks/use-edit-mode';
import { EditPanel } from '@/components/editor/edit-panel';

interface ChatSessionPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

const ANIMATION_DURATION = 300;

// Utility function to extract HTML from markdown code blocks or result field
// Moved outside component to prevent recreation on every render
const extractHtmlContent = (output: any): string => {
  let html = "";
  if (output && typeof output === "object") {
    if (output.result) {
      html = output.result;
    } else if (output.code) {
      html = output.code;
    } else if (output.html) {
      html = output.html;
    } else if (Array.isArray(output.report_code)) {
      html = output.report_code
        .map((item: any) => item.html || item.code || "")
        .filter(Boolean)
        .join('\n<div class="page-break"></div>\n');
    } else if (output.report_code && typeof output.report_code === "string") {
      html = output.report_code;
    } else if (output.report_code && typeof output.report_code.html === "string") {
      html = output.report_code.html;
    }
  } else if (typeof output === "string") {
    html = output;
  }

  const match = html.trim().match(/^```(?:html)?\n?([\s\S]*?)\n?```$/);
  return match ? match[1].trim() : html.trim();
};

export default function Page({ params }: ChatSessionPageProps) {
  const resolvedParams = React.use(params);
  const pathname = usePathname();
  const chatStore = useContext(ChatProviderContext);
  const skipInitialHistoryLoad = pathname.startsWith('/pmo-intelligence/decision-intelligence/');

  useEffect(() => {
    if (skipInitialHistoryLoad) return;
    if (resolvedParams.session_id) {
      (async () => {
        try {
          const response = await fetcher(`/conversations/${resolvedParams.session_id}`);
          let chatList: ChatListType = {}
          response?.forEach((chat: any) => {
            // Try to parse response as events array if it's a JSON string
            let assistantContent: any = chat.response;

            // Check if response is a JSON string containing events
            if (typeof chat.response === 'string') {
              try {
                const parsed = JSON.parse(chat.response);
                if (Array.isArray(parsed)) {
                  assistantContent = parsed;
                }
              } catch {
                // Not JSON, check if it's HTML content (report)
                // If it contains HTML, create a synthetic report event
                const htmlContent = extractHtmlContent(chat.response);
                if (htmlContent && htmlContent.includes('<!DOCTYPE html>')) {
                  assistantContent = [{
                    event: 'report',
                    data: {
                      id: `report-${chat.id}`,
                      name: 'Report',
                      state: 'output-available',
                      output: chat.response,
                    }
                  }];
                }
              }
            }

            chatList[chat.id] = {
              userMessage: {
                id: chat.id,
                content: chat.query,
                role: "user",
              },
              assistantMessage: {
                id: chat.id,
                content: assistantContent,
                role: "assistant",
              },
              status: "Completed",
              created_at: new Date(chat.created_at),
            };
          });
          if (chatStore?.checkIfOnlyOneChat()) {
            chatStore?.setChat({ ...chatStore?.getChatList(), ...chatList });
          } else {
            chatStore?.setChat(chatList);
          }
        } catch (error) {
          console.error('Failed to fetch session:', error);
        }
      })();
    }

  }, [resolvedParams.session_id, skipInitialHistoryLoad]);

  return (
    <ChatSessionPage
      session_id={resolvedParams.session_id}
      chatStore={chatStore}
      skipInitialHistoryLoad={skipInitialHistoryLoad}
    />
  )
}

const ChatSessionPage = React.memo(function ChatSessionPage({ session_id, chatStore, skipInitialHistoryLoad }: { session_id: string, chatStore: ChatStoreType | null, skipInitialHistoryLoad?: boolean }) {
  const { collapse } = useSidebar();
  // Get all chat IDs for this session using the hook
  const allChatIds = useChatIds();

  // Deduplicate chat IDs to prevent React key errors
  const chatIds = React.useMemo(() => {
    return Array.from(new Set(allChatIds));
  }, [allChatIds]);

  const [previewData, setPreviewData] = useState({
    htmlContent: '', // Store complete HTML directly
    title: '',
    isVisible: false,
    reportId: null as string | null
  });

  const [useResizablePanels, setUseResizablePanels] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Track which report IDs have been auto-opened to prevent reopening
  const autoOpenedReportsRef = React.useRef<Set<string>>(new Set());

  // Store iframe ref for applying edits and PDF export
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const previewIframeRef = React.useRef<HTMLIFrameElement | null>(null);

  // Callback to get preview iframe for PDF export
  const getPreviewIframe = React.useCallback(() => previewIframeRef.current, []);

  // Callback when preview iframe is ready
  const handlePreviewIframeRef = React.useCallback((iframe: HTMLIFrameElement | null) => {
    previewIframeRef.current = iframe;
  }, []);

  // Edit mode functionality - uses default config from library
  const { enableEditMode, disableEditMode, selectedElement, clearSelection } = useEditMode({
    onElementSelected: (element) => {
      // console.log('Selected element:', element);
    },
  });

  const [previewMode, setPreviewMode] = useState<PreviewMode>('view');
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('original');

  React.useEffect(() => {
    if (skipInitialHistoryLoad) {
      collapse();
    }
  }, [skipInitialHistoryLoad, collapse]);

  // Handle mode change
  const handleModeChange = React.useCallback(
    (newMode: PreviewMode) => {
      setPreviewMode(newMode);
      // Clear selection when switching modes
      if (newMode === 'view') {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Handle iframe ready for edit mode
  const handleEditModeReady = React.useCallback(
    async (iframe: HTMLIFrameElement) => {
      iframeRef.current = iframe;
      if (previewMode === 'edit') {
        await enableEditMode(iframe);
      } else {
        disableEditMode(iframe);
      }
    },
    [previewMode, enableEditMode, disableEditMode]
  );

  // Watch for preview mode changes and enable/disable edit mode accordingly
  React.useEffect(() => {
    if (!iframeRef.current) return;

    if (previewMode === 'edit') {
      enableEditMode(iframeRef.current);
    } else {
      disableEditMode(iframeRef.current);
      clearSelection();
    }
  }, [previewMode, enableEditMode, disableEditMode, clearSelection]);

  // Handle property updates from edit panel
  const handlePropertyUpdate = React.useCallback(
    (property: string, value: string) => {
      if (!iframeRef.current?.contentWindow) return;

      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'APPLY_STYLE',
          property,
          value
        }, '*');
      } catch (error) {
        console.error('Failed to apply style:', error);
      }
    },
    []
  );

  // Handle reset element (single element only)
  const handleResetElement = React.useCallback(
    () => {
      if (!iframeRef.current?.contentWindow) return;

      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'RESET_ELEMENT'
        }, '*');
      } catch (error) {
        // console.error('Failed to reset element:', error);
      }
    },
    []
  );

  // Use ref to track preview state to avoid callback recreation
  const previewDataRef = React.useRef(previewData);
  React.useEffect(() => {
    previewDataRef.current = previewData;
  }, [previewData]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRetry = (messageId: string) => {
    // TODO: Implement retry logic
    console.log('Retry message:', messageId);
  };

  const handleLike = (messageId: string) => {
    // TODO: Implement like logic
    console.log('Like message:', messageId);
  };

  const handleDislike = (messageId: string) => {
    // TODO: Implement dislike logic
    console.log('Dislike message:', messageId);
  };

  const handlePreviewClick = React.useCallback((toolCallOrReport: ToolCallData | any, isAutoOpen: boolean = false) => {
    const reportId = toolCallOrReport.id;

    // If this is an auto-open, check if we should skip it
    if (isAutoOpen) {
      // Skip if this report has already been auto-opened
      if (autoOpenedReportsRef.current.has(reportId)) {
        return;
      }
      // Mark this report as auto-opened
      autoOpenedReportsRef.current.add(reportId);
    }

    const output = toolCallOrReport.output;
    const extractedHtml = extractHtmlContent(output);

    // Check if we're clicking the same report that's already open
    const isSameReport = previewDataRef.current.isVisible && previewDataRef.current.reportId === reportId;

    if (isSameReport) {
      // Same report - just update content without closing/reopening
      if (extractedHtml) {
        setPreviewData(prev => ({
          ...prev,
          htmlContent: extractedHtml,
          title: toolCallOrReport.name || prev.title
        }));
      }
      return; // Don't close and reopen
    }

    // Different report or first open - collapse sidebar and show preview
    collapse();

    // Directly set preview data without closing first (removes blank screen)
    setPreviewData({
      htmlContent: extractedHtml || '',
      title: toolCallOrReport.name || 'Web Report',
      isVisible: true,
      reportId
    });
  }, [collapse]);

  // Direct callback to update preview content when report output becomes available
  // Using ref to avoid dependency on previewData, preventing unnecessary callback recreations
  const handleReportOutputUpdate = React.useCallback((report: any) => {
    // Only update if this is the currently previewed report (use ref to avoid dependency)
    const currentPreviewData = previewDataRef.current;
    if (!currentPreviewData.isVisible || currentPreviewData.reportId !== report.id) {
      return;
    }

    const extractedHtml = extractHtmlContent(report.output);
    if (extractedHtml) {
      setPreviewData(prev => ({
        ...prev,
        htmlContent: extractedHtml,
        title: report.name || prev.title
      }));
    }
  }, []);

  const handleClosePreview = () => {
    setIsClosing(true);
    setPreviewData(prev => ({
      ...prev,
      isVisible: false,
      reportId: null
    }));
    setTimeout(() => {
      setIsClosing(false);
    }, 50);
  };

  useEffect(() => {
    if (previewData.isVisible && !isClosing && !useResizablePanels) {
      const timer = setTimeout(() => {
        setUseResizablePanels(true);
      }, ANIMATION_DURATION);

      return () => clearTimeout(timer);
    } else if ((isClosing || !previewData.isVisible) && useResizablePanels) {
      setUseResizablePanels(false);
    }
  }, [previewData.isVisible, useResizablePanels, isClosing]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!chatStore) {
      console.error('Chat store not available');
      return;
    }

    try {
      // Create SSE handler with the config object
      const sseHandler = new SSEChatHandler({
        chatStore,
        input: message.text || '',
        sessionId: session_id,
        selected_agent: message.mode,
        template_id: message.template_id,
      });

      // Start the chat (SSE handler will update the store)
      sseHandler.startChat();
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast to user
    }
  };

  const chatContent = (
    <>
      <div className='flex-1 overflow-hidden'>
        <Conversation className="w-full h-full overflow-y-auto custom-scrollbar">
          <ConversationContent className="max-w-4xl mx-auto">
            {chatIds.length === 0 ? (
              <></>
            ) : (
              chatIds.map((chatId) => (
                <ChatMessageItem
                  key={chatId}
                  chatId={chatId}
                  onCopy={handleCopy}
                  onRetry={handleRetry}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onPreviewClick={handlePreviewClick}
                  onReportOutputUpdate={handleReportOutputUpdate}
                  activeReportId={previewData.reportId}
                />
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      <div className="backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4 pt-0">
          <ChatInputPill
            onSubmit={handleSubmit}
            placeholder="Ask anything"
          />
        </div>
      </div>
    </>
  );

  // Handle close button in edit panel - switch back to view mode
  const handleCloseEditPanel = React.useCallback(() => {
    setPreviewMode('view');
    clearSelection();
  }, [clearSelection]);

  // Show edit panel in edit mode, chat otherwise
  const leftPanelContent = previewMode === 'edit' ? (
    <EditPanel
      selectedElement={selectedElement}
      onUpdate={handlePropertyUpdate}
      onReset={handleResetElement}
      onClose={handleCloseEditPanel}
    />
  ) : (
    chatContent
  );

  const shouldShowPreview = previewData.isVisible || isClosing;

  const previewContent = shouldShowPreview && (
    <WebPreview style={{ height: '100%' }}>
      <WebPreviewControls
        title={previewData.title}
        htmlContent={previewData.htmlContent}
        mode={previewMode}
        onModeChange={handleModeChange}
        orientation={pageOrientation}
        onOrientationChange={setPageOrientation}
        onClose={handleClosePreview}
        getPreviewIframe={getPreviewIframe}
      />
      <WebPreviewBody
        htmlContent={previewData.htmlContent}
        editMode={previewMode === 'edit'}
        orientation={pageOrientation}
        onEditModeReady={handleEditModeReady}
        onIframeRef={handlePreviewIframeRef}
      />
    </WebPreview>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {useResizablePanels && previewData.isVisible && !isClosing ? (
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={30} minSize={30} maxSize={70} className="flex flex-col">
            {leftPanelContent}
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group">
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </PanelResizeHandle>

          <Panel defaultSize={70} minSize={30} maxSize={70} className="border-l border-border relative">
            {previewContent}
          </Panel>
        </PanelGroup>
      ) : (
        <>
          <div className={cn(
            "flex flex-col transition-all duration-300 ease-in-out",
            shouldShowPreview ? "w-[30%]" : "w-full"
          )}>
            {leftPanelContent}
          </div>

          {shouldShowPreview && (
            <div className={cn(
              "w-[70%] border-l border-border relative transition-all duration-300 ease-in-out",
              isClosing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
            )}>
              {previewContent}
            </div>
          )}
        </>
      )}
    </div>
  );
});
