import type { Message } from '../domain/message';
import ReactMarkdown from 'react-markdown';
import '../markdown.css';

type ChatViewProps = {
    messages: Message[];
    selectedMessageId: string | null;
    onSelectMessage: (id: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
    registerElementRef: (id: string) => (el: HTMLElement | null) => void;
};

export function ChatView({
    messages,
    selectedMessageId,
    onSelectMessage,
    containerRef,
    contentRef,
    registerElementRef,
}: ChatViewProps) {
    return (
        <div className="h-full overflow-auto" ref={containerRef}>
            <div className="space-y-4 p-4" ref={contentRef}>
                {messages.map((message) => {
                    const shouldSetSelect = message.type === 'assistant';
                    return (
                        <Message
                            key={message.id}
                            message={message}
                            isSelected={message.id === selectedMessageId}
                            setAsSelected={
                                shouldSetSelect ? () => onSelectMessage(message.id) : () => {}
                            }
                            registerElementRef={registerElementRef(message.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function Message({
    message,
    isSelected,
    setAsSelected,
    registerElementRef,
}: {
    message: Message;
    isSelected: boolean;
    setAsSelected: () => void;
    registerElementRef: (el: HTMLElement | null) => void;
}) {
    return (
        <div className="mx-auto w-full max-w-4xl" ref={registerElementRef}>
            {message.type === 'user' ? (
                <UserMessage message={message} />
            ) : message.type === 'assistant' ? (
                <AssistantMessage
                    message={message}
                    isSelected={isSelected}
                    setAsSelected={setAsSelected}
                />
            ) : null}
        </div>
    );
}

function UserMessage({ message }: { message: Message }) {
    return (
        <div className="flex justify-end">
            <div className="bg-bg-muted px-4 py-2 rounded-[20px] max-w-[70%] whitespace-pre-wrap wrap-break-word">
                {message.content}
            </div>
        </div>
    );
}

function AssistantMessage({
    message,
    isSelected,
    setAsSelected,
}: {
    message: Message;
    isSelected: boolean;
    setAsSelected: () => void;
}) {
    return (
        <div
            className={`p-4 mb-4 rounded-[20px] w-full text-left
            ${isSelected ? 'border-2 border-border-muted' : 'border-2 border-transparent'}`}
            onClick={setAsSelected}
        >
            <div className="prose markdown-content wrap-break-word">
                <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
        </div>
    );
}
