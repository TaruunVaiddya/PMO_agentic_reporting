'use client'
import { createContext } from "react";
import { ChatStoreType } from "@/types/chat";
import useChatStore from "@/store/chat-store";

export const ChatProviderContext = createContext<ChatStoreType | null>(
    null
  );

export const ChatStoreProvider = ({children}:{children:React.ReactNode}) => {
    const chatStore = useChatStore();
    return (
        <ChatProviderContext.Provider value={chatStore}>
            {children}
        </ChatProviderContext.Provider>
    )
}