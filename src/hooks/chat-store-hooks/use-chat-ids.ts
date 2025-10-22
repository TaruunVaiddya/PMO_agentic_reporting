'use client';
import { useContext, useRef, useSyncExternalStore } from 'react';
import { ChatProviderContext } from '@/contexts/chat-provider';


const useChatIds = (): string[] => {
  const chatItem = useContext(ChatProviderContext);
  const emptyChatList = useRef({});

  const chatIds = useSyncExternalStore(
    chatItem?.subscribeToChatList!,
    () => chatItem?.getChatList(),
    () => emptyChatList.current
  );
  return Object.keys(chatIds ?? {});
};

export default useChatIds;