export type ChatType = {
    id:string,
    role:string,
    content:string,
}

export type ChatItemRole = 'user' | 'assistant' | 'system'


export type ChatItemType = {
    userMessage?:ChatType,
    assistantMessage?:ChatType,
    status:ChatStatus,
}


export type ChatStatus = 'Not_Started' | 'In_Progress' | 'Completed' | 'Failed'


export type ChatListType = {[key:string]:ChatItemType}


export type ChatStoreType = {
    addChat: (chat:ChatType, chatId:string, role:ChatItemRole) => void;
    setChat: (chats:ChatListType) => void;
    updateChatStatus: (chatId:string, status:ChatStatus) => void;
    getChat: (chatId:string) => ChatItemType;
    getChatStatus: (chatId:string) => ChatStatus;
    getChatList: () => ChatListType;
    deleteChat: (chatId:string) => void;
    getActivePageId: () => string;
    updateActivePageId: (pageId:string) => void;
    clearChatList: () => void;
    subscribeToChatList: (listener:VoidFunction) => () => void;
    subscribeToActivePageId: (listener:VoidFunction) => () => void;
    notifyChatListListeners: () => void;
    notifyActivePageIdListeners: () => void;
    checkIfOnlyOneChat: () => boolean;
}

export interface LLMModel {
    id: string;
    name: string;
}
 