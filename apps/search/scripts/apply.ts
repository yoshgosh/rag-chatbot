import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}

async function listJsonFiles(dirPath: string): Promise<string[]> {
    try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        return entries
            .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
            .map((e) => path.join(dirPath, e.name))
            .sort((a, b) => a.localeCompare(b));
    } catch (err: any) {
        if (err && err.code === "ENOENT") {
            return [];
        }
        throw err;
    }
}

class Replacer {
    private readonly replacements: Record<string, string>;

    public constructor(replacements: Record<string, string>) {
        this.replacements = replacements;
    }

    public replace(raw: string): string {
        let out = raw;
        for (const [from, to] of Object.entries(this.replacements)) {
            out = out.replaceAll(from, to);
        }
        return out;
    }
}

class SearchRestClient {
    private readonly endpoint: string;
    private readonly apiVersion: string;
    private readonly apiKey: string;

    public constructor(endpoint: string, apiVersion: string, apiKey: string) {
        this.endpoint = trimTrailingSlash(endpoint);
        this.apiVersion = apiVersion;
        this.apiKey = apiKey;
    }

    public async put(collection: string, name: string, body: unknown): Promise<void> {
        const url = `${this.endpoint}/${collection}('${encodeURIComponent(name)}')?api-version=${encodeURIComponent(this.apiVersion)}`;

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "api-key": this.apiKey
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`PUT failed: ${url}\nstatus=${res.status} ${res.statusText}\n${text}`);
        }
    }
}

class SearchIndexClient {
    private readonly rest: SearchRestClient;

    public constructor(rest: SearchRestClient) {
        this.rest = rest;
    }

    public async put(indexDefinition: any): Promise<void> {
        const name = indexDefinition?.name;
        if (!name || typeof name !== "string") {
            throw new Error('Index definition is missing "name"');
        }
        await this.rest.put("indexes", name, indexDefinition);
    }
}

class SearchDatasourceClient {
    private readonly rest: SearchRestClient;

    public constructor(rest: SearchRestClient) {
        this.rest = rest;
    }

    public async put(datasourceDefinition: any): Promise<void> {
        const name = datasourceDefinition?.name;
        if (!name || typeof name !== "string") {
            throw new Error('Datasource definition is missing "name"');
        }
        await this.rest.put("datasources", name, datasourceDefinition);
    }
}

class SearchSkillsetClient {
    private readonly rest: SearchRestClient;

    public constructor(rest: SearchRestClient) {
        this.rest = rest;
    }

    public async put(skillsetDefinition: any): Promise<void> {
        const name = skillsetDefinition?.name;
        if (!name || typeof name !== "string") {
            throw new Error('Skillset definition is missing "name"');
        }
        await this.rest.put("skillsets", name, skillsetDefinition);
    }
}

class SearchIndexerClient {
    private readonly rest: SearchRestClient;

    public constructor(rest: SearchRestClient) {
        this.rest = rest;
    }

    public async put(indexerDefinition: any): Promise<void> {
        const name = indexerDefinition?.name;
        if (!name || typeof name !== "string") {
            throw new Error('Indexer definition is missing "name"');
        }
        await this.rest.put("indexers", name, indexerDefinition);
    }
}

async function applyIndexes(
    dirPath: string,
    indexClient: SearchIndexClient,
    replacer: Replacer
): Promise<number> {
    const files = await listJsonFiles(dirPath);

    if (files.length === 0) {
        console.log(`[search] indexes: skip (no files in ${dirPath})`);
        return 0;
    }

    let count = 0;
    for (const filePath of files) {
        const raw = await readFile(filePath, "utf-8");
        const replaced = replacer.replace(raw);
        const def = JSON.parse(replaced);

        await indexClient.put(def);

        console.log(`[search] indexes: applied ${def.name} (${path.basename(filePath)})`);
        count += 1;
    }

    return count;
}

