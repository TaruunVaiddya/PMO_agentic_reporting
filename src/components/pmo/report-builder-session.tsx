"use client";

import React, { useState, useEffect, useContext } from 'react';
import { ChatInputPill } from '@/components/chat/chat-input-pill';
import ChatMessageItem from '@/components/chat/chat-message-item';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { ReportGrid } from '@/components/reports/report-grid';
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
import type { ReportCardData } from '@/components/reports/report-card';
import { ChatStoreType } from '@/types/chat';
import { useEditMode } from '@/hooks/use-edit-mode';
import { EditPanel } from '@/components/editor/edit-panel';
import useSWR from 'swr';
import { fetcher } from '@/lib/get-fetcher';
import {
    TemplateResponse,
    mapApiTemplatesToTemplateData,
    mapTemplateDataToReportCardData,
} from '@/lib/report-template-utils';

const ANIMATION_DURATION = 300;

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

// ─── PMO Prompt Suggestions ───────────────────────────────────────────────────

const PMO_SUGGESTIONS = [
    {
        icon: LayoutDashboard,
        label: "Portfolio Status Report",
        prompt: "Build a comprehensive portfolio status report covering all active projects — include RAG status, milestones, risks, and budget variance.",
    },
    {
        icon: AlertTriangle,
        label: "Risk & Issues Summary",
        prompt: "Generate an executive risk and issues summary across all programs, highlighting critical blockers, owners, and mitigation actions.",
    },
    {
        icon: DollarSign,
        label: "Budget Variance Analysis",
        prompt: "Create a budget variance analysis report for all active projects showing planned vs. actuals, forecast-to-complete, and spend trends.",
    },
    {
        icon: CalendarCheck,
        label: "Milestone Tracker",
        prompt: "Build a milestone tracker report for all programs — show upcoming deadlines, completion rates, and overdue deliverables by portfolio.",
    },
    {
        icon: Rocket,
        label: "Program Executive Brief",
        prompt: "Prepare an executive briefing deck for a program steering committee covering strategy alignment, progress, risks, decisions needed, and next steps.",
    },
    {
        icon: CheckSquare,
        label: "Resource Utilization Report",
        prompt: "Generate a resource utilization report showing team capacity, allocation by project, over/under-utilized resources, and recommendations.",
    },
] as const;

// ─── Welcome Empty-State ──────────────────────────────────────────────────────

