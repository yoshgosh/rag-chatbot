import { useState } from 'react';
import type { Document } from './domain/document.js';
import { answer as callAnswer } from './api/answer.js';

// テストコメント

type QAItem = {
    id: number;
    query: string;
    answer: string;
    docs: Document[];
    createdAt: string;
};

export default function App() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<QAItem[]>([]);

    const latest = history[0] ?? null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = query.trim();
        if (trimmed.length === 0 || isLoading) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await callAnswer(trimmed);

            const item: QAItem = {
                id: Date.now(),
                query: trimmed,
                answer: res.answer,
                docs: res.docs,
                createdAt: new Date().toISOString(),
            };

            setHistory((prev) => [item, ...prev]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : '予期しないエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-bg text-text">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
                <Header />

                <main className="mt-4 flex flex-1 flex-col gap-4 md:flex-row">
                    <section className="md:w-2/5">
                        <QueryForm
                            query={query}
                            onChange={setQuery}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                        />
                        <StatusMessage error={error} isLoading={isLoading} />
                        <HistoryList history={history} />
                    </section>

                    <section className="mt-4 md:mt-0 md:w-3/5">
                        <AnswerPanel item={latest} />
                    </section>
                </main>
            </div>
        </div>
    );
}

function Header() {
    return (
        <header className="border-b border-border pb-3">
            <h1 className="text-xl font-semibold">RAG Chat</h1>
            <p className="mt-1 text-sm text-text-muted">
                一問一答で Azure OpenAI + Azure AI Search を試すシンプルなビューアです。
            </p>
        </header>
    );
}

type QueryFormProps = {
    query: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
};

function QueryForm({ query, onChange, onSubmit, isLoading }: QueryFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-lg border border-border bg-bg-muted p-4 shadow-sm"
        >
            <label className="block text-sm font-medium text-text" htmlFor="query">
                質問
            </label>
            <textarea
                id="query"
                className="mt-2 block h-32 w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="例：無過失責任とは何ですか？"
                value={query}
                onChange={(e) => onChange(e.target.value)}
            />

            <div className="mt-3 flex justify-end gap-2">
                <button
                    type="submit"
                    disabled={isLoading || query.trim().length === 0}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                    {isLoading ? '送信中…' : '質問する'}
                </button>
            </div>
        </form>
    );
}

type StatusMessageProps = {
    error: string | null;
    isLoading: boolean;
};

function StatusMessage({ error, isLoading }: StatusMessageProps) {
    if (error) {
        return (
            <p className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
            </p>
        );
    }

    if (isLoading) {
        return <p className="mt-2 text-xs text-text-muted">回答を生成しています…</p>;
    }

    return null;
}

type AnswerPanelProps = {
    item: QAItem | null;
};

function AnswerPanel({ item }: AnswerPanelProps) {
    if (!item) {
        return (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-bg-muted px-4 py-8 text-sm text-text-muted">
                左のフォームから質問するとここに回答が表示されます。
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-sm">
            <div>
                <p className="text-xs text-text-muted">
                    最終質問（{new Date(item.createdAt).toLocaleString()}）
                </p>
                <p className="mt-1 text-sm font-medium">{item.query}</p>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md bg-bg-muted px-3 py-2 text-sm leading-relaxed">
                {item.answer.split('\n').map((line, idx) =>
                    line.trim().length === 0 ? (
                        <div key={idx} className="h-3" />
                    ) : (
                        <p key={idx} className="mb-1">
                            {line}
                        </p>
                    )
                )}
            </div>

            <DocumentsList docs={item.docs} />
        </div>
    );
}

type DocumentsListProps = {
    docs: Document[];
};

function DocumentsList({ docs }: DocumentsListProps) {
    if (docs.length === 0) {
        return (
            <div className="rounded-md border border-border-muted bg-bg-muted px-3 py-2 text-xs text-text-muted">
                関連資料は見つかりませんでした。
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xs font-semibold text-text-muted">参照資料</h2>
            <ul className="mt-2 flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                {docs.map((doc, index) => (
                    <li
                        key={doc.id}
                        className="rounded-md border border-border-muted bg-bg-muted px-3 py-2 text-xs"
                    >
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                                資料[{index}]
                            </span>
                            {doc.title && (
                                <span className="truncate text-[11px] font-medium">
                                    {doc.title}
                                </span>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap text-[11px] leading-snug text-text-muted">
                            {doc.content}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

type HistoryListProps = {
    history: QAItem[];
};

function HistoryList({ history }: HistoryListProps) {
    if (history.length === 0) {
        return null;
    }

    return (
        <section className="mt-4">
            <h2 className="text-xs font-semibold text-text-muted">履歴（ブラウザ内のみ）</h2>
            <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto pr-1 text-xs">
                {history.map((item) => (
                    <li
                        key={item.id}
                        className="truncate rounded border border-border-muted bg-white px-2 py-1"
                    >
                        {item.query}
                    </li>
                ))}
            </ul>
        </section>
    );
}
