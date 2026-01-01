import OpenAI from 'openai';
import { env } from './env.js';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
    if (client) {
        return client;
    }

    client = new OpenAI({
        apiKey: env.AZURE_OPENAI_API_KEY,
        baseURL: `${env.AZURE_OPENAI_ENDPOINT}/openai/v1`,
    });

    return client;
}

export const modelRegistry = {
    gpt41mini: env.AZURE_OPENAI_CHAT_DEPLOYMENT,
};
