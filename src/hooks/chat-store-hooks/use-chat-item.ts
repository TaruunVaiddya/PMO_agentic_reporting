'use client';
import { useContext, useSyncExternalStore } from 'react';
import { ChatProviderContext } from '@/contexts/chat-provider';
import { ChatItemType } from '@/types/chat';


const useChatItem = (chatId: string): ChatItemType | null => {
  const chatItem = useContext(ChatProviderContext);

  const chatItemStore = useSyncExternalStore(
    chatItem?.subscribeToChatList!,
    () => {
        return chatItem?.getChat(chatId)
    },
    () => null 
  );
  return chatItemStore ?? null;
};

export default useChatItem;
