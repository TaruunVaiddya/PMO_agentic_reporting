'use client'

import { ChatListType, ChatType, ChatItemRole, ChatStatus, ChatStoreType } from "@/types/chat";
import { useCallback, useRef } from "react";


function useChatStore():ChatStoreType {
    const chatList = useRef<ChatListType>({});
    const activePageId = useRef<string>('');
    const chatListeners = useRef(new Set<VoidFunction>());
    const activePageListeners = useRef(new Set<VoidFunction>());

    const addChat = useCallback((chat:ChatType, chatId:string, role:ChatItemRole) => {
        if(role === 'user') {
            chatList.current = {
                    ...chatList.current,
                    [chatId]: {
                        userMessage:chat,
                        status: 'Not_Started',
                    }
                }
        } else if(role === 'assistant') {
            chatList.current[chatId] = {
                ...chatList.current[chatId],
                assistantMessage:chat,
                status: 'In_Progress',
            }
        } 
        notifyChatListListeners();
    },[])

    const setChat = useCallback((chats:ChatListType) => {
        chatList.current = chats;
        notifyChatListListeners();
    },[])

    const updateChatStatus = useCallback((chatId:string, status:ChatStatus) => {
        chatList.current[chatId] = {
            ...chatList.current[chatId],
            status:status,
        }
        notifyChatListListeners();
    },[])


    const getChat = useCallback((chatId:string) => {
        return chatList.current[chatId];
    },[])

    const getChatStatus = useCallback((chatId:string) => {
        return chatList.current[chatId].status;
    },[])

    const getChatList = useCallback(() => {
        return chatList.current;
    },[])

    const deleteChat = useCallback((chatId:string) => {
        delete chatList.current[chatId];
        notifyChatListListeners();
    },[])

    const getActivePageId = useCallback(() => {
        return activePageId.current;
    },[])

    const updateActivePageId = useCallback((pageId:string) => {
        activePageId.current = pageId;
        notifyActivePageIdListeners();
    },[])

    const clearChatList = useCallback(() => {
        chatList.current = {};
        notifyChatListListeners();
    },[])

    const subscribeToChatList = useCallback((listener:VoidFunction) => {
        chatListeners.current.add(listener);
        return () => {
            chatListeners.current.delete(listener);
        }
    },[])

    const subscribeToActivePageId = useCallback((listener:VoidFunction) => {
        activePageListeners.current.add(listener);
        return () => {
            activePageListeners.current.delete(listener);
        }
    },[])
    
    const checkIfOnlyOneChat = useCallback(() => {
        // Check if there is only one chat with assistantmessage is null
        let keys = Object.keys(chatList.current);
        return keys.length === 1 && !chatList.current[keys[0]].assistantMessage;
    },[])

    const notifyChatListListeners = useCallback(() => {
        chatListeners.current.forEach(listener => listener());
    },[])

    const notifyActivePageIdListeners = useCallback(() => {
        activePageListeners.current.forEach(listener => listener());
    },[])

    return {
        addChat,
        setChat,
        updateChatStatus,
        getChat,
        getChatStatus,
        getChatList,
        deleteChat,
        getActivePageId,
        updateActivePageId,
        clearChatList,
        subscribeToChatList,
        subscribeToActivePageId,
        notifyChatListListeners,
        notifyActivePageIdListeners,
        checkIfOnlyOneChat
    }
}

export default useChatStore;