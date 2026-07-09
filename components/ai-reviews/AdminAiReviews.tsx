"use client";

import { BrainCircuit, ClipboardCheck, Download, Edit3, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { AiCaseReview, AiCaseSource, AiReviewStatus } from "@/lib/ai-types";
import { aiReviewStatuses } from "@/lib/ai-types";
import type { AiReviewSortField } from "@/lib/ai-review-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const aiReviewExportHeaders = ["Patient", "Phone", "Service", "Source", "Urgency", "Status", "Reviewed By", "Created"];

function aiReviewExportRow(review: AiCaseReview) {
  return [review.patientName, review.phone, review.service, review.source, review.urgency, review.status, review.reviewedBy ?? "", review.createdAt];
}

type AiSourceOption = {
  id: string;
  token?: string;
  patientName: string;
  uhid?: string;
  service: string;
  status: string;
  createdAt: string;
};

type AiSources = {
  appointments: AiSourceOption[];
  visits: AiSourceOption[];
};

type AiReviewResponse = {
  ok: boolean;
  reviews?: AiCaseReview[];
  review?: AiCaseReview;
  sources?: AiSources;
  created?: AiCaseReview[];
  pageCount?: number;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

const urgencyTone: Record<AiCaseReview["urgency"], string> = {
  Routine: "border-line bg-soft text-muted",
  "Priority Review": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  "Urgent Reception Call": "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
};

export function AdminAiReviews() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [reviews, setReviews] = useState<AiCaseReview[]>([]);
  const [sources, setSources] = useState<AiSources>({ appointments: [], visits: [] });
  const [source, setSource] = useState<AiCaseSource>("Appointment");
  const [sourceId, setSourceId] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AiReviewStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<AiCaseSource | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingReview, setEditingReview] = useState<AiCaseReview | null>(null);

  const sortField = (sorting[0]?.id as AiReviewSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadAiReviews() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);

    const response = await fetch(`/api/ai/reviews?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as AiReviewResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load AI reviews.");
      setLoading(false);
      return;
    }
    setReviews(data.reviews ?? []);
    setSources(data.sources ?? { appointments: [], visits: [] });
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
    setEditingReview((current) => {
      if (!current) return current;
      return data.reviews?.find((review) => review.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAiReviews(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, sourceFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: AiReviewStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function updateSourceFilter(value: AiCaseSource | "") {
    setSourceFilter(value);
    setPageIndex(0);
  }

  const sourceOptions = source === "Appointment" ? sources.appointments : sources.visits;

  async function generateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/ai/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, sourceId })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok || !data.review) {
      notify.error(data.error || "Unable to generate AI review.");
      return;
    }
    setSourceId("");
    void loadAiReviews();
  }

  async function seedReviews() {
    const response = await fetch("/api/ai/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to seed AI reviews.");
      return;
    }
    void loadAiReviews();
  }

  async function updateReview(id: string, updates: Partial<Pick<AiCaseReview, "status" | "doctorReviewNote" | "reviewedBy">>) {
    const response = await fetch("/api/ai/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok || !data.review) {
      notify.error(data.error || "Unable to update AI review.");
      return;
    }
    const updated = data.review as AiCaseReview;
    setReviews((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingReview((current) => (current?.id === id ? updated : current));
  }

  const columns = useMemo<ColumnDef<AiCaseReview, unknown>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 170,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.patientName)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.patientName}
            </button>
            {row.original.uhid ? <span className="mt-0.5 block text-[10px] text-muted">{row.original.uhid}</span> : null}
          </div>
        )
      },
      { accessorKey: "source", header: "Source", size: 110, cell: ({ row }) => <span>{row.original.source} | {row.original.route}</span> },
      { accessorKey: "service", header: "Service", size: 170 },
      {
        accessorKey: "urgency",
        header: "Urgency",
        size: 170,
        cell: ({ row }) => <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${urgencyTone[row.original.urgency]}`}>{row.original.urgency}</span>
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Review status"
            value={row.original.status}
            onChange={(event) => void updateReview(row.original.id, { status: event.target.value as AiReviewStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {aiReviewStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => setEditingReview((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={editingReview?.id === row.original.id}>
            <Edit3 size={13} /> Review
          </ActionButton>
        )
      }
    ],
    [openDrawer, editingReview]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">AI Review Layer</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Planning summaries for human review</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Generate structured routing notes, safety flags and preparation checklists for reception and doctor review.</p>
        </div>
        <ActionButton variant="primary" onClick={() => void seedReviews()}>
          <Sparkles size={17} /> Seed Recent
        </ActionButton>
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.5fr_1.5fr]">
        <form onSubmit={generateReview} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <BrainCircuit size={19} /> Generate review
          </p>
          <div className="grid gap-3">
            <select
              aria-label="Source type"
              value={source}
              onChange={(event) => {
                setSource(event.target.value as AiCaseSource);
                setSourceId("");
              }}
              className={fieldClass}
            >
              <option value="Appointment">Appointment</option>
              <option value="OPD">OPD</option>
            </select>
            <select aria-label="Source record" value={sourceId} onChange={(event) => setSourceId(event.target.value)} className={fieldClass} required>
              <option value="">Select source record</option>
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.token ? `${option.token} | ` : ""}
                  {option.patientName}
                  {option.uhid ? ` | ${option.uhid}` : ""} | {option.service}
                </option>
              ))}
            </select>
            <ActionButton type="submit" variant="success">
              Generate AI Review
            </ActionButton>
          </div>
          <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            AI planning support does not diagnose or prescribe. Every note must be reviewed by reception or doctor before action.
          </p>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={reviews}
            getRowId={(review) => review.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search patient, phone, service, summary"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadAiReviews()}
            emptyState={{
              icon: Sparkles,
              title: globalFilter || statusFilter || sourceFilter ? "No reviews match your filters" : "No AI reviews yet",
              description:
                globalFilter || statusFilter || sourceFilter
                  ? "Try a different search term, or clear the status/source filters."
                  : "AI clinical case reviews appear here as visits are processed, or generate one with the form.",
              action: globalFilter || statusFilter || sourceFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter || sourceFilter
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                      setSourceFilter("");
                    }
                  : undefined
            }}
            export={{ headers: aiReviewExportHeaders, row: aiReviewExportRow, filename: "ai-reviews.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => updateStatusFilter(event.target.value as AiReviewStatus | "")}
                  className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  <option value="">All statuses</option>
                  {aiReviewStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by source"
                  value={sourceFilter}
                  onChange={(event) => updateSourceFilter(event.target.value as AiCaseSource | "")}
                  className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  <option value="">All sources</option>
                  <option value="Appointment">Appointment</option>
                  <option value="OPD">OPD</option>
                </select>
              </>
            }
            bulkActions={(selected, clear) => (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(aiReviewExportHeaders, selected.map(aiReviewExportRow), "selected-ai-reviews.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />

          {editingReview ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">
                    {editingReview.source} | {editingReview.route}
                    {editingReview.uhid ? ` | ${editingReview.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{editingReview.patientName}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {editingReview.service} | {editingReview.urgency}
                  </p>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingReview(null)}>
                  Close
                </ActionButton>
              </div>
              <p className="mt-4 rounded border border-line bg-soft/50 p-3 text-sm leading-relaxed text-muted">{editingReview.summary}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                    <ClipboardCheck size={16} /> Flags
                  </p>
                  <div className="grid gap-2">
                    {editingReview.flags.map((flag) => (
                      <span key={flag} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-ink">Preparation</p>
                  <div className="grid gap-2">
                    {editingReview.preparation.map((item) => (
                      <span key={item} className="rounded border border-line bg-soft/60 px-3 py-2 text-sm text-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Reception Script</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{editingReview.receptionScript}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                <textarea
                  defaultValue={editingReview.doctorReviewNote}
                  onBlur={(event) => void updateReview(editingReview.id, { doctorReviewNote: event.target.value })}
                  className={`${fieldClass} min-h-20 py-3`}
                  placeholder="Doctor/reception review note"
                />
                <input
                  defaultValue={editingReview.reviewedBy}
                  onBlur={(event) => void updateReview(editingReview.id, { reviewedBy: event.target.value })}
                  className={fieldClass}
                  placeholder="Reviewed by"
                />
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">{editingReview.safetyNote}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
