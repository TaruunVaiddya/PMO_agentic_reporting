"use client";

import React, { useEffect, useRef, useState, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import {
    WebPreview,
    WebPreviewBody,
    WebPreviewControls,
    PreviewMode,
    PageOrientation,
} from "@/components/report-viewer";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
    SSEBuildReportHandler,
    StatusEvent,
    ReportEvent,
    ErrorEvent,
    BuildReportRequest,
} from "@/services/build-report-service";
import SSEChatHandler from "@/services/chat-service";
import { ChatProviderContext } from "@/contexts/chat-provider";
import { ChatStoreProvider } from "@/contexts/chat-provider";
import { useSidebar } from "@/contexts/sidebar-context";
import { useEditMode } from "@/hooks/use-edit-mode";
import { ChatInputPill } from "@/components/chat/chat-input-pill";
import { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import ChatMessageItem from "@/components/chat/chat-message-item";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import useChatIds from "@/hooks/chat-store-hooks/use-chat-ids";
import type { ToolCallData } from "@/components/chat/chat-message";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    MessageSquare,
    X,
} from "lucide-react";
import { EditPanel } from "@/components/editor/edit-panel";
import { fetcher } from "@/lib/get-fetcher";

// ─── Storage Key ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "buildReportRequest";

// ─── Types ──────────────────────────────────────────────────────────────────
interface StatusItem {
    step: string;
    state: StatusEvent["state"];
    template_id?: string | null;
}

interface BuiltReport extends ReportEvent {
    htmlContent: string;
}

// ─── Utility ────────────────────────────────────────────────────────────────
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

