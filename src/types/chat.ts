// SSE Event Types based on BACKEND_SSE_REQUIREMENTS.md

export type ReasoningEvent = {
    event: 'reasoning';
    data: {
        delta?: string;
        complete: boolean;
        duration?: number;
    };
}

export type TaskEvent = {
    event: 'task';
    data: {
        action: 'create' | 'update' | 'complete';
        task: {
            id: string;
            title: string;
            status: 'pending' | 'running' | 'completed' | 'error';
            description?: string;
            files?: string[];
        };
    };
}

export type ToolCallEvent = {
    event: 'tool_call';
    data: {
        id: string;
        name?: string;
        state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
        input?: any;
        output?: {
            html?: string;
            css?: string;
            js?: string;
            title?: string;
            [key: string]: any;
        };
        errorText?: string;
    };
}

export type DeltaEvent = {
    event: 'delta';
    data: {
        delta: string;
        type?: 'text' | 'code';
        language?: string;
    };
}

export type MetadataEvent = {
    event: 'metadata';
    data: {
        model?: string;
        tokens?: number;
        cost?: number;
        sources?: string[];
        [key: string]: any;
    };
}

// Report output can be either:
// 1. Direct HTML string (when streaming)
// 2. Object with report_id (when loading from history)
export type ReportOutput = string | { report_id: string };

export type ReportEvent = {
    event: 'report';
    data: {
        id: string;
        name?: string;
        state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
        input?: any;
        output?: ReportOutput;
        errorText?: string;
    };
}

// Union type for all possible events
export type ContentEvent = ReasoningEvent | TaskEvent | ToolCallEvent | DeltaEvent | MetadataEvent | ReportEvent;

// Chat message type
export type ChatType = {
    id: string;
    role: string;
    content: string | ContentEvent[];

}

export type ChatItemRole = 'user' | 'assistant' | 'system'

export type ChatItemType = {
    userMessage?: ChatType;
    assistantMessage?: ChatType;
    status: ChatStatus;
    created_at?: Date;
}

export type ChatStatus = 'Not_Started' | 'In_Progress' | 'Completed' | 'Failed'

export type ChatListType = {[key:string]: ChatItemType}

export type ChatStoreType = {
    addChat: (chat: ChatType, chatId: string, role: ChatItemRole) => void;
    setChat: (chats: ChatListType) => void;
    updateChatStatus: (chatId: string, status: ChatStatus) => void;
    getChat: (chatId: string) => ChatItemType;
    getChatStatus: (chatId: string) => ChatStatus;
    getChatList: () => ChatListType;
    deleteChat: (chatId: string) => void;
    getActivePageId: () => string;
    updateActivePageId: (pageId: string) => void;
    clearChatList: () => void;
    subscribeToChatList: (listener: VoidFunction) => () => void;
    subscribeToActivePageId: (listener: VoidFunction) => () => void;
    notifyChatListListeners: () => void;
    notifyActivePageIdListeners: () => void;
    checkIfOnlyOneChat: () => boolean;
}

export interface LLMModel {
    id: string;
    name: string;
}