function ReportBuilderWelcome({ onSuggestionClick }: { onSuggestionClick: (prompt: string) => void }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={cn(
                "flex flex-col h-full overflow-y-auto custom-scrollbar transition-opacity duration-500",
                visible ? "opacity-100" : "opacity-0"
            )}
        >
            {/* Greeting */}
            <div className="px-5 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-9 h-9 shrink-0">
                        <img src="/dotz-icon-bg.svg" alt="Dotz" className="w-full h-full rounded-full" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 leading-tight">AI Report Engine</p>
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">Good day! I&apos;m Dotz.</p>
                    </div>
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">
                    I can help you build{" "}
                    <span className="font-semibold text-slate-800">boardroom-ready PMO reports</span>{" "}
                    in seconds — from portfolio dashboards to executive briefings. Just describe what you need, or choose a starting point below.
                </div>
            </div>

            {/* Divider */}
            <div className="px-5 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Suggestions</p>
            </div>

            {/* Suggestion rows */}
            <div className="px-3 pb-6 flex flex-col">
                {PMO_SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                    <button
                        key={label}
                        onClick={() => onSuggestionClick(prompt)}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-slate-100 active:bg-slate-200"
                    >
                        <Icon size={14} strokeWidth={1.75} className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        <span className="text-[12.5px] text-slate-600 group-hover:text-slate-800 transition-colors flex-1 leading-snug">
                            {label}
                        </span>
                        <ChevronRight size={12} className="shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 mt-auto">
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Powered by your live PMO data
                </p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportBuilderSession({
    session_id,
    chatStore,
}: {
    session_id: string;
    chatStore: ChatStoreType | null;
}) {
    const { collapse } = useSidebar();
    const allChatIds = useChatIds();
    const { data: apiTemplates } = useSWR<TemplateResponse[]>('/report-templates', fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000,
    });

    const chatIds = React.useMemo(() => Array.from(new Set(allChatIds)), [allChatIds]);

    const templateCards = React.useMemo(() => {
        const templates = mapApiTemplatesToTemplateData(apiTemplates);
        return mapTemplateDataToReportCardData(templates);
    }, [apiTemplates]);
    const templatesLoading = apiTemplates === undefined;

    const [previewData, setPreviewData] = useState({
        htmlContent: '',
        title: 'Report Builder Preview',
        isVisible: true,
        reportId: null as string | null,
    });

    const [useResizablePanels, setUseResizablePanels] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const autoOpenedReportsRef = React.useRef<Set<string>>(new Set());
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
    const previewIframeRef = React.useRef<HTMLIFrameElement | null>(null);

    const getPreviewIframe = React.useCallback(() => previewIframeRef.current, []);
    const handlePreviewIframeRef = React.useCallback((iframe: HTMLIFrameElement | null) => {
        previewIframeRef.current = iframe;
    }, []);

    const { enableEditMode, disableEditMode, selectedElement, clearSelection } = useEditMode({
        onElementSelected: () => { },
    });

    const [previewMode, setPreviewMode] = useState<PreviewMode>('view');
    const [pageOrientation, setPageOrientation] = useState<PageOrientation>('original');

    const handleModeChange = React.useCallback(
        (newMode: PreviewMode) => {
            setPreviewMode(newMode);
            if (newMode === 'view') clearSelection();
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

    const handlePropertyUpdate = React.useCallback((property: string, value: string) => {
        if (!iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage({ type: 'APPLY_STYLE', property, value }, '*');
        } catch (error) {
            console.error('Failed to apply style:', error);
        }
    }, []);

    const handleResetElement = React.useCallback(() => {
        if (!iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage({ type: 'RESET_ELEMENT' }, '*');
        } catch { }
    }, []);

    const previewDataRef = React.useRef(previewData);
    React.useEffect(() => {
        previewDataRef.current = previewData;
    }, [previewData]);

    const handleCopy = (content: string) => navigator.clipboard.writeText(content);

    const handlePreviewClick = React.useCallback(
        (toolCallOrReport: ToolCallData | any, isAutoOpen = false) => {
            const reportId = toolCallOrReport.id;
            if (isAutoOpen) {
                if (autoOpenedReportsRef.current.has(reportId)) return;
                autoOpenedReportsRef.current.add(reportId);
            }

            const output = toolCallOrReport.output;
            const extractedHtml = extractHtmlContent(output);
            const isSameReport =
                previewDataRef.current.isVisible && previewDataRef.current.reportId === reportId;

            if (isSameReport) {
                if (extractedHtml) {
                    setPreviewData((prev) => ({
                        ...prev,
                        htmlContent: extractedHtml,
                        title: toolCallOrReport.name || prev.title,
                    }));
                }
                return;
            }

            collapse();
            setPreviewData({
                htmlContent: extractedHtml || '',
                title: toolCallOrReport.name || 'Web Report',
                isVisible: true,
                reportId,
            });
        },
        [collapse]
    );

    const handleReportOutputUpdate = React.useCallback((report: any) => {
        const currentPreviewData = previewDataRef.current;
        if (!currentPreviewData.isVisible || currentPreviewData.reportId !== report.id) return;
        const extractedHtml = extractHtmlContent(report.output);
        if (extractedHtml) {
            setPreviewData((prev) => ({
                ...prev,
                htmlContent: extractedHtml,
                title: report.name || prev.title,
            }));
        }
    }, []);

    const handleClosePreview = () => {
        setIsClosing(true);
        setPreviewData((prev) => ({ ...prev, isVisible: false, reportId: null }));
        setTimeout(() => setIsClosing(false), 300);
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
                endpointPath: '/chat',
            });
            sseHandler.startChat();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleUseStarterTemplate = (template: ReportCardData) => {
        handleSubmit({ text: `Build a ${template.name} report: ${template.description}` });
    };

    /** Auto-submits the prompt when user clicks a suggestion card */
    const handleSuggestionClick = React.useCallback(
        (prompt: string) => handleSubmit({ text: prompt }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [chatStore, session_id]
    );

    // ── Chat panel ────────────────────────────────────────────────────────────
    const chatContent = (
        <>
            <div className="flex-1 overflow-hidden">
                <Conversation className="w-full h-full overflow-y-auto custom-scrollbar">
                    <ConversationContent className="max-w-4xl mx-auto">
                        {chatIds.length === 0 ? (
                            <ReportBuilderWelcome onSuggestionClick={handleSuggestionClick} />
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
            <div className="backdrop-blur-sm">
                <div className="max-w-3xl mx-auto p-4 pt-0">
                    <ChatInputPill
                        onSubmit={handleSubmit}
                        placeholder="E.g., Build a portfolio status report for Q1..."
                    />
                </div>
            </div>
        </>
    );

    const handleCloseEditPanel = React.useCallback(() => {
        setPreviewMode('view');
        clearSelection();
    }, [clearSelection]);

    const leftPanelContent =
        previewMode === 'edit' ? (
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

    const previewContent = previewData.htmlContent ? (
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
    ) : (
        <div className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-6xl mx-auto p-6 lg:p-8">
                <div className="mb-4 px-1">
                    <p className="text-sm font-semibold text-slate-800">Select a template to start your report.</p>
                </div>

                {templatesLoading ? (
                    <div className="grid place-items-center min-h-[320px] rounded-2xl border border-dashed border-slate-200 bg-white text-slate-500">
                        <div className="text-center">
                            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">Loading templates...</p>
                        </div>
                    </div>
                ) : templateCards.length > 0 ? (
                    <div className="scale-[0.92] origin-top">
                        <ReportGrid
                            reports={templateCards}
                            columns={3}
                            onUseTemplate={handleUseStarterTemplate}
                        />
                    </div>
                ) : (
                    <div className="grid place-items-center min-h-[320px] rounded-2xl border border-dashed border-slate-200 bg-white text-slate-500">
                        <div className="text-center max-w-sm px-6">
                            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium text-slate-700">No templates found yet.</p>
                            <p className="mt-2 text-xs leading-relaxed">
                                Add templates in the Report Templates page, then come back here to start from one of
                                them.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center text-xs text-slate-500">
                    Tip: you can always refine the draft from the left chat panel after selecting a template.
                </div>
            </div>
        </div>
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
                    <div
                        className={cn(
                            'flex flex-col transition-all duration-300 ease-in-out',
                            shouldShowPreview ? 'w-[30%]' : 'w-full'
                        )}
                    >
                        {leftPanelContent}
                    </div>

                    {shouldShowPreview && (
                        <div
                            className={cn(
                                'w-[70%] border-l border-border relative transition-all duration-300 ease-in-out',
                                isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                            )}
                        >
                            {previewContent}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
