"use client";

import React, { useContext, useEffect } from 'react';
import { ReportBuilderSession } from '@/components/pmo/report-builder-session';
import { ChatProviderContext } from '@/contexts/chat-provider';
import { fetcher } from '@/lib/get-fetcher';
import { ChatListType } from '@/types/chat';

interface ReportBuilderPageProps {
    params: Promise<{
        session_id: string;
    }>;
}

const extractHtmlContent = (output: any): string => {
    let htmlContent = '';
    if (output && typeof output === 'object' && output.result) {
        htmlContent = output.result;
    } else if (typeof output === 'string') {
        htmlContent = output;
    } else {
        return '';
    }
    const codeBlockRegex = /^```(?:html)?\n?([\s\S]*?)\n?```$/;
    const match = htmlContent.trim().match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return htmlContent.trim();
};

export default function ReportBuilderPage({ params }: ReportBuilderPageProps) {
    const resolvedParams = React.use(params);
    const chatStore = useContext(ChatProviderContext);

    useEffect(() => {
        if (resolvedParams.session_id) {
            (async () => {
                try {
                    const response = await fetcher(`/conversations/${resolvedParams.session_id}`);
                    let chatList: ChatListType = {}
                    response?.forEach((chat: any) => {
                        let assistantContent: any = chat.response;
                        if (typeof chat.response === 'string') {
                            try {
                                const parsed = JSON.parse(chat.response);
                                if (Array.isArray(parsed)) {
                                    assistantContent = parsed;
                                }
                            } catch {
                                const htmlContent = extractHtmlContent(chat.response);
                                if (htmlContent && htmlContent.includes('<!DOCTYPE html>')) {
                                    assistantContent = [{
                                        event: 'report',
                                        data: {
                                            id: `report-${chat.id}`,
                                            name: 'Report',
                                            state: 'output-available',
                                            output: chat.response,
                                        }
                                    }];
                                }
                            }
                        }

                        chatList[chat.id] = {
                            userMessage: {
                                id: chat.id,
                                content: chat.query,
                                role: "user",
                            },
                            assistantMessage: {
                                id: chat.id,
                                content: assistantContent,
                                role: "assistant",
                            },
                            status: "Completed",
                            created_at: new Date(chat.created_at),
                        };
                    });
                    if (chatStore?.checkIfOnlyOneChat()) {
                        chatStore?.setChat({ ...chatStore?.getChatList(), ...chatList });
                    } else {
                        chatStore?.setChat(chatList);
                    }
                } catch (error) {
                    console.error('Failed to fetch session:', error);
                }
            })();
        }
    }, [resolvedParams.session_id, chatStore]);

    return (
        <ReportBuilderSession
            session_id={resolvedParams.session_id}
            chatStore={chatStore}
        />
    );
}
