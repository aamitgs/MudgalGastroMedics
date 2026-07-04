import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { query, shouldUseDatabaseStores } from "@/lib/database";

/**
 * Generic persistence for the JSON document stores (confirmed architecture
 * decision): local development keeps the exact same .data/<key>.json files it
 * always used; with DATA_SOURCE=database each store's whole document lives in
 * the store_documents table (key -> jsonb), giving durable storage on
 * serverless. Relational tables in database/schema.sql remain the upgrade
 * path per store; the audit store is already fully relational.
 *
 * Concurrency note: writes are whole-document last-write-wins — the same
 * semantics the JSON files always had, acceptable for a single-branch
 * hospital's volumes and documented in docs/access-control.md.
 */
const globalCache = globalThis as typeof globalThis & {
  __mgmDocumentCache?: Map<string, unknown>;
};

function cache() {
  globalCache.__mgmDocumentCache ??= new Map<string, unknown>();
  return globalCache.__mgmDocumentCache;
}

export type DocumentStore<T> = {
  load: () => Promise<T>;
  save: (doc: T) => Promise<void>;
};

export function createDocumentStore<T>(key: string, normalize: (parsed: unknown) => T): DocumentStore<T> {
  const file = join(process.cwd(), ".data", `${key}.json`);

  function readFromDisk(): T {
    if (!existsSync(file)) return normalize(undefined);
    try {
      return normalize(JSON.parse(readFileSync(file, "utf8")));
    } catch {
      return normalize(undefined);
    }
  }

  async function load(): Promise<T> {
    if (shouldUseDatabaseStores()) {
      const result = await query<{ doc: unknown }>("select doc from store_documents where key = $1", [key]);
      return normalize(result.rows[0]?.doc);
    }
    if (!cache().has(key)) cache().set(key, readFromDisk());
    return cache().get(key) as T;
  }

  async function save(doc: T): Promise<void> {
    if (shouldUseDatabaseStores()) {
      await query(
        `insert into store_documents (key, doc, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (key) do update set doc = excluded.doc, updated_at = now()`,
        [key, JSON.stringify(doc)]
      );
      return;
    }
    cache().set(key, doc);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  }

  return { load, save };
}
