import process from 'node:process';
import { z } from 'zod';

function normalizeEndpoint(value: string): string {
    return value.replace(/\/+$/, '');
}

const EnvSchema = z.object({
    // Azure AI Search
    AZURE_SEARCH_SERVICE_ENDPOINT: z.url().transform(normalizeEndpoint),
    AZURE_SEARCH_ADMIN_KEY: z.string().min(1),

    // Azure OpenAI
    AZURE_OPENAI_ENDPOINT: z.url().transform(normalizeEndpoint),
    AZURE_OPENAI_API_KEY: z.string().min(1),
    AZURE_OPENAI_CHAT_DEPLOYMENT: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
    AZURE_SEARCH_SERVICE_ENDPOINT: process.env.AZURE_SEARCH_SERVICE_ENDPOINT,
    AZURE_SEARCH_ADMIN_KEY: process.env.AZURE_SEARCH_ADMIN_KEY,

    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_CHAT_DEPLOYMENT: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
});