async function applyDatasources(
    dirPath: string,
    datasourceClient: SearchDatasourceClient,
    replacer: Replacer
): Promise<number> {
    const files = await listJsonFiles(dirPath);

    if (files.length === 0) {
        console.log(`[search] datasources: skip (no files in ${dirPath})`);
        return 0;
    }

    let count = 0;
    for (const filePath of files) {
        const raw = await readFile(filePath, "utf-8");
        const replaced = replacer.replace(raw);
        const def = JSON.parse(replaced);

        await datasourceClient.put(def);

        console.log(`[search] datasources: applied ${def.name} (${path.basename(filePath)})`);
        count += 1;
    }

    return count;
}

async function applySkillsets(
    dirPath: string,
    skillsetClient: SearchSkillsetClient,
    replacer: Replacer
): Promise<number> {
    const files = await listJsonFiles(dirPath);

    if (files.length === 0) {
        console.log(`[search] skillsets: skip (no files in ${dirPath})`);
        return 0;
    }

    let count = 0;
    for (const filePath of files) {
        const raw = await readFile(filePath, "utf-8");
        const replaced = replacer.replace(raw);
        const def = JSON.parse(replaced);

        await skillsetClient.put(def);

        console.log(`[search] skillsets: applied ${def.name} (${path.basename(filePath)})`);
        count += 1;
    }

    return count;
}

async function applyIndexers(
    dirPath: string,
    indexerClient: SearchIndexerClient,
    replacer: Replacer
): Promise<number> {
    const files = await listJsonFiles(dirPath);

    if (files.length === 0) {
        console.log(`[search] indexers: skip (no files in ${dirPath})`);
        return 0;
    }

    let count = 0;
    for (const filePath of files) {
        const raw = await readFile(filePath, "utf-8");
        const replaced = replacer.replace(raw);
        const def = JSON.parse(replaced);

        await indexerClient.put(def);

        console.log(`[search] indexers: applied ${def.name} (${path.basename(filePath)})`);
        count += 1;
    }

    return count;
}

async function main(): Promise<void> {
    const searchEndpoint = requireEnv("AZURE_SEARCH_SERVICE_ENDPOINT");
    const searchAdminKey = requireEnv("AZURE_SEARCH_ADMIN_KEY");
    const apiVersion = "2025-09-01";

    const schemasDir = path.resolve(process.cwd(), "schemas");
    const datasourcesDir = path.join(schemasDir, "datasources");
    const indexesDir = path.join(schemasDir, "indexes");
    const skillsetsDir = path.join(schemasDir, "skillsets");
    const indexersDir = path.join(schemasDir, "indexers");

    const replacer = new Replacer({
        "__AOAI_ENDPOINT__": trimTrailingSlash(requireEnv("AZURE_OPENAI_ENDPOINT")),
        "__AOAI_KEY__": requireEnv("AZURE_OPENAI_API_KEY"),
        "__AOAI_EMBEDDING_DEPLOYMENT__": requireEnv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"),
        "__DOCS_STORAGE_CONNECTION_STRING__": requireEnv("AZURE_DOCS_STORAGE_CONNECTION_STRING")
    });

    const rest = new SearchRestClient(searchEndpoint, apiVersion, searchAdminKey);

    const datasourceClient = new SearchDatasourceClient(rest);
    const indexClient = new SearchIndexClient(rest);
    const skillsetClient = new SearchSkillsetClient(rest);
    const indexerClient = new SearchIndexerClient(rest);

    const appliedDatasources = await applyDatasources(datasourcesDir, datasourceClient, replacer);
    const appliedIndexes = await applyIndexes(indexesDir, indexClient, replacer);
    const appliedSkillsets = await applySkillsets(skillsetsDir, skillsetClient, replacer);
    const appliedIndexers = await applyIndexers(indexersDir, indexerClient, replacer);

    console.log(
        `[search] done. datasources=${appliedDatasources}, indexes=${appliedIndexes}, skillsets=${appliedSkillsets}, indexers=${appliedIndexers}`
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});