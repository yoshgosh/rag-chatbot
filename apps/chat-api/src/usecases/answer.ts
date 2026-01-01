import type { Document } from '../domain/document.js';
import { search, type SearchOptions } from '../repositories/search.js';
import { answer as generateAnswer, type AnswerOptions } from '../repositories/answer.js';
import { buildAnswerPrompt } from '../templates/answer-prompt.js';

export type AnswerUsecaseInput = {
    query: string;
    searchOptions?: SearchOptions;
    answerOptions?: AnswerOptions;
};

export type AnswerUsecaseOutput = {
    answer: string;
    docs: Document[];
};

export async function answerUsecase(input: AnswerUsecaseInput): Promise<AnswerUsecaseOutput> {
    const { query, searchOptions, answerOptions } = input;

    const trimmed = query.trim();
    if (trimmed.length === 0) {
        throw new Error('query must not be empty');
    }

    const docs = await search(trimmed, searchOptions);
    const prompt = buildAnswerPrompt(trimmed, docs);
    const answer = await generateAnswer(prompt, answerOptions);

    return { answer, docs };
}
