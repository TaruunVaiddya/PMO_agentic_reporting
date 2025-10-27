import generateUniqueId from '@/lib/get_unique_id';

export interface ChatServiceConfig {
  chatStore: any;
  input: string;
  sessionId?: string | null;
  selected_agent?: string | null;
  is_new_chat?: boolean | false;
}

export default class SSEChatHandler {
    private chatId: string | null = null;
    private chunks: string[] = [];
    private reasoningChunks: string[] = [];
    private isReasoningComplete = false;
    private reasoningDuration?: number;
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

    constructor(config: ChatServiceConfig) {
      this.chatStore = config.chatStore;
      this.input = config.input;
      this.sessionId = config.sessionId || null;
      this.selected_agent = config.selected_agent || null;
      this.is_new_chat = config.is_new_chat || false;
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
          method: 'POST',
          credentials: 'include',
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
          }),
          signal: this.abortController.signal
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        this.reader = response.body?.getReader() || null;
        
        // Use requestAnimationFrame for better performance than setInterval
        this.scheduleChunkProcessing();
        
        await this.processStream();
  
      } catch (error) {
        console.error('Chat error:', error);
        this.cleanup();
        throw error;
      }
    }
  
    private scheduleChunkProcessing(): void {
      const processChunks = () => {
        if (this.chatId && (this.chunks.length > 0 || this.reasoningChunks.length > 0)) {
          // Batch process both reasoning and content chunks
          const previousMessage = this.chatStore?.getChat(this.chatId)?.assistantMessage || {};
          
          const newReasoningContent = this.reasoningChunks.join('');
          const previousReasoningContent = previousMessage.reasoning?.content || '';
          
          const newContent = this.chunks.join('');
          const previousContent = previousMessage.content || '';
          
          const updatedMessage: any = {
            id: this.chatId,
            content: previousContent + newContent,
            role: 'assistant',
          };
          
          // Add reasoning if exists
          if (previousReasoningContent || newReasoningContent) {
            updatedMessage.reasoning = {
              content: previousReasoningContent + newReasoningContent,
              complete: this.isReasoningComplete,
              ...(this.reasoningDuration !== undefined && { duration: this.reasoningDuration })
            };
          }
          
          this.chatStore?.addChat(updatedMessage, this.chatId, 'assistant');
          
          this.reasoningChunks.length = 0;
          this.chunks.length = 0; 
        }
  
        // Continue scheduling if chat is active
        if (this.chatId && !this.abortController.signal.aborted) {
          this.updateInterval = setTimeout(processChunks, 200); 
        }
      };
  
      this.updateInterval = setTimeout(processChunks, 200);
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
            if (reasoningData.delta) {
              this.reasoningChunks.push(reasoningData.delta);
            }
            if (reasoningData.complete) {
              this.isReasoningComplete = true;
              if (reasoningData.duration !== undefined) {
                this.reasoningDuration = reasoningData.duration;
              }
            }
          } catch (parseError) {
            console.warn('Invalid reasoning data:', data);
          }
          break;
  
        case 'delta':
          try {
            const deltaData = JSON.parse(data);
            if (deltaData.delta) {
              this.chunks.push(deltaData.delta);
            }
          } catch (parseError) {
            console.warn('Invalid delta data:', data);
          }
          break;
  
        case 'end':
          this.processRemainingChunks();
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
  
    private processRemainingChunks(): void {
      if (this.chatId && (this.chunks.length > 0 || this.reasoningChunks.length > 0)) {
        const previousMessage = this.chatStore?.getChat(this.chatId)?.assistantMessage || {};
        
        const newReasoningContent = this.reasoningChunks.join('');
        const previousReasoningContent = previousMessage.reasoning?.content || '';
        
        const newContent = this.chunks.join('');
        const previousContent = previousMessage.content || '';
        
        const updatedMessage: any = {
          id: this.chatId,
          content: previousContent + newContent,
          role: 'assistant',
        };
        
        // Add reasoning if exists
        if (previousReasoningContent || newReasoningContent) {
          updatedMessage.reasoning = {
            content: previousReasoningContent + newReasoningContent,
            complete: this.isReasoningComplete,
            ...(this.reasoningDuration !== undefined && { duration: this.reasoningDuration })
          };
        }
        
        this.chatStore?.addChat(updatedMessage, this.chatId, 'assistant');
        
        this.reasoningChunks.length = 0;
        this.chunks.length = 0;
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
  
      this.processRemainingChunks();
    }
  
    public abort(): void {
      this.abortController.abort();
      this.cleanup();
    }
  }