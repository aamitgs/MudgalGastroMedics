import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { query, shouldUseDatabaseStores } from "@/lib/database";
import { generateId } from "@/lib/id";

export type DocumentMetadata = {
  id: string;
  groupId: string;
  version: number;
  entityType: string;
  entityId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string;
  uploadedByRole?: string;
  createdAt: string;
};

type StoredDocument = DocumentMetadata & { content: string };

type DocumentsFile = { documents: StoredDocument[] };

type DocumentRow = {
  legacy_id: string;
  group_id: string;
  version: number;
  entity_type: string;
  entity_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  uploaded_by_role: string | null;
  created_at: string;
};

const storeFile = join(process.cwd(), ".data", "patient-documents.json");

const globalStore = globalThis as typeof globalThis & {
  __mgmDocumentsStore?: DocumentsFile;
};

function readFromDisk(): DocumentsFile {
  if (!existsSync(storeFile)) return { documents: [] };
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<DocumentsFile>;
    return { documents: Array.isArray(parsed.documents) ? parsed.documents : [] };
  } catch {
    return { documents: [] };
  }
}

function writeToDisk(store: DocumentsFile) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
}

function getStore() {
  globalStore.__mgmDocumentsStore ??= readFromDisk();
  return globalStore.__mgmDocumentsStore;
}

function makeDocumentId() {
  return generateId("DOC", 5);
}

function rowToMetadata(row: DocumentRow): DocumentMetadata {
  return {
    id: row.legacy_id,
    groupId: row.group_id,
    version: row.version,
    entityType: row.entity_type,
    entityId: row.entity_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedByRole: row.uploaded_by_role ?? undefined,
    createdAt: new Date(row.created_at).toISOString()
  };
}

async function nextVersion(groupId: string): Promise<number> {
  if (shouldUseDatabaseStores()) {
    const result = await query<{ max: number | null }>("select max(version) as max from patient_documents where group_id = $1", [groupId]);
    return (result.rows[0]?.max ?? 0) + 1;
  }
  const existing = getStore().documents.filter((doc) => doc.groupId === groupId);
  return existing.length ? Math.max(...existing.map((doc) => doc.version)) + 1 : 1;
}

type UploadInput = {
  entityType: string;
  entityId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  uploadedBy?: string;
  uploadedByRole?: string;
  /** Omit to create a new document slot; pass to upload a new version of an existing one. */
  groupId?: string;
};

export async function uploadDocument(input: UploadInput): Promise<DocumentMetadata> {
  const groupId = input.groupId ?? makeDocumentId();
  const version = await nextVersion(groupId);
  const id = makeDocumentId();
  const createdAt = new Date().toISOString();

  const metadata: DocumentMetadata = {
    id,
    groupId,
    version,
    entityType: input.entityType,
    entityId: input.entityId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.byteLength,
    uploadedBy: input.uploadedBy,
    uploadedByRole: input.uploadedByRole,
    createdAt
  };

  if (shouldUseDatabaseStores()) {
    await query(
      `insert into patient_documents (legacy_id, group_id, version, entity_type, entity_id, filename, mime_type, size_bytes, content, uploaded_by, uploaded_by_role, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (legacy_id) do nothing`,
      [
        id,
        groupId,
        version,
        input.entityType,
        input.entityId,
        input.filename,
        input.mimeType,
        metadata.sizeBytes,
        input.buffer,
        input.uploadedBy ?? null,
        input.uploadedByRole ?? null,
        createdAt
      ]
    );
    return metadata;
  }

  const store = getStore();
  store.documents.push({ ...metadata, content: input.buffer.toString("base64") });
  writeToDisk(store);
  return metadata;
}

/** Latest version per group_id for one entity — the list a UI shows by default. */
export async function listDocuments(entityType: string, entityId: string): Promise<DocumentMetadata[]> {
  if (shouldUseDatabaseStores()) {
    const result = await query<DocumentRow>(
      `select distinct on (group_id) legacy_id, group_id, version, entity_type, entity_id, filename, mime_type, size_bytes, uploaded_by, uploaded_by_role, created_at::text
       from patient_documents
       where entity_type = $1 and entity_id = $2
       order by group_id, version desc`,
      [entityType, entityId]
    );
    return result.rows.map(rowToMetadata).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const latestByGroup = new Map<string, StoredDocument>();
  for (const doc of getStore().documents) {
    if (doc.entityType !== entityType || doc.entityId !== entityId) continue;
    const existing = latestByGroup.get(doc.groupId);
    if (!existing || doc.version > existing.version) latestByGroup.set(doc.groupId, doc);
  }
  return Array.from(latestByGroup.values())
    .map(({ content: _content, ...meta }) => meta)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Full version history for one document slot, newest first. */
export async function listDocumentVersions(groupId: string): Promise<DocumentMetadata[]> {
  if (shouldUseDatabaseStores()) {
    const result = await query<DocumentRow>(
      `select legacy_id, group_id, version, entity_type, entity_id, filename, mime_type, size_bytes, uploaded_by, uploaded_by_role, created_at::text
       from patient_documents
       where group_id = $1
       order by version desc`,
      [groupId]
    );
    return result.rows.map(rowToMetadata);
  }

  return getStore()
    .documents.filter((doc) => doc.groupId === groupId)
    .map(({ content: _content, ...meta }) => meta)
    .sort((a, b) => b.version - a.version);
}

export async function getDocumentContent(id: string): Promise<{ metadata: DocumentMetadata; buffer: Buffer } | null> {
  if (shouldUseDatabaseStores()) {
    const result = await query<DocumentRow & { content: Buffer }>(
      `select legacy_id, group_id, version, entity_type, entity_id, filename, mime_type, size_bytes, content, uploaded_by, uploaded_by_role, created_at::text
       from patient_documents
       where legacy_id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { metadata: rowToMetadata(row), buffer: row.content };
  }

  const doc = getStore().documents.find((item) => item.id === id);
  if (!doc) return null;
  const { content, ...meta } = doc;
  return { metadata: meta, buffer: Buffer.from(content, "base64") };
}
