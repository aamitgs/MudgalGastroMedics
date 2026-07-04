"use client";

import { Download, Eye, FileText, History, ImageIcon, Plus, RefreshCw, SearchCheck } from "lucide-react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CmsContentItem, CmsContentRevision, CmsContentStatus } from "@/lib/cms-types";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";
import type { StaffMember } from "@/lib/hr-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const cmsExportHeaders = ["Title", "Type", "Status", "Slug", "Owner", "Published At", "Updated"];

function cmsExportRow(item: CmsContentItem) {
  return [item.title, item.type, item.status, item.slug, item.owner, item.publishedAt ?? "", item.updatedAt];
}

type CmsResponse = {
  ok: boolean;
  items?: CmsContentItem[];
  item?: CmsContentItem;
  revisions?: CmsContentRevision[];
  currentUser?: StaffMember;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const statusTone: Record<CmsContentStatus, string> = {
  Draft: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
  "In Review": "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
  Published: "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300",
  Archived: "border-zinc-200 bg-zinc-50 text-zinc-700"
};

export function AdminCmsWorkspace() {
  const [items, setItems] = useState<CmsContentItem[]>([]);
  const [previewItem, setPreviewItem] = useState<CmsContentItem | null>(null);
  const [revisions, setRevisions] = useState<CmsContentRevision[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/cms", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load CMS content.");
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setRevisions(data.revisions ?? []);
    setCurrentUser(data.currentUser ?? null);
    setLoading(false);
  }

  async function previewContent(item: CmsContentItem) {
    setPreviewItem(item);
    const response = await fetch(`/api/cms?itemId=${encodeURIComponent(item.id)}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load CMS revisions.");
      return;
    }
    setRevisions(data.revisions ?? []);
    setCurrentUser(data.currentUser ?? currentUser);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok || !data.item) {
      setError(data.error || "Unable to save CMS content.");
      return;
    }
    setItems((entries) => [data.item as CmsContentItem, ...entries.filter((entry) => entry.id !== data.item?.id)]);
    form.reset();
  }

  async function updateStatus(id: string, status: CmsContentStatus) {
    const response = await fetch("/api/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok || !data.item) {
      setError(data.error || "Unable to update CMS status.");
      return;
    }
    setItems((entries) => entries.map((entry) => (entry.id === id ? data.item as CmsContentItem : entry)));
  }

  useEffect(() => {
    let active = true;

    async function loadInitialItems() {
      const response = await fetch("/api/cms", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as CmsResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load CMS content.");
        setLoading(false);
        return;
      }
      setItems(data.items ?? []);
      setRevisions(data.revisions ?? []);
      setCurrentUser(data.currentUser ?? null);
      setPreviewItem(data.items?.[0] ?? null);
      setLoading(false);
    }

    void loadInitialItems();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => [
    { label: "Content Items", value: items.length, icon: FileText },
    { label: "Published", value: items.filter((item) => item.status === "Published").length, icon: SearchCheck },
    { label: "In Review", value: items.filter((item) => item.status === "In Review").length, icon: RefreshCw },
    { label: "Media Records", value: items.filter((item) => item.type === "Gallery").length, icon: ImageIcon }
  ], [items]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Internal CMS</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Publishing workflow</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Private content operations for procedure copy, gallery media, SEO metadata and approvals. Public pages are not automatically overwritten.
          </p>
          {currentUser ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-dark">
              Signed in as {currentUser.name} | {currentUser.role} | {currentUser.permissions.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(cmsExportHeaders, items.map(cmsExportRow), "cms-content.csv")}
            disabled={items.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh CMS
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-5">
          <form onSubmit={saveItem} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Plus size={19} /> Add content item</p>
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select aria-label="Type" name="type" className={fieldClass} defaultValue="Page">
                  {cmsContentTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
                <select aria-label="Status" name="status" className={fieldClass} defaultValue="Draft">
                  {cmsContentStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <input name="title" className={fieldClass} placeholder="Content title" required />
              <input name="slug" className={fieldClass} placeholder="/procedures/example or /gallery#item" required />
              <textarea name="summary" className={`${fieldClass} min-h-24 py-3`} placeholder="Patient-facing summary or internal draft note" />
              <input name="seoTitle" className={fieldClass} placeholder="SEO title" />
              <textarea name="seoDescription" className={`${fieldClass} min-h-20 py-3`} placeholder="SEO description" />
              <input name="mediaUrl" className={fieldClass} placeholder="Media URL, if applicable" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="owner" className={fieldClass} placeholder="Owner" defaultValue="Admin" />
                <input name="notes" className={fieldClass} placeholder="Approval notes" />
              </div>
              <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">
                Save CMS Item
              </button>
            </div>
          </form>

          <aside className="rounded border border-line bg-surface p-4 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-lg font-bold text-ink"><Eye size={19} /> Preview & history</p>
            {previewItem ? (
              <div className="grid gap-4">
                <div className="rounded border border-line bg-soft/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{previewItem.type} Preview</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">{previewItem.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-muted">{previewItem.slug}</p>
                  <p className="mt-4 leading-relaxed text-muted">{previewItem.summary || "No summary available."}</p>
                  <div className="mt-4 rounded border border-line bg-surface p-3 text-xs text-muted">
                    <p><span className="font-bold text-ink">SEO title:</span> {previewItem.seoTitle || "-"}</p>
                    <p className="mt-1"><span className="font-bold text-ink">SEO description:</span> {previewItem.seoDescription || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-muted"><History size={15} /> Revision history</p>
                  <div className="grid max-h-64 gap-2 overflow-auto">
                    {revisions.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-3 text-sm font-semibold text-muted">No revisions yet.</p> : null}
                    {revisions.map((revision) => (
                      <div key={revision.id} className="rounded border border-line bg-surface p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-ink">v{revision.version} | {revision.action}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusTone[revision.status]}`}>{revision.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{new Date(revision.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded border border-dashed border-line bg-soft/60 p-4 text-sm font-semibold text-muted">Select a CMS item to preview its current draft and revision history.</p>
            )}
          </aside>
        </div>

        <div className="grid max-h-[760px] gap-3 overflow-auto pr-1">
          {loading ? <ModuleSkeleton /> : null}
          {!loading && items.length === 0 ? (
            <ModuleEmptyState
              icon={FileText}
              title="No CMS records yet"
              description="Website content — services, articles and gallery items — is managed here and published to the public site. Create your first record above."
            />
          ) : null}
          {items.map((item) => (
            <article key={item.id} className="rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{item.type} | {item.owner}</p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-muted">{item.slug}</p>
                </div>
                <select aria-label="Status"
                  value={item.status}
                  onChange={(event) => void updateStatus(item.id, event.target.value as CmsContentStatus)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone[item.status]}`}
                >
                  {cmsContentStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.summary || "No summary added."}</p>
              <div className="mt-3 grid gap-2 rounded border border-line bg-soft/60 p-3 text-xs text-muted">
                <p><span className="font-bold text-ink">SEO:</span> {item.seoTitle || "-"} | {item.seoDescription || "-"}</p>
                <p><span className="font-bold text-ink">Media:</span> {item.mediaUrl || "-"}</p>
                <p><span className="font-bold text-ink">Notes:</span> {item.notes || "-"}</p>
              </div>
              <button
                type="button"
                onClick={() => void previewContent(item)}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-soft px-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
              >
                <Eye size={15} /> Preview + History
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
