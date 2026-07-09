import "server-only";

import { Pool } from "pg";
import type { QueryResultRow } from "pg";
import { logServerError } from "@/lib/error-logger";

type DatabaseHealth = {
  configured: boolean;
  ok: boolean;
  latencyMs?: number;
  databaseTime?: string;
  error?: string;
};

const globalPool = globalThis as typeof globalThis & {
  __mgmPgPool?: Pool;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function shouldUseDatabaseStores() {
  return process.env.DATA_SOURCE === "database" && hasDatabaseUrl();
}

export function getPool() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  globalPool.__mgmPgPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX || 5)
  });

  return globalPool.__mgmPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  try {
    return await getPool().query<T>(text, values);
  } catch (error) {
    // Single choke point for every database-mode store — logging here gives
    // permanent, searchable visibility into DB failures across the whole
    // app without touching each of the 70+ API routes individually. The
    // error still rethrows unchanged so callers' existing handling is
    // untouched.
    logServerError("database.query", error, { queryStart: text.trim().slice(0, 80) });
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!hasDatabaseUrl()) return { configured: false, ok: false, error: "DATABASE_URL is not configured." };

  const startedAt = Date.now();
  try {
    const result = await query<{ now: string }>("select now()::text as now");
    return {
      configured: true,
      ok: true,
      latencyMs: Date.now() - startedAt,
      databaseTime: result.rows[0]?.now
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unable to connect to database."
    };
  }
}

export async function checkSchemaHealth() {
  if (!hasDatabaseUrl()) return { configured: false, ok: false, missingTables: [], error: "DATABASE_URL is not configured." };

  const requiredTables = [
    "patients",
    "appointments",
    "opd_visits",
    "staff_members",
    "audit_events",
    "cms_content_items"
  ];

  try {
    const result = await query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)",
      [requiredTables]
    );
    const present = new Set(result.rows.map((row) => row.table_name));
    const missingTables = requiredTables.filter((table) => !present.has(table));
    return { configured: true, ok: missingTables.length === 0, missingTables };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      missingTables: requiredTables,
      error: error instanceof Error ? error.message : "Unable to inspect database schema."
    };
  }
}
