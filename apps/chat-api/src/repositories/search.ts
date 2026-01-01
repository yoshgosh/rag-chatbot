import {
    getSearchClient,
    INDEX_VECTOR_FIELD,
    INDEX_SELECT_FIELDS,
} from '../infrastructure/azure-search.js';
import type { Document } from '../domain/document.js';

const DEFAULT_TOP_N = 10;
const DEFAULT_VECTOR_K = 30;

export type SearchOptions = {
    topN?: number;
    vectorK?: number;
    filter?: string;
};

export async function search(query: string, options: SearchOptions = {}): Promise<Document[]> {
    const q = query.trim();
    if (q.length === 0) {
        return [];
    }

    const client = getSearchClient();

    const result = await client.search(q, {
        top: options.topN ?? DEFAULT_TOP_N,
        select: INDEX_SELECT_FIELDS,
        filter: options.filter,
        vectorSearchOptions: {
            queries: [
                {
                    kind: 'text',
                    text: q,
                    kNearestNeighborsCount: options.vectorK ?? DEFAULT_VECTOR_K,
                    fields: [INDEX_VECTOR_FIELD],
                },
            ],
        },
    });

    const docs: Document[] = [];
    for await (const r of result.results) {
        const { id, content, title, parentId } = r.document;

        docs.push({
            id,
            content,
            title,
            parentId,
        });
    }

    return docs;
}
