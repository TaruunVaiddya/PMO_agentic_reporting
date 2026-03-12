"use client";

import { ChatStoreProvider } from '@/contexts/chat-provider';
import React from 'react'

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <>

            <div className='flex-1 flex flex-col pr-3 pb-3 pl-1'>
                <div className='w-full h-full rounded-lg overflow-hidden relative'>
                    <ChatStoreProvider>
                        {children}
                    </ChatStoreProvider>
                </div>
            </div>
        </>
    );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <ChatLayoutContent>{children}</ChatLayoutContent>
    )
}

