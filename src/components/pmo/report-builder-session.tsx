"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ChatInputPill } from '@/components/chat/chat-input-pill';
import ChatMessageItem from '@/components/chat/chat-message-item';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from '@/components/ai-elements/conversation';
import {
    ChevronRight,
    ChevronDown,
    Sparkles,
    BarChart3,
    Search,
    Settings,
    Mic,
    Paperclip,
    Send,
    Maximize2,
    Clock,
    CalendarCheck,
    FileText,
    RotateCcw,
    Presentation,
    Wand2,
    MessageSquare,
    AlertTriangle,
    CheckSquare,
    LayoutDashboard,
    DollarSign,
    Link as LinkIcon,
    Rocket,
    Info,
    CheckCircle2
} from 'lucide-react'
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
import { ChatStoreType } from '@/types/chat';
import { useEditMode } from '@/hooks/use-edit-mode';
import { EditPanel } from '@/components/editor/edit-panel';

const ANIMATION_DURATION = 300;

const extractHtmlContent = (output: any): string => {
    let html = "";
    if (output && typeof output === "object") {
        if (output.result) {
            html = output.result;
        } else if (output.html) {
            html = output.html;
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

export function ReportBuilderSession({ session_id, chatStore }: { session_id: string, chatStore: ChatStoreType | null }) {
    const { collapse } = useSidebar();
    const allChatIds = useChatIds();

    const chatIds = React.useMemo(() => {
        return Array.from(new Set(allChatIds));
    }, [allChatIds]);

    const [previewData, setPreviewData] = useState({
        htmlContent: '',
        title: 'Report Builder Preview',
        isVisible: true, // DEFAULT TO TRUE FOR REPORT BUILDER
        reportId: null as string | null
    });

    const [useResizablePanels, setUseResizablePanels] = useState(true); // DEFAULT TO TRUE
    const [isClosing, setIsClosing] = useState(false);
    const autoOpenedReportsRef = React.useRef<Set<string>>(new Set());
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
    const previewIframeRef = React.useRef<HTMLIFrameElement | null>(null);

    const getPreviewIframe = React.useCallback(() => previewIframeRef.current, []);
    const handlePreviewIframeRef = React.useCallback((iframe: HTMLIFrameElement | null) => {
        previewIframeRef.current = iframe;
    }, []);

    const { enableEditMode, disableEditMode, selectedElement, clearSelection } = useEditMode({
        onElementSelected: (element) => { },
    });

    const [previewMode, setPreviewMode] = useState<PreviewMode>('view');
    const [pageOrientation, setPageOrientation] = useState<PageOrientation>('original');

    const handleModeChange = React.useCallback(
        (newMode: PreviewMode) => {
            setPreviewMode(newMode);
            if (newMode === 'view') {
                clearSelection();
            }
        },
        [clearSelection]
    );

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

    React.useEffect(() => {
        if (!iframeRef.current) return;
        if (previewMode === 'edit') {
            enableEditMode(iframeRef.current);
        } else {
            disableEditMode(iframeRef.current);
            clearSelection();
        }
    }, [previewMode, enableEditMode, disableEditMode, clearSelection]);

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

    const handleResetElement = React.useCallback(
        () => {
            if (!iframeRef.current?.contentWindow) return;
            try {
                iframeRef.current.contentWindow.postMessage({
                    type: 'RESET_ELEMENT'
                }, '*');
            } catch (error) { }
        },
        []
    );

    const previewDataRef = React.useRef(previewData);
    React.useEffect(() => {
        previewDataRef.current = previewData;
    }, [previewData]);

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handlePreviewClick = React.useCallback((toolCallOrReport: ToolCallData | any, isAutoOpen: boolean = false) => {
        const reportId = toolCallOrReport.id;
        if (isAutoOpen) {
            if (autoOpenedReportsRef.current.has(reportId)) return;
            autoOpenedReportsRef.current.add(reportId);
        }

        const output = toolCallOrReport.output;
        const extractedHtml = extractHtmlContent(output);
        const isSameReport = previewDataRef.current.isVisible && previewDataRef.current.reportId === reportId;

        if (isSameReport) {
            if (extractedHtml) {
                setPreviewData(prev => ({
                    ...prev,
                    htmlContent: extractedHtml,
                    title: toolCallOrReport.name || prev.title
                }));
            }
            return;
        }

        collapse();
        setPreviewData({
            htmlContent: extractedHtml || '',
            title: toolCallOrReport.name || 'Web Report',
            isVisible: true,
            reportId
        });
    }, [collapse]);

    const handleReportOutputUpdate = React.useCallback((report: any) => {
        const currentPreviewData = previewDataRef.current;
        if (!currentPreviewData.isVisible || currentPreviewData.reportId !== report.id) return;

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
        // In Report Builder, closing preview might just hide it but we usually want it open.
        // However, we'll allow closing it for flexibility, but it won't be the default.
        setIsClosing(true);
        setPreviewData(prev => ({
            ...prev,
            isVisible: false,
            reportId: null
        }));
        setTimeout(() => {
            setIsClosing(false);
        }, 300);
    };

    const handleSubmit = async (message: PromptInputMessage) => {
        if (!chatStore) return;
        try {
            const sseHandler = new SSEChatHandler({
                chatStore,
                input: message.text || '',
                sessionId: session_id,
                selected_agent: message.mode,
                template_id: message.template_id,
            });
            sseHandler.startChat();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const chatContent = (
        <>
            <div className='flex-1 overflow-hidden'>
                <Conversation className="w-full h-full overflow-y-auto custom-scrollbar">
                    <ConversationContent className="max-w-4xl mx-auto">
                        {chatIds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center mt-20">
                                <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">Describe the report you want to build and I'll generate the draft for you.</p>
                            </div>
                        ) : (
                            chatIds.map((chatId) => (
                                <ChatMessageItem
                                    key={chatId}
                                    chatId={chatId}
                                    onCopy={handleCopy}
                                    onRetry={() => { }}
                                    onLike={() => { }}
                                    onDislike={() => { }}
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
            <div className="bg-card/50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto p-4 pt-0">
                    <ChatInputPill
                        onSubmit={handleSubmit}
                        placeholder="E.g., Update the budget variance section..."
                    />
                </div>
            </div>
        </>
    );

    const handleCloseEditPanel = React.useCallback(() => {
        setPreviewMode('view');
        clearSelection();
    }, [clearSelection]);

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

    const previewContent = (
        <WebPreview style={{ height: '100%' }}>
            {previewData.htmlContent ? (
                <>
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
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-12 text-center">
                    <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 shadow-sm max-w-sm">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <h3 className="text-slate-600 font-bold mb-2">Live Report Preview</h3>
                        <p className="text-xs font-medium leading-relaxed">Generated reports will appear here in real-time. Use the chat panel to start building your synthesis.</p>
                    </div>
                </div>
            )}
        </WebPreview>
    );

    useEffect(() => {
        if (previewData.isVisible && !isClosing && !useResizablePanels) {
            setUseResizablePanels(true);
        } else if ((isClosing || !previewData.isVisible) && useResizablePanels) {
            setUseResizablePanels(false);
        }
    }, [previewData.isVisible, useResizablePanels, isClosing]);

    return (
        <div className="flex h-full overflow-hidden">
            {useResizablePanels && previewData.isVisible && !isClosing ? (
                <PanelGroup direction="horizontal" className="h-full">
                    <Panel defaultSize={30} minSize={25} maxSize={60} className="flex flex-col">
                        {leftPanelContent}
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group">
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                    </PanelResizeHandle>

                    <Panel defaultSize={70} minSize={40} maxSize={75} className="border-l border-border relative">
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
}
