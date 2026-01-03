import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

type InputBoxProps = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => Promise<void>;
    canSubmit: boolean;
    isLoading: boolean;
    placeholder?: string;
};

export function InputBox({
    value,
    onChange,
    onSubmit,
    canSubmit,
    isLoading,
    placeholder = 'Ask a question...',
}: InputBoxProps) {
    const [isComposing, setIsComposing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleSend = () => {
        const trimmed = value.trim();
        if (!trimmed || !canSubmit || isLoading) {
            return;
        }
        onSubmit(trimmed);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    const resizeTextarea = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    useEffect(() => {
        resizeTextarea();
    }, [value]);

    return (
        <div className="mx-auto w-full max-w-4xl px-4 pb-4">
            <div className="gap-1 rounded-[20px] border border-border-muted bg-bg-muted">
                <textarea
                    ref={textareaRef}
                    className="w-full resize-none overflow-hidden bg-transparent px-4 pt-3 text-sm outline-none"
                    rows={1}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder={placeholder}
                />
                <div className="flex items-center justify-end gap-2 px-2 pb-2">
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!canSubmit || isLoading}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-button text-bg disabled:opacity-50"
                    ></button>
                </div>
            </div>
        </div>
    );
}
