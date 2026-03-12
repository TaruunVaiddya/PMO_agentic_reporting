
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProviderContext } from '@/contexts/chat-provider';
import { useSession } from '@/contexts/session-context';
import SSEChatHandler from '@/services/chat-service';
import generateUniqueId from '@/lib/get_unique_id';
import { PromptInputMessage } from '@/components/ai-elements/prompt-input';

export const useChatHandler = () => {
    const router = useRouter();
    const chatStore = useContext(ChatProviderContext);
    const { setPendingQuery, setNewSessionId } = useSession();

    const handleStartChat = async (message: PromptInputMessage, customPathBase?: string) => {
        if (!chatStore) {
            console.error('Chat store not available');
            return;
        }

        const text = message.text?.trim() || '';
        if (text === '' && (!message.files || message.files.length === 0)) {
            return;
        }

        try {
            // Generate a unique session ID
            const sessionId = generateUniqueId();

            // Store session details in session storage
            sessionStorage.setItem('session-details-' + sessionId, JSON.stringify({
                selected_mode: message.mode || null,
                collection_id: message.collection_id || null,
                template_id: message.template_id || null,
            }));

            // Create SSE handler with the new config object
            const sseHandler = new SSEChatHandler({
                chatStore,
                input: text,
                sessionId,
                selected_agent: message.mode,
                is_new_chat: true,
                collection_id: message.collection_id,
                template_id: message.template_id,
            });

            // Start the chat
            sseHandler.startChat();

            setNewSessionId(sessionId);
            setPendingQuery(text);

            // Navigate to the chat session page
            const pathBase = customPathBase || '/chat';
            router.push(`${pathBase}/${sessionId}?chat=new`);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        if (!chatStore) {
            console.error('Chat store not available');
            return;
        }

        try {
            // Generate a unique session ID
            const sessionId = generateUniqueId();

            // Get selected agent from session storage (if any)
            const selectedAgent = sessionStorage.getItem('selected-agent') || null;

            // Create SSE handler with the new config object
            const sseHandler = new SSEChatHandler({
                chatStore,
                input: suggestion,
                sessionId,
                selected_agent: selectedAgent,
                is_new_chat: true
            });

            // Start the chat
            sseHandler.startChat();

            // Navigate to the chat session page
            router.push(`/chat/${sessionId}?chat=new`);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    return {
        handleStartChat,
        handleSuggestionClick
    };
};
