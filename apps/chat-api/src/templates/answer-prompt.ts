import type { Document } from '../domain/document.js';

export function buildAnswerPrompt(query: string, docs: Document[]): string {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
        throw new Error('query must not be empty');
    }

    const context =
        docs.length === 0
            ? '（関連資料は取得できませんでした。）'
            : docs
                  .map((doc, i) => {
                      return `[${i}]${doc.title}\n${doc.content}`;
                  })
                  .join('\n\n');

    return [
        '## 指示',
        '以下の質問に対して、資料に基づいて回答してください。',
        '資料を参考にする場合、出典を明記し、必要に応じて引用してください。',
        '資料に必要な情報が含まれていない場合は、その旨を回答してください。',
        '',
        '## 質問',
        trimmed,
        '',
        '## 資料',
        context,
    ].join('\n');
}
