/**
 * SSEBuildReportHandler
 *
 * Streams report generation from the /build-report endpoint using Server-Sent Events.
 * This is a callback-based handler (no chat store) that invokes callbacks as each
 * SSE event arrives.
 */

export interface BuildReportRequest {
    chat_id: string;
    session_id: string;
    report_name: string;
    description: string;
    selected_template_ids: string[];
    portfolio_id?: string | null;
    program_ids?: string[] | null;
    project_ids?: string[] | null;
}

export interface StatusEvent {
    step: string;
    state: 'started' | 'completed' | 'skipped' | 'retrying';
    template_id?: string | null;
    attempt?: number;
}

export interface ReportEvent {
    id: string;
    template_id: string;
    template_name: string | null;
    state: 'output-available';
    output: string; // HTML string
    summary?: string | null;
}

export interface ErrorEvent {
    error: string;
    code: string;
    template_id?: string | null;
    retryable?: boolean;
}

export interface BuildReportHandlerCallbacks {
    onStatus?: (event: StatusEvent) => void;
    onReport?: (event: ReportEvent) => void;
    onError?: (event: ErrorEvent) => void;
    onEnd?: (payload: { chat_id: string; status: string; duration?: number }) => void;
}

export class SSEBuildReportHandler {
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private decoder = new TextDecoder();
    private buffer = '';
    private abortController = new AbortController();
    private streamEnded = false;

    private request: BuildReportRequest;
    private callbacks: BuildReportHandlerCallbacks;

    constructor(request: BuildReportRequest, callbacks: BuildReportHandlerCallbacks) {
        this.request = request;
        this.callbacks = callbacks;
    }

    async start(): Promise<void> {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/build-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(this.request),
                credentials: 'include',
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const text = await response.text();
                this.callbacks.onError?.({
                    error: `HTTP ${response.status}: ${response.statusText}. ${text}`,
                    code: 'HTTP_ERROR',
                });
                return;
            }

            this.reader = response.body?.getReader() || null;
            await this.processStream();
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('[BuildReport] Stream error:', error);
                this.callbacks.onError?.({
                    error: error?.message || 'Network error',
                    code: 'NETWORK_ERROR',
                });
            }
        }
    }

    private async processStream(): Promise<void> {
        if (!this.reader) return;

        let currentEventType = '';

        try {
            while (!this.streamEnded && !this.abortController.signal.aborted) {
                const { done, value } = await this.reader.read();
                if (done) break;

                this.buffer += this.decoder.decode(value, { stream: true });

                let newlineIndex: number;
                while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
                    const line = this.buffer.slice(0, newlineIndex).trim();
                    this.buffer = this.buffer.slice(newlineIndex + 1);

                    if (!line) continue;

                    if (line.startsWith('event: ')) {
                        currentEventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        const raw = line.slice(6);
                        if (this.handleEvent(currentEventType, raw)) {
                            this.streamEnded = true;
                            return;
                        }
                    }
                    // heartbeat lines (starting with ':') are ignored
                }
            }
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('[BuildReport] processStream error:', error);
                this.callbacks.onError?.({ error: error?.message, code: 'STREAM_ERROR' });
            }
        } finally {
            this.reader?.releaseLock();
            this.reader = null;
        }
    }

    private handleEvent(type: string, raw: string): boolean {
        switch (type) {
            case 'start':
                // no-op: session started
                break;

            case 'status': {
                try {
                    const data: StatusEvent = JSON.parse(raw);
                    this.callbacks.onStatus?.(data);
                } catch {
                    console.warn('[BuildReport] Invalid status data:', raw);
                }
                break;
            }

            case 'report': {
                try {
                    const data: ReportEvent = JSON.parse(raw);
                    this.callbacks.onReport?.(data);
                } catch {
                    console.warn('[BuildReport] Invalid report data:', raw);
                }
                break;
            }

            case 'error': {
                try {
                    const data: ErrorEvent = JSON.parse(raw);
                    this.callbacks.onError?.(data);
                } catch {
                    console.warn('[BuildReport] Invalid error data:', raw);
                }
                break;
            }

            case 'end': {
                try {
                    const data = JSON.parse(raw);
                    this.callbacks.onEnd?.(data);
                } catch {
                    this.callbacks.onEnd?.({ chat_id: '', status: 'completed' });
                }
                return true; // signal to stop reading
            }

            default:
                break;
        }

        return false;
    }

    public abort(): void {
        this.abortController.abort();
    }
}
