"use client";

import { FileText, History, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";

type DocumentMetadata = {
  id: string;
  groupId: string;
  version: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type DocumentsResponse = { ok: boolean; documents?: DocumentMetadata[]; error?: string };
type VersionsResponse = { ok: boolean; versions?: DocumentMetadata[]; error?: string };
type UploadResponse = { ok: boolean; error?: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reusable Documents section (Track 3.6, generalized in Track 4.6):
 * upload/preview/download/version history for real files (PDF/JPEG/PNG/
 * WEBP), stored as bytea in Postgres (or base64 in the local JSON
 * fallback) — not a filename-only "attachment." Access is gated by the
 * same RBAC resource the caller's own route uses, and every upload/
 * download/preview is audited via the existing recordAuditEvent pattern
 * (no separate log). `entityType` must be one of `documentEntityTypes`
 * (lib/validation/documents.ts) — first used for patients (Patient Drawer),
 * generalized for external lab/imaging referrals (Track 4.6).
 */
export function EntityDocumentsSection({ entityType, entityId }: { entityType: "patient" | "external-referral"; entityId: string }) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [historyGroupId, setHistoryGroupId] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceGroupId = useRef<string | null>(null);

  async function loadDocuments() {
    setLoading(true);
    const response = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as DocumentsResponse;
    setDocuments(response.ok && data.ok ? (data.documents ?? []) : []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadOnEntityChange() {
      setLoading(true);
      const response = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as DocumentsResponse;
      if (!active) return;
      setDocuments(response.ok && data.ok ? (data.documents ?? []) : []);
      setLoading(false);
    }

    void loadOnEntityChange();

    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  async function loadVersions(groupId: string) {
    const response = await fetch(`/api/documents/versions?groupId=${groupId}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as VersionsResponse;
    setVersions(response.ok && data.ok ? (data.versions ?? []) : []);
  }

  async function upload(file: File, groupId?: string) {
    setUploading(true);
    const formData = new FormData();
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    if (groupId) formData.append("groupId", groupId);
    formData.append("file", file);
    const response = await fetch("/api/documents", { method: "POST", body: formData });
    const data = (await response.json().catch(() => ({}))) as UploadResponse;
    setUploading(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to upload document.");
      return;
    }
    notify.success(groupId ? "New version uploaded" : "Document uploaded");
    void loadDocuments();
    if (groupId && historyGroupId === groupId) void loadVersions(groupId);
  }

  function toggleHistory(groupId: string) {
    if (historyGroupId === groupId) {
      setHistoryGroupId(null);
      return;
    }
    setHistoryGroupId(groupId);
    void loadVersions(groupId);
  }

  return (
    <div className="grid gap-2">
      {loading ? <p className="text-sm text-muted">Loading documents…</p> : null}
      {!loading && documents.length === 0 ? <p className="text-sm text-muted">No documents on file.</p> : null}

      {documents.map((document) => (
        <div key={document.groupId} className="rounded border border-line bg-soft/60 p-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <FileText size={15} className="mt-0.5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink" title={document.filename}>
                {document.filename}
              </p>
              <p className="text-xs text-muted">
                {formatSize(document.sizeBytes)} · v{document.version} · {new Date(document.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a
              href={`/api/documents/download?id=${document.id}&mode=inline`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-line bg-surface px-2 py-1 text-xs font-bold text-ink hover:border-brand hover:text-brand"
            >
              View
            </a>
            <a href={`/api/documents/download?id=${document.id}`} className="rounded border border-line bg-surface px-2 py-1 text-xs font-bold text-ink hover:border-brand hover:text-brand">
              Download
            </a>
            <button
              type="button"
              onClick={() => toggleHistory(document.groupId)}
              className="flex items-center gap-1 rounded border border-line bg-surface px-2 py-1 text-xs font-bold text-ink hover:border-brand hover:text-brand"
            >
              <History size={12} /> {document.version > 1 ? `History (${document.version})` : "History"}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                replaceGroupId.current = document.groupId;
                replaceInputRef.current?.click();
              }}
              className="rounded border border-line bg-surface px-2 py-1 text-xs font-bold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
            >
              Replace
            </button>
          </div>
          {historyGroupId === document.groupId ? (
            <ul className="mt-2 grid gap-1 border-t border-line pt-2">
              {versions.map((version) => (
                <li key={version.id} className="flex items-center justify-between text-xs text-muted">
                  <span>
                    v{version.version} · {new Date(version.createdAt).toLocaleString("en-IN")}
                  </span>
                  <a href={`/api/documents/download?id=${version.id}`} className="font-bold text-brand hover:underline">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const groupId = replaceGroupId.current;
          event.target.value = "";
          if (file && groupId) void upload(file, groupId);
        }}
      />
      <ActionButton variant="secondary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        <Upload size={14} /> {uploading ? "Uploading…" : "Upload document"}
      </ActionButton>
    </div>
  );
}
