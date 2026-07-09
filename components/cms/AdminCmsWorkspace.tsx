"use client";

import { Download, Eye, FileText, History, ImageIcon, Plus, RefreshCw, SearchCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { CmsContentItem, CmsContentRevision, CmsContentStatus, CmsContentType } from "@/lib/cms-types";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";
import type { CmsContentSortField } from "@/lib/cms-content-query";
import type { StaffMember } from "@/lib/hr-types";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";

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
  pageCount?: number;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

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

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<CmsContentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<CmsContentType | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortField = (sorting[0]?.id as CmsContentSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const autoPreviewedRef = useRef(false);

  async function loadItems() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    const response = await fetch(`/api/cms?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as CmsResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load CMS content.");
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setCurrentUser(data.currentUser ?? null);
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
    setPreviewItem((current) => {
      if (!current) return current;
      return data.items?.find((item) => item.id === current.id) ?? current;
    });
    if (!autoPreviewedRef.current && data.items && data.items.length > 0) {
      autoPreviewedRef.current = true;
      void previewContent(data.items[0]);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, typeFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: CmsContentStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function updateTypeFilter(value: CmsContentType | "") {
    setTypeFilter(value);
    setPageIndex(0);
  }

  async function previewContent(item: CmsContentItem) {
    setPreviewItem(item);
    const response = await fetch(`/api/cms?itemId=${encodeURIComponent(item.id)}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to load CMS revisions.");
      return;
    }
    setRevisions(data.revisions ?? []);
    setCurrentUser((current) => data.currentUser ?? current);
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
      notify.error(data.error || "Unable to save CMS content.");
      return;
    }
    form.reset();
    void loadItems();
  }

  async function updateStatus(id: string, status: CmsContentStatus) {
    const response = await fetch("/api/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as CmsResponse;
    if (!response.ok || !data.ok || !data.item) {
      notify.error(data.error || "Unable to update CMS status.");
      return;
    }
    const updated = data.item as CmsContentItem;
    setItems((entries) => entries.map((entry) => (entry.id === id ? updated : entry)));
    setPreviewItem((current) => (current?.id === id ? updated : current));
  }

  const stats = useMemo(
    () => [
      { label: "Content Items", value: items.length, icon: FileText },
      { label: "Published", value: items.filter((item) => item.status === "Published").length, icon: SearchCheck },
      { label: "In Review", value: items.filter((item) => item.status === "In Review").length, icon: RefreshCw },
      { label: "Media Records", value: items.filter((item) => item.type === "Gallery").length, icon: ImageIcon }
    ],
    [items]
  );

  const columns = useMemo<ColumnDef<CmsContentItem, unknown>[]>(
    () => [
      { accessorKey: "title", header: "Title", size: 190 },
      { accessorKey: "type", header: "Type", size: 110 },
      { id: "slug", header: "Slug", size: 190, enableSorting: false, cell: ({ row }) => <span className="font-mono text-xs text-muted">{row.original.slug}</span> },
      { accessorKey: "owner", header: "Owner", size: 130 },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="CMS status"
            value={row.original.status}
            onChange={(event) => void updateStatus(row.original.id, event.target.value as CmsContentStatus)}
            className={`rounded-full border px-2 py-1 text-xs font-bold ${statusTone[row.original.status]}`}
          >
            {cmsContentStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "updatedAt",
        header: "Updated",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{new Date(row.original.updatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
      },
      {
        id: "actions",
        header: "Actions",
        size: 150,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => void previewContent(row.original)} aria-expanded={previewItem?.id === row.original.id}>
            <Eye size={13} /> Preview + History
          </ActionButton>
        )
      }
    ],
    [previewItem]
  );

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
      </div>

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
            <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <Plus size={19} /> Add content item
            </p>
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select aria-label="Type" name="type" className={fieldClass} defaultValue="Page">
                  {cmsContentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <select aria-label="Status" name="status" className={fieldClass} defaultValue="Draft">
                  {cmsContentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
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
              <ActionButton type="submit" variant="primary">
                Save CMS Item
              </ActionButton>
            </div>
          </form>

          <aside className="rounded border border-line bg-surface p-4 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
              <Eye size={19} /> Preview & history
            </p>
            {previewItem ? (
              <div className="grid gap-4">
                <div className="rounded border border-line bg-soft/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{previewItem.type} Preview</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">{previewItem.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-muted">{previewItem.slug}</p>
                  <p className="mt-4 leading-relaxed text-muted">{previewItem.summary || "No summary available."}</p>
                  <div className="mt-4 rounded border border-line bg-surface p-3 text-xs text-muted">
                    <p>
                      <span className="font-bold text-ink">SEO title:</span> {previewItem.seoTitle || "-"}
                    </p>
                    <p className="mt-1">
                      <span className="font-bold text-ink">SEO description:</span> {previewItem.seoDescription || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-muted">
                    <History size={15} /> Revision history
                  </p>
                  <div className="grid max-h-64 gap-2 overflow-auto">
                    {revisions.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-3 text-sm font-semibold text-muted">No revisions yet.</p> : null}
                    {revisions.map((revision) => (
                      <div key={revision.id} className="rounded border border-line bg-surface p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-ink">
                            v{revision.version} | {revision.action}
                          </p>
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

        <DataTable
          columns={columns}
          data={items}
          getRowId={(item) => item.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search title, slug, summary, owner"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadItems()}
          emptyState={{
            icon: FileText,
            title: globalFilter || statusFilter || typeFilter ? "No CMS items match your filters" : "No CMS records yet",
            description:
              globalFilter || statusFilter || typeFilter
                ? "Try a different search term, or clear the status/type filters."
                : "Website content — services, articles and gallery items — is managed here and published to the public site. Create your first record with the form.",
            action: globalFilter || statusFilter || typeFilter ? "Clear filters" : undefined,
            onAction:
              globalFilter || statusFilter || typeFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setTypeFilter("");
                  }
                : undefined
          }}
          export={{ headers: cmsExportHeaders, row: cmsExportRow, filename: "cms-content.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as CmsContentStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {cmsContentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by type"
                value={typeFilter}
                onChange={(event) => updateTypeFilter(event.target.value as CmsContentType | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All types</option>
                {cmsContentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(cmsExportHeaders, selected.map(cmsExportRow), "selected-cms-content.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />
      </div>
    </div>
  );
}
