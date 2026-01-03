import { useMemo, useState } from 'react';
import { ChatView } from './components/ChatView';
import { InputBox } from './components/InputBox';
import { DocsView } from './components/DocsView';
import { answer } from './api/answer.js';
import type { AssistantMessage, Message } from './domain/message.js';
import type { Document } from './domain/document.js';
import { useScrollRegistry } from './hooks/useScrollRegistry';

export default function App() {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessageId, setSelectedMessageId] = useState<string>('');

    const { containerRef, contentRef, registerElementRef, scrollToElement } = useScrollRegistry();

    const canSubmit = !isLoading && inputText.trim().length > 0;

    const selectedAssistantMessage = useMemo<AssistantMessage | undefined>(
        () =>
            messages.find((m) => m.id === selectedMessageId && m.type === 'assistant') as
                | AssistantMessage
                | undefined,
        [messages, selectedMessageId]
    );

    const docs: Document[] = selectedAssistantMessage?.docs ?? [];

    const handleSubmit = async (value: string): Promise<void> => {
        const query = value.trim();
        if (!query || isLoading) {
            return;
        }

        const userMessage: Message = {
            id: crypto.randomUUID(),
            type: 'user',
            content: query,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        scrollToElement(userMessage.id, { behavior: 'smooth', align: true, margin: 16 });
        setInputText('');
        setIsLoading(true);

        try {
            const res = await answer(query);

            const assistantMessage: AssistantMessage = {
                id: crypto.randomUUID(),
                type: 'assistant',
                content: res.answer,
                docs: res.docs,
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setSelectedMessageId(assistantMessage.id);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <header className="px-4 py-2">
                <h1 className="text-lg font-semibold">RAG Chatbot</h1>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-1 flex-col min-h-0">
                    <div className="relative flex-1 overflow-hidden">
                        <ChatView
                            messages={messages}
                            selectedMessageId={selectedMessageId}
                            onSelectMessage={setSelectedMessageId}
                            containerRef={containerRef}
                            contentRef={contentRef}
                            registerElementRef={registerElementRef}
                        />
                        <div className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-8 bg-linear-to-b from-transparent to-bg" />
                    </div>

                    <div className="shrink-0">
                        <InputBox
                            value={inputText}
                            onChange={setInputText}
                            onSubmit={handleSubmit}
                            canSubmit={canSubmit}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                <div className="max-w-96 shrink-0 overflow-hidden">
                    <DocsView docs={docs} />
                </div>
            </div>
        </div>
    );
}