// ─── Streaming status (typewriter) ─────────────────────────────────────────
function useStreamingStatusText(statuses: StatusItem[]) {
    const [queue, setQueue] = useState<string[]>([]);
    const [displayText, setDisplayText] = useState("");
    const isTypingRef = useRef(false);
    const lastQueuedRef = useRef<string | null>(null);

    useEffect(() => {
        if (statuses.length === 0) return;
        const latest = statuses[statuses.length - 1];
        const message =
            latest.step + (latest.state === "retrying" ? " (retrying...)" : "");
        if (lastQueuedRef.current === message) return;
        lastQueuedRef.current = message;
        setQueue((prev) => [...prev, message]);
    }, [statuses]);

    useEffect(() => {
        if (isTypingRef.current || queue.length === 0) return;
        const message = queue[0];
        let index = 0;
        let cancelled = false;
        isTypingRef.current = true;

        const tick = () => {
            if (cancelled) return;
            index += 1;
            setDisplayText(message.slice(0, index));
            if (index < message.length) {
                window.setTimeout(tick, 18);
            } else {
                isTypingRef.current = false;
                setQueue((prev) => prev.slice(1));
            }
        };

        const timer = window.setTimeout(tick, 18);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [queue]);

    return displayText || "Formatting report...";
}

// ─── Loading Screen ──────────────────────────────────────────────────────────
function BuildLoadingScreen({
    statuses,
    errors,
    templates,
}: {
    statuses: StatusItem[];
    errors: ErrorEvent[];
    templates: string[];
}) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-white">
            <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
                {/* spinner */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-[#4c35c9]/20 border-t-[#4c35c9] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-[#4c35c9]/70"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-base font-semibold text-slate-800">
                        Building Your Report
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {templates.length > 1
                            ? `Processing ${templates.length} templates…`
                            : "This will only take a moment…"}
                    </p>
                </div>

                {/* status steps */}
                {statuses.length > 0 && (
                    <div className="w-full flex flex-col gap-2 bg-slate-50 rounded-lg border border-slate-200 p-4 max-h-64 overflow-y-auto">
                        {statuses.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                {s.state === "completed" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                ) : s.state === "started" || s.state === "retrying" ? (
                                    <Loader2 className="w-3.5 h-3.5 text-[#4c35c9] mt-0.5 animate-spin shrink-0" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 mt-0.5 shrink-0" />
                                )}
                                <span className="text-[11px] text-slate-600 leading-tight">
                                    {s.step}
                                    {s.state === "retrying" && " (retrying…)"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* errors */}
                {errors.length > 0 && (
                    <div className="w-full flex flex-col gap-2">
                        {errors.map((e, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                                <span className="text-[11px] text-red-700">{e.error}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Report Tab Bar ──────────────────────────────────────────────────────────
function ReportTabBar({
    reports,
    activeIndex,
    onSelect,
}: {
    reports: BuiltReport[];
    activeIndex: number;
    onSelect: (i: number) => void;
}) {
    if (reports.length <= 1) return null;
    return (
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {reports.map((r, i) => (
                <button
                    key={r.id}
                    onClick={() => onSelect(i)}
                    className={cn(
                        "px-3 py-1.5 rounded text-[11px] font-medium whitespace-nowrap transition-all",
                        activeIndex === i
                            ? "bg-[#4c35c9] text-white"
                            : "text-slate-600 hover:bg-slate-200"
                    )}
                >
                    {r.template_name || r.template_id || `Report ${i + 1}`}
                </button>
            ))}
        </div>
    );
}

// ─── Inner page (needs chat store in context) ─────────────────────────────────
const ANIMATION_DURATION = 300;

function BuildReportInner({ sessionId }: { sessionId: string }) {
    const router = useRouter();
    const chatStore = useContext(ChatProviderContext);
    const { collapse } = useSidebar();

    // SSE state
    const [phase, setPhase] = useState<"loading" | "done" | "failed">("loading");
    const [statuses, setStatuses] = useState<StatusItem[]>([]);
    const [errors, setErrors] = useState<ErrorEvent[]>([]);
    const [reports, setReports] = useState<BuiltReport[]>([]);
    const [activeReportIndex, setActiveReportIndex] = useState(0);
    const [templateNames, setTemplateNames] = useState<string[]>([]);
    const [isStreamClosed, setIsStreamClosed] = useState(false);
    const streamingStatusText = useStreamingStatusText(statuses);

    // Preview state
    const [previewMode, setPreviewMode] = useState<PreviewMode>("view");
    const [pageOrientation, setPageOrientation] =
        useState<PageOrientation>("landscape");
    const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // Chat panel state
    const [chatOpen, setChatOpen] = useState(false);
    const [useResizablePanels, setUseResizablePanels] = useState(false);
    const [isClosingChat, setIsClosingChat] = useState(false);
    const allChatIds = useChatIds();
    const chatIds = React.useMemo(
        () => Array.from(new Set(allChatIds)),
        [allChatIds]
    );

    // Edit mode
    const { enableEditMode, disableEditMode, selectedElement, clearSelection } =
        useEditMode({
            onElementSelected: () => { },
        });

    const handleModeChange = useCallback(
        (newMode: PreviewMode) => {
            setPreviewMode(newMode);
            if (newMode === "view") clearSelection();
        },
        [clearSelection]
    );

    const handleEditModeReady = useCallback(
        async (iframe: HTMLIFrameElement) => {
            iframeRef.current = iframe;
            if (previewMode === "edit") {
                await enableEditMode(iframe);
            } else {
                disableEditMode(iframe);
            }
        },
        [previewMode, enableEditMode, disableEditMode]
    );

    React.useEffect(() => {
        if (!iframeRef.current) return;
        if (previewMode === "edit") {
            enableEditMode(iframeRef.current);
        } else {
            disableEditMode(iframeRef.current);
            clearSelection();
        }
    }, [previewMode, enableEditMode, disableEditMode, clearSelection]);

    const handlePropertyUpdate = useCallback(
        (property: string, value: string) => {
            if (!iframeRef.current?.contentWindow) return;
            iframeRef.current.contentWindow.postMessage(
                { type: "APPLY_STYLE", property, value },
                "*"
            );
        },
        []
    );

    const handleResetElement = useCallback(() => {
        if (!iframeRef.current?.contentWindow) return;
        iframeRef.current.contentWindow.postMessage({ type: "RESET_ELEMENT" }, "*");
    }, []);

    const handleCloseEditPanel = useCallback(() => {
        setPreviewMode("view");
        clearSelection();
    }, [clearSelection]);

    const getPreviewIframe = useCallback(
        () => previewIframeRef.current,
        []
    );

    const handlePreviewIframeRef = useCallback(
        (iframe: HTMLIFrameElement | null) => {
            previewIframeRef.current = iframe;
        },
        []
    );

    // ── Chat panel animation ────────────────────────────────────────────────
    useEffect(() => {
        if (chatOpen && !isClosingChat && !useResizablePanels) {
            const t = setTimeout(
                () => setUseResizablePanels(true),
                ANIMATION_DURATION
            );
            return () => clearTimeout(t);
        } else if ((isClosingChat || !chatOpen) && useResizablePanels) {
            setUseResizablePanels(false);
        }
    }, [chatOpen, useResizablePanels, isClosingChat]);

    // ── SSE: start on mount ──────────────────────────────────────────────────
    const sseRef = useRef<SSEBuildReportHandler | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
            router.replace("/chat");
            return;
        }

        let req: BuildReportRequest & { mode?: 'view', report_name?: string };
        try {
            req = JSON.parse(raw);
        } catch {
            router.replace("/chat");
            return;
        }

        if (req.mode === 'view') {
            setTemplateNames([req.report_name || "Existing Report"]);
            setStatuses([{ step: "Loading existing report...", state: "started" }]);
            setIsStreamClosed(true);

            fetcher(`/report/${req.session_id}`)
                .then(res => {
                    const htmlContent = extractHtmlContent(res);
                    setReports([{
                        id: req.session_id,
                        template_id: 'existing',
                        template_name: req.report_name || "Existing Report",
                        state: "output-available",
                        output: htmlContent,
                        htmlContent
                    }]);
                    setStatuses([{ step: "Report loaded successfully", state: "completed" }]);
                    setPhase("done");
                    collapse();
                })
                .catch(err => {
                    console.error("Failed to fetch report:", err);
                    setErrors([{ error: "Failed to load report from server.", code: "FETCH_ERROR" }]);
                    setPhase("failed");
                });
            return;
        }

        setTemplateNames(req.selected_template_ids);
        setIsStreamClosed(false);

        const handler = new SSEBuildReportHandler(req as BuildReportRequest, {
            onStatus: (ev) => {
                setStatuses((prev) => {
                    // Update existing entry for same step+template or append
                    const idx = prev.findIndex(
                        (s) => s.step === ev.step && s.template_id === ev.template_id
                    );
                    if (idx !== -1) {
                        const next = [...prev];
                        next[idx] = ev;
                        return next;
                    }
                    return [...prev, ev];
                });
            },
            onReport: (ev) => {
                const newHtmlContent = extractHtmlContent(ev.output);
                setReports((prev) => {
                    const idx = prev.findIndex((r) => r.id === ev.id);
                    if (idx !== -1) {
                        const next = [...prev];
                        const existingHtml = next[idx].htmlContent || "";
                        // Append with a page break so paginated views create a fresh A4 page
                        const combinedHtml = existingHtml
                            ? existingHtml + '\n<div class="page-break"></div>\n' + newHtmlContent
                            : newHtmlContent;

                        next[idx] = { ...ev, htmlContent: combinedHtml };
                        return next;
                    }
                    return [...prev, { ...ev, htmlContent: newHtmlContent }];
                });
                setPhase("done");
                collapse();
            },
            onError: (ev) => {
                setErrors((prev) => [...prev, ev]);
            },
            onEnd: (payload) => {
                setIsStreamClosed(true);
                if (payload.status === "failed") {
                    setPhase((prev) => (prev === "done" ? "done" : "failed"));
                }
            },
        });

        sseRef.current = handler;
        handler.start();

        return () => {
            sseRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Chat submit ──────────────────────────────────────────────────────────
    const handleChatSubmit = useCallback(
        async (message: PromptInputMessage) => {
            if (!chatStore) return;
            const sseChat = new SSEChatHandler({
                chatStore,
                input: message.text || "",
                sessionId,
                selected_agent: message.mode,
                template_id: message.template_id,
            });
            sseChat.startChat();
        },
        [chatStore, sessionId]
    );

    const handleOpenChat = () => {
        setChatOpen(true);
    };

    const handleCloseChat = () => {
        setIsClosingChat(true);
        setChatOpen(false);
        setTimeout(() => setIsClosingChat(false), ANIMATION_DURATION + 50);
    };

    // ── Current report HTML ──────────────────────────────────────────────────
    const activeReport = reports[activeReportIndex];
    const activeHtml = activeReport?.htmlContent || "";
    const activeTitle =
        activeReport?.template_name || activeReport?.template_id || "Report";

    // ── Report preview panel ────────────────────────────────────────────────
    const reportPanel = (
        <div className="flex flex-col h-full">
            <ReportTabBar
                reports={reports}
                activeIndex={activeReportIndex}
                onSelect={setActiveReportIndex}
            />
            <WebPreview style={{ flex: 1, minHeight: 0 }}>
                <WebPreviewControls
                    title={activeTitle}
                    htmlContent={activeHtml}
                    mode={previewMode}
                    onModeChange={handleModeChange}
                    orientation={pageOrientation}
                    onOrientationChange={setPageOrientation}
                    getPreviewIframe={getPreviewIframe}
                />
                <div className="relative flex-1 min-h-0">
                    <WebPreviewBody
                        htmlContent={activeHtml}
                        editMode={previewMode === "edit"}
                        orientation={pageOrientation}
                        onEditModeReady={handleEditModeReady}
                        onIframeRef={handlePreviewIframeRef}
                        streamingStatusText={streamingStatusText}
                        className="h-full"
                    />
                    {!isStreamClosed && reports.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-xs text-slate-600 bg-white/90 border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                            <span className="w-3 h-3 rounded-full border-2 border-[#4c35c9]/30 border-t-[#4c35c9] animate-spin" />
                            <span>Generating more pages...</span>
                        </div>
                    )}
                </div>
            </WebPreview>
        </div>
    );

    // ── Chat panel content ──────────────────────────────────────────────────
    const chatPanelContent = (
        <div className="flex flex-col h-full border-l border-border bg-background">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-slate-700">
                    Chat Assistant
                </span>
                <button
                    onClick={handleCloseChat}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500"
                >
                    <X size={13} />
                </button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-hidden">
                <Conversation className="w-full h-full overflow-y-auto custom-scrollbar">
                    <ConversationContent className="max-w-2xl mx-auto">
                        {chatIds.length === 0 ? (
                            <div className="flex items-center justify-center h-full pt-10">
                                <p className="text-xs text-slate-400">
                                    Ask questions about this report
                                </p>
                            </div>
                        ) : (
                            chatIds.map((chatId) => (
                                <ChatMessageItem
                                    key={chatId}
                                    chatId={chatId}
                                    onCopy={(c) => navigator.clipboard.writeText(c)}
                                    onRetry={() => { }}
                                    onLike={() => { }}
                                    onDislike={() => { }}
                                    onPreviewClick={() => { }}
                                    onReportOutputUpdate={() => { }}
                                    activeReportId={null}
                                />
                            ))
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>
            </div>

            {/* input */}
            <div className="shrink-0 p-3 pt-0">
                <ChatInputPill onSubmit={handleChatSubmit} placeholder="Ask anything…" />
            </div>
        </div>
    );

    // ── Right panel: EditPanel in edit mode, Chat panel otherwise ────────────
    const rightPanelContent = previewMode === "edit" ? (
        <EditPanel
            selectedElement={selectedElement}
            onUpdate={handlePropertyUpdate}
            onReset={handleResetElement}
            onClose={handleCloseEditPanel}
        />
    ) : chatPanelContent;

    // Right panel is visible when: edit mode is active OR chat is open/closing
    const chatVisible = chatOpen || isClosingChat;
    const rightPanelVisible = previewMode === "edit" || chatVisible;

    // ── Render ───────────────────────────────────────────────────────────────
    if (phase === "failed" && reports.length === 0) {
        return (
            <div className="w-full h-full bg-white">
                <BuildLoadingScreen
                    statuses={statuses}
                    errors={errors}
                    templates={templateNames}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden relative">

            {/* ── [Report left] | [EditPanel or Chat right] ───────────────────── */}
            {useResizablePanels && rightPanelVisible ? (
                // Resizable panels once animation settles
                <PanelGroup direction="horizontal" className="h-full w-full">
                    <Panel defaultSize={70} minSize={40} maxSize={85} className="flex flex-col">
                        {reportPanel}
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
                    <Panel defaultSize={30} minSize={20} maxSize={50} className="flex flex-col">
                        {rightPanelContent}
                    </Panel>
                </PanelGroup>
            ) : (
                // CSS transition layout (initial open/close animation)
                <>
                    <div
                        className={cn(
                            "flex flex-col transition-all duration-300 ease-in-out",
                            rightPanelVisible ? "w-[70%]" : "w-full"
                        )}
                    >
                        {reportPanel}
                    </div>
                    {rightPanelVisible && (
                        <div
                            className={cn(
                                "w-[30%] transition-all duration-300 ease-in-out",
                                // Slide-out animation only when chat is closing (not edit mode toggle)
                                isClosingChat && previewMode !== "edit"
                                    ? "translate-x-full opacity-0"
                                    : "translate-x-0 opacity-100"
                            )}
                        >
                            {rightPanelContent}
                        </div>
                    )}
                </>
            )}

            {/* ── Floating chat button (only in view mode, chat closed) ────────── */}
            {!chatOpen && previewMode === "view" && phase === "done" && (
                <button
                    onClick={handleOpenChat}
                    title="Open Chat Assistant"
                    className="absolute bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-[#4c35c9] hover:bg-[#3d28b0] text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                    <MessageSquare size={18} />
                </button>
            )}
        </div>
    );
}

// ─── Page (provides ChatStore) ────────────────────────────────────────────────
export default function BuildReportPage() {
    const [sessionId] = useState(() => {
        // Try to get session_id from the stored request
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const req = JSON.parse(raw);
                return req.session_id || uuidv4();
            }
        } catch { }
        return uuidv4();
    });

    return (
        <ChatStoreProvider>
            <BuildReportInner sessionId={sessionId} />
        </ChatStoreProvider>
    );
}
