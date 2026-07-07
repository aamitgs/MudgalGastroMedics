"use client";

import { AlertTriangle, Download, FlaskConical, RefreshCw, Search, TestTube2 } from "lucide-react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";
import { commonLabTests, labOrderStatuses } from "@/lib/lab-types";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const labExportHeaders = ["Token", "Patient", "Phone", "Tests", "Priority", "Status", "Payment Status", "Created"];

function labExportRow(order: LabOrder) {
  return [order.token, order.patientName, order.phone, order.tests.join("; "), order.priority, order.status, order.paymentStatus, order.createdAt];
}

type LabResponse = {
  ok: boolean;
  orders?: LabOrder[];
  order?: LabOrder;
  visits?: OpdVisit[];
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function formatAmount(value: number | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function AdminLab() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTests, setCustomTests] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLab() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/lab", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as LabResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load lab.");
      setLoading(false);
      return;
    }
    setOrders(data.orders ?? []);
    setVisits(data.visits ?? []);
    setSelectedVisitId((current) => current || data.visits?.[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialLab() {
      const response = await fetch("/api/lab", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as LabResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load lab.");
        setLoading(false);
        return;
      }
      setOrders(data.orders ?? []);
      setVisits(data.visits ?? []);
      setSelectedVisitId(data.visits?.[0]?.id || "");
      setLoading(false);
    }

    void loadInitialLab();

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return orders;
    return orders.filter((order) =>
      [order.id, order.token, order.uhid, order.patientName, order.phone, order.tests.join(" "), order.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [orders, query]);

  const stats = useMemo(() => {
    return [
      { label: "Lab Orders", value: orders.length },
      { label: "Processing", value: orders.filter((order) => order.status === "Processing" || order.status === "Sample Collected").length },
      { label: "Result Ready", value: orders.filter((order) => order.status === "Result Ready").length },
      { label: "Critical Unacked", value: orders.filter((order) => order.criticalFlag && !order.criticalAcknowledgedAt && order.status !== "Cancelled").length },
      { label: "Paid Lab", value: formatAmount(orders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + Number(order.amount || 0), 0)) }
    ];
  }, [orders]);

  function toggleTest(test: string) {
    setSelectedTests((items) => (items.includes(test) ? items.filter((item) => item !== test) : [...items, test]));
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const custom = customTests.split(",").map((test) => test.trim()).filter(Boolean);
    const response = await fetch("/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId: selectedVisitId,
        tests: [...selectedTests, ...custom],
        priority: formData.get("priority"),
        sampleType: formData.get("sampleType"),
        amount: formData.get("amount"),
        paymentStatus: formData.get("paymentStatus"),
        notes: formData.get("notes")
      })
    });
    const data = (await response.json().catch(() => ({}))) as LabResponse;
    if (!response.ok || !data.ok || !data.order) {
      setError(data.error || "Unable to create lab order.");
      return;
    }
    setOrders((items) => [data.order as LabOrder, ...items]);
    setSelectedTests([]);
    setCustomTests("");
    event.currentTarget.reset();
    setError("");
  }

  async function updateOrder(id: string, updates: Partial<Pick<LabOrder, "status" | "resultSummary" | "reportReference" | "paymentStatus" | "amount" | "notes">> & { criticalManual?: boolean; acknowledgeCritical?: boolean }) {
    const response = await fetch("/api/lab", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as LabResponse;
    if (!response.ok || !data.ok || !data.order) {
      setError(data.error || "Unable to update lab order.");
      return;
    }
    setOrders((items) => items.map((item) => (item.id === id ? data.order as LabOrder : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Laboratory</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Lab orders and results</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Order tests against OPD visits, track sample status, and record result summaries or report references.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            variant="secondary"
            onClick={() => downloadCsv(labExportHeaders, filteredOrders.map(labExportRow), "lab-orders.csv")}
            disabled={filteredOrders.length === 0}
          >
            <Download size={17} /> Export CSV
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => void loadLab()}>
            <RefreshCw size={17} /> Refresh Lab
          </ActionButton>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={createOrder} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><FlaskConical size={19} /> Create lab order</p>
          <div className="grid gap-3">
            <select aria-label="Selected visit id" value={selectedVisitId} onChange={(event) => setSelectedVisitId(event.target.value)} className={fieldClass} required>
              <option value="">Select OPD visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>{visit.token} | {visit.patientName}{visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}</option>
              ))}
            </select>
            <div className="rounded border border-line bg-surface p-3">
              <p className="mb-2 text-sm font-bold text-ink">Common tests</p>
              <div className="flex flex-wrap gap-2">
                {commonLabTests.map((test) => (
                  <button key={test} type="button" onClick={() => toggleTest(test)} aria-pressed={selectedTests.includes(test)} className={`rounded-full border px-3 py-1 text-xs font-bold transition ${selectedTests.includes(test) ? "border-brand bg-cyan-50 dark:bg-cyan-950 text-brand" : "border-line bg-surface text-muted"}`}>
                    {test}
                  </button>
                ))}
              </div>
            </div>
            <input value={customTests} onChange={(event) => setCustomTests(event.target.value)} className={fieldClass} placeholder="Other tests, comma separated" />
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Routine"><option>Routine</option><option>Urgent</option></select>
              <input name="sampleType" className={fieldClass} placeholder="Sample type" />
              <input name="amount" className={fieldClass} type="number" min="0" placeholder="Amount" />
            </div>
            <select aria-label="Payment status" name="paymentStatus" className={fieldClass} defaultValue="Unpaid"><option>Unpaid</option><option>Paid</option></select>
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Lab notes, fasting status, sample remarks" />
            <ActionButton type="submit" variant="primary">
              <TestTube2 size={17} /> Save Lab Order
            </ActionButton>
          </div>
        </form>

        <div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lab orders" className="min-h-10 w-full rounded border border-line bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </label>
          <div className="mt-4 grid max-h-[760px] gap-3 overflow-auto pr-1">
            {loading ? <ModuleSkeleton /> : null}
            {!loading && filteredOrders.length === 0 ? (
              <ModuleEmptyState
                icon={FlaskConical}
                title="No lab orders here"
                description="Lab tests raised for patients appear in this queue. Order a test above, or adjust your search if you expected results."
              />
            ) : null}
            {filteredOrders.map((order) => (
              <article key={order.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{order.id} | {order.token}{order.uhid ? ` | ${order.uhid}` : ""}</p>
                    <h3 className="mt-1 text-lg font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => openDrawer(order.phone, order.patientName)}
                        title="Open patient summary"
                        className="rounded text-left underline-offset-4 transition hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                      >
                        {order.patientName}
                      </button>
                    </h3>
                    {order.criticalFlag ? (
                      order.criticalAcknowledgedAt ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle size={13} /> Critical — acknowledged by {order.criticalAcknowledgedBy}
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                          <AlertTriangle size={13} /> Critical result
                        </span>
                      )
                    ) : null}
                    <p className="mt-1 text-sm text-muted">{order.tests.join(", ")}</p>
                  </div>
                  <select aria-label="Order status" value={order.status} onChange={(event) => void updateOrder(order.id, { status: event.target.value as LabOrderStatus })} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                    {labOrderStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input defaultValue={order.reportReference} onBlur={(event) => void updateOrder(order.id, { reportReference: event.target.value })} className={fieldClass} placeholder="Report file/reference" />
                  <select defaultValue={order.paymentStatus} onChange={(event) => void updateOrder(order.id, { paymentStatus: event.target.value as LabOrder["paymentStatus"] })} className={fieldClass}><option>Unpaid</option><option>Paid</option></select>
                </div>
                <textarea defaultValue={order.resultSummary} onBlur={(event) => void updateOrder(order.id, { resultSummary: event.target.value })} className={`${fieldClass} mt-3 min-h-20 py-3`} placeholder="Result summary / abnormal findings" />
                {order.criticalFlag && order.criticalReasons?.length ? (
                  <ul className="mt-2 grid gap-1 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {order.criticalReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
                    <input
                      type="checkbox"
                      checked={order.criticalSource === "manual"}
                      onChange={(event) => void updateOrder(order.id, { criticalManual: event.target.checked })}
                      className="h-4 w-4 rounded border-line accent-red-600"
                    />
                    Mark critical (lab judgment)
                  </label>
                  {order.criticalFlag && !order.criticalAcknowledgedAt ? (
                    <ActionButton variant="danger" size="sm" onClick={() => void updateOrder(order.id, { acknowledgeCritical: true })}>
                      Acknowledge critical result
                    </ActionButton>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-2 text-sm font-bold text-cyan-900 dark:text-cyan-300">
                  <span>{order.priority} | {order.sampleType || "Sample not noted"}</span>
                  <span>{formatAmount(order.amount)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
