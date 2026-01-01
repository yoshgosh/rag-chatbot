import { AzureKeyCredential, SearchClient } from '@azure/search-documents';
import { env } from './env.js';

export const INDEX_NAME = 'rag-index';

export type Index = {
    id: string;
    content: string;
    title: string;
    parentId: string;

    contentVector?: number[];
};

export const INDEX_VECTOR_FIELD: keyof Index = 'contentVector';
export const INDEX_SELECT_FIELDS: (keyof Index)[] = ['id', 'content', 'title', 'parentId'];

let searchClient: SearchClient<Index> | null = null;

export function getSearchClient(): SearchClient<Index> {
    if (searchClient) {
        return searchClient;
    }

    searchClient = new SearchClient<Index>(
        env.AZURE_SEARCH_SERVICE_ENDPOINT,
        INDEX_NAME,
        new AzureKeyCredential(env.AZURE_SEARCH_ADMIN_KEY)
    );

    return searchClient;
}
