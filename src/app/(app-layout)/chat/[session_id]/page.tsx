"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ChatInput } from '@/components/chat/chat-input';
import ChatMessageItem from '@/components/chat/chat-message-item';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from '@/components/ai-elements/conversation';
import {
  WebPreview,
  WebPreviewBody
} from '@/components/ai-elements/web-preview-vercel';
import { WebPreviewControls } from '@/components/ai-elements/web-preview-controls';
import { useSidebar } from '@/contexts/sidebar-context';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import useChatIds from '@/hooks/chat-store-hooks/use-chat-ids';
import { ChatProviderContext } from '@/contexts/chat-provider';
import SSEChatHandler from '@/services/chat-service';
import type { ToolCallData } from '@/components/chat/chat-message';
import { ChatListType, ChatStoreType } from '@/types/chat';
import { fetcher } from '@/lib/get-fetcher';

interface ChatSessionPageProps {
  params: Promise<{
    session_id: string;
  }>;
}

const ANIMATION_DURATION = 300;

export default function Page({ params }: ChatSessionPageProps) {
  const resolvedParams = React.use(params);
  const chatStore = useContext(ChatProviderContext);

  useEffect(() => {
    if(resolvedParams.session_id) {
      (async () => {
        try {
          const response = await fetcher(`/conversations/${resolvedParams.session_id}`);
          let chatList:ChatListType ={}
          response?.forEach((chat: any) => {
            chatList[chat.id] = {
              userMessage: {
                id: chat.id,
                content: chat.query,
                role: "user",
              },
              assistantMessage: {
                id: chat.id,
                content: chat.response,
                role: "assistant",
              },
              status: "Completed",
              created_at: new Date(chat.created_at),
            };
          });
          console.log("appeend chat list=============================");
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
    
  }, [resolvedParams.session_id]);

  return (
    <ChatSessionPage session_id={resolvedParams.session_id} chatStore={chatStore} />
  )
}

const ChatSessionPage = React.memo(function ChatSessionPage({ session_id, chatStore }: { session_id: string, chatStore: ChatStoreType | null}) {
  const { collapse } = useSidebar();
  // Get all chat IDs for this session using the hook
  const allChatIds = useChatIds();
  
  // Deduplicate chat IDs to prevent React key errors
  const chatIds = React.useMemo(() => {
    return Array.from(new Set(allChatIds));
  }, [allChatIds]);
  
  const [previewData, setPreviewData] = useState({
    html: '',
    css: '',
    js: '',
    title: '',
    isVisible: false
  });

  const [useResizablePanels, setUseResizablePanels] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  const handlePreviewClick = (toolCall: ToolCallData) => {
    collapse();
    setPreviewData(prev => ({ ...prev, isVisible: false }));

    setTimeout(() => {
      setPreviewData({
        html: toolCall.output?.html || '',
        css: toolCall.output?.css || '',
        js: toolCall.output?.js || '',
        title: toolCall.output?.title || 'Dashboard Preview',
        isVisible: true
      });
    }, 50);
  };

  const handleClosePreview = () => {
    setIsClosing(true);
    setPreviewData(prev => ({
      ...prev,
      isVisible: false
    }));
    setTimeout(() => {
      setIsClosing(false);
    }, 50);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!chatStore) {
      console.error('Chat store not available');
      return;
    }

    try {
      // Get selected agent from session storage (if any)
      const selectedAgent = sessionStorage.getItem('selected-agent') || null;

      // Create SSE handler with the config object
      const sseHandler = new SSEChatHandler({
        chatStore,
        input: message.text || '',
        sessionId: session_id,
        selected_agent: selectedAgent
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
          <ConversationContent className="max-w-2xl mx-auto">
            {chatIds.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="No messages yet"
                description="Start a conversation to see messages here. I can help you analyze Excel and PDF files, generate reports, and answer questions about your data."
              />
            ) : (
              // Render memoized message items - only re-render when their specific chat ID updates
              chatIds.map((chatId) => (
                <ChatMessageItem
                  key={chatId}
                  chatId={chatId}
                  onCopy={handleCopy}
                  onRetry={handleRetry}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onPreviewClick={handlePreviewClick}
                />
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      <div className="bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-4">
          <ChatInput
            onSubmit={handleSubmit}
            placeholder="Type a message..."
          />
        </div>
      </div>
    </>
  );

  const shouldShowPreview = previewData.isVisible || isClosing;

  const previewContent = shouldShowPreview && (
    <WebPreview style={{ height: '100%' }}>
      <WebPreviewControls
        title={previewData.title}
        html={previewData.html}
        css={previewData.css}
        js={previewData.js}
        onClose={handleClosePreview}
      />
      <WebPreviewBody
        html={previewData.html}
        css={previewData.css}
        js={previewData.js}
      />
    </WebPreview>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {useResizablePanels && previewData.isVisible && !isClosing ? (
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={30} minSize={30} maxSize={70} className="flex flex-col">
            {chatContent}
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
            {chatContent}
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

