import generateUniqueId from '@/lib/get_unique_id';
import type { ContentEvent } from '@/types/chat';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

export interface ChatServiceConfig {
  chatStore: any;
  input: string;
  sessionId?: string | null;
  selected_agent?: string | null;
  is_new_chat?: boolean | false;
  collection_id?:string | null;
}

export default class SSEChatHandler {
    private chatId: string | null = null;
    private events: ContentEvent[] = [];
    private pendingEvents: ContentEvent[] = [];
    private updateInterval: NodeJS.Timeout | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private decoder = new TextDecoder();
    private buffer = '';
    private abortController = new AbortController();
    private streamEnded = false;
    private chatStore: any;
    private input: string;
    private sessionId: string | null;
    private selected_agent: string | null;
    private is_new_chat: boolean | false;
    private collection_id: string | null;

    constructor(config: ChatServiceConfig) {
      this.chatStore = config.chatStore;
      this.input = config.input;
      this.sessionId = config.sessionId || null;
      this.selected_agent = config.selected_agent || null;
      this.is_new_chat = config.is_new_chat || false;
      this.collection_id = config.collection_id || null
    }
   
    private getId(): string {
      return generateUniqueId();
    }
  
    async startChat(): Promise<void> {
      this.chatId = this.getId();
      this.chatStore?.addChat({
        id: this.chatId,
        content: this.input,
        role: 'user',
      }, this.chatId, 'user');

      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            query: this.input,
            chat_id: this.chatId,
            session_id: this.sessionId,
            selected_agent: this.selected_agent,
            is_new_session: this.is_new_chat,
            collection_id:this.collection_id
          }),
          signal: this.abortController.signal
        });

        if (!response.ok) {
          if (this.chatId) {
            this.chatStore?.updateChatStatus(this.chatId, 'Failed');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.reader = response.body?.getReader() || null;

        // Schedule periodic event processing
        this.scheduleEventProcessing();

        await this.processStream();

      } catch (error) {
        console.error('Chat error:', error);
        // Update status to Failed if not already done
        if (this.chatId) {
          this.chatStore?.updateChatStatus(this.chatId, 'Failed');
        }
        this.cleanup();
        // Don't throw error - let the UI handle the failed state
      }
    }
  
    private scheduleEventProcessing(): void {
      const processEvents = () => {
        if (this.chatId && this.pendingEvents.length > 0) {
          // Append pending events to the main events array
          this.events.push(...this.pendingEvents);
          this.pendingEvents = [];
          
          // Update the store with the full events array
          const updatedMessage: any = {
            id: this.chatId,
            content: [...this.events], // Clone the array
            role: 'assistant',
          };
          
          this.chatStore?.addChat(updatedMessage, this.chatId, 'assistant');
        }
  
        // Continue scheduling if chat is active
        if (this.chatId && !this.abortController.signal.aborted) {
          this.updateInterval = setTimeout(processEvents, 200); 
        }
      };
  
      this.updateInterval = setTimeout(processEvents, 200);
    }
  
    private async processStream(): Promise<void> {
      if (!this.reader) throw new Error('No reader available');
  
      let currentEventType = '';
  
      try {
        while (!this.streamEnded && !this.abortController.signal.aborted) {
          const { done, value } = await this.reader.read();
  
          if (done) break;
  
          // Process the chunk
          this.buffer += this.decoder.decode(value, { stream: true });
          
          // Process complete lines
          let newlineIndex;
          while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, newlineIndex).trim();
            this.buffer = this.buffer.slice(newlineIndex + 1);
  
            if (!line) continue;
  
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (await this.handleEvent(currentEventType, data)) {
                this.streamEnded = true;
                return; // Stream ended
              }
            }
          }
        }
      } catch (error:any) {
        if (error.name !== 'AbortError') {
          console.error('Stream processing error:', error);
          if (this.chatId) {
            this.chatStore?.updateChatStatus(this.chatId, 'Failed');
          }
        }
      } finally {
        this.cleanup();
      }
    }
  
    private async handleEvent(eventType: string, data: string): Promise<boolean> {
      switch (eventType) {
        case 'start':
          this.chatId = data.trim();
          if (this.chatId) {
            this.chatStore?.updateChatStatus(this.chatId, 'In_Progress');
          }
          break;
  
        case 'reasoning':
          try {
            const reasoningData = JSON.parse(data);
            // Append reasoning event to pending events
            this.pendingEvents.push({
              event: 'reasoning',
              data: reasoningData
            });
          } catch (parseError) {
            console.warn('Invalid reasoning data:', data);
          }
          break;
  
        case 'delta':
          try {
            const deltaData = JSON.parse(data);
            // Append delta event to pending events
            this.pendingEvents.push({
              event: 'delta',
              data: deltaData
            });
          } catch (parseError) {
            console.warn('Invalid delta data:', data);
          }
          break;

        case 'tool_call':
          try {
            const toolCallData = JSON.parse(data);
            // Append tool_call event to pending events
            this.pendingEvents.push({
              event: 'tool_call',
              data: toolCallData
            });
          } catch (parseError) {
            console.warn('Invalid tool_call data:', data);
          }
          break;

        case 'task':
          try {
            const taskData = JSON.parse(data);
            // Append task event to pending events
            this.pendingEvents.push({
              event: 'task',
              data: taskData
            });
          } catch (parseError) {
            console.warn('Invalid task data:', data);
          }
          break;

        case 'report':
          try {
            const reportData = JSON.parse(data);
            // Append report event to pending events
            this.pendingEvents.push({
              event: 'report',
              data: reportData
            });
          } catch (parseError) {
            console.warn('Invalid report data:', data);
          }
          break;

        case 'metadata':
          try {
            const metadataData = JSON.parse(data);
            // Append metadata event to pending events
            this.pendingEvents.push({
              event: 'metadata',
              data: metadataData
            });
          } catch (parseError) {
            console.warn('Invalid metadata data:', data);
          }
          break;
  
        case 'end':
          this.processRemainingEvents();
          if (this.chatId) {
            this.chatStore?.updateChatStatus(this.chatId, 'Completed');
          }
          return true; // Signal to end stream processing
  
        case 'error':
          console.error('Server error:', data);
          if (this.chatId) {
            this.chatStore?.updateChatStatus(this.chatId, 'Failed');
          }
          return true;
  
        default:
          console.debug(`Unknown event type: ${eventType}`);
      }
  
      return false;
    }
  
    private processRemainingEvents(): void {
      if (this.chatId && this.pendingEvents.length > 0) {
        // Process any remaining pending events
        this.events.push(...this.pendingEvents);
        this.pendingEvents = [];
        
        // Final update to the store
        const updatedMessage: any = {
          id: this.chatId,
          content: [...this.events],
          role: 'assistant',
        };
        
        this.chatStore?.addChat(updatedMessage, this.chatId, 'assistant');
      }
    }
  
    private cleanup(): void {
      if (this.updateInterval) {
        clearTimeout(this.updateInterval);
        this.updateInterval = null;
      }
  
      if (this.reader) {
        this.reader.releaseLock();
        this.reader = null;
      }
  
      this.processRemainingEvents();
    }
  
    public abort(): void {
      this.abortController.abort();
      this.cleanup();
    }
  }