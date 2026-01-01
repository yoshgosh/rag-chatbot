import { getOpenAIClient, modelRegistry } from '../infrastructure/azure-openai.js';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

export type AnswerOptions = {
    temperature?: number;
    maxOutputTokens?: number;
};

export async function answer(query: string, options: AnswerOptions = {}): Promise<string> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
        throw new Error('query must not be empty');
    }

    const client = getOpenAIClient();

    const response = await client.responses.create({
        model: modelRegistry.gpt41mini,
        input: trimmed,
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        max_output_tokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    });

    return response.output_text ?? '';
}
