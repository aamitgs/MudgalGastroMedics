"use client";

import { BadgeIndianRupee, Download, PackageCheck, Plus, RefreshCw, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/lib/inventory-types";
import type { OpdVisit } from "@/lib/opd-types";
import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const dispenseExportHeaders = ["Token", "Patient", "Phone", "Status", "Items", "Total", "Payment Status", "Created"];

function dispenseExportRow(record: PharmacyDispenseRecord) {
  return [
    record.token,
    record.patientName,
    record.phone,
    record.status,
    record.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
    String(record.total),
    record.paymentStatus,
    record.createdAt
  ];
}

type PharmacyResponse = {
  ok: boolean;
  dispenses?: PharmacyDispenseRecord[];
  dispense?: PharmacyDispenseRecord;
  visits?: OpdVisit[];
  inventory?: InventoryItem[];
  error?: string;
};

type DraftItem = {
  inventoryItemId: string;
  quantity: string;
  unitPrice: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminPharmacy() {
  const [dispenses, setDispenses] = useState<PharmacyDispenseRecord[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ inventoryItemId: "", quantity: "1", unitPrice: "0" }]);
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<"Unpaid" | "Paid">("Unpaid");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPharmacy() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/pharmacy", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as PharmacyResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load pharmacy.");
      setLoading(false);
      return;
    }
    setDispenses(data.dispenses ?? []);
    setVisits(data.visits ?? []);
    setInventory(data.inventory ?? []);
    setSelectedVisitId((current) => current || data.visits?.[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialPharmacy() {
      const response = await fetch("/api/pharmacy", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as PharmacyResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load pharmacy.");
        setLoading(false);
        return;
      }
      setDispenses(data.dispenses ?? []);
      setVisits(data.visits ?? []);
      setInventory(data.inventory ?? []);
      setSelectedVisitId(data.visits?.[0]?.id || "");
      setLoading(false);
    }

    void loadInitialPharmacy();

    return () => {
      active = false;
    };
  }, []);

  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);
  const medicineItems = inventory.filter((item) => item.category === "Medicine" || item.category === "Consumable" || item.category === "Procedure Kit");
  const subtotal = draftItems.reduce((sum, draft) => {
    const quantity = Number(draft.quantity) || 0;
    const unitPrice = Number(draft.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const stats = useMemo(() => {
    const paidTotal = dispenses.filter((record) => record.paymentStatus === "Paid").reduce((sum, record) => sum + record.total, 0);
    return [
      { label: "Dispenses", value: dispenses.length },
      { label: "Paid Pharmacy", value: formatAmount(paidTotal) },
      { label: "Unpaid", value: dispenses.filter((record) => record.paymentStatus === "Unpaid").length },
      { label: "Low Medicine Stock", value: inventory.filter((item) => item.category === "Medicine" && item.quantity <= item.reorderLevel).length }
    ];
  }, [dispenses, inventory]);

  function updateDraftItem(index: number, patch: Partial<DraftItem>) {
    setDraftItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function issueDispense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/pharmacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId: selectedVisitId,
        items: draftItems,
        discount,
        paymentStatus,
        paymentMethod,
        notes
      })
    });
    const data = (await response.json().catch(() => ({}))) as PharmacyResponse;
    if (!response.ok || !data.ok || !data.dispense) {
      setError(data.error || "Unable to issue pharmacy dispense.");
      return;
    }
    setDispenses((items) => [data.dispense as PharmacyDispenseRecord, ...items]);
    setInventory(data.inventory ?? inventory);
    setDraftItems([{ inventoryItemId: "", quantity: "1", unitPrice: "0" }]);
    setDiscount("0");
    setPaymentStatus("Unpaid");
    setPaymentMethod("Cash");
    setNotes("");
    setError("");
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Pharmacy Counter</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Medicine and kit dispensing</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Issue medicines or procedure consumables against OPD visits. Dispensed quantities reduce stock automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(dispenseExportHeaders, dispenses.map(dispenseExportRow), "pharmacy-dispenses.csv")}
            disabled={dispenses.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadPharmacy()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh Pharmacy
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={issueDispense} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><PackageCheck size={19} /> Issue dispense</p>
          <div className="grid gap-3">
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">OPD Visit</span>
              <select aria-label="Selected visit id" value={selectedVisitId} onChange={(event) => setSelectedVisitId(event.target.value)} className={fieldClass} required>
                <option value="">Select OPD visit</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>{visit.token} | {visit.patientName}{visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}</option>
                ))}
              </select>
            </label>
            {selectedVisit ? (
              <div className="rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 p-3 text-sm text-cyan-900 dark:text-cyan-300">
                <p className="font-bold">{selectedVisit.patientName} {selectedVisit.uhid ? `(${selectedVisit.uhid})` : ""}</p>
                <p>{selectedVisit.service} | {selectedVisit.phone}</p>
              </div>
            ) : null}

            <div className="grid gap-3">
              {draftItems.map((item, index) => {
                const stockItem = inventory.find((entry) => entry.id === item.inventoryItemId);
                return (
                  <div key={index} className="grid gap-2 rounded border border-line bg-surface p-3 md:grid-cols-[1fr_90px_110px_auto] md:items-center">
                    <select aria-label="Inventory item id" value={item.inventoryItemId} onChange={(event) => updateDraftItem(index, { inventoryItemId: event.target.value })} className={fieldClass} required>
                      <option value="">Select item</option>
                      {medicineItems.map((entry) => (
                        <option key={entry.id} value={entry.id}>{entry.name} | {entry.quantity} {entry.unit}</option>
                      ))}
                    </select>
                    <input value={item.quantity} onChange={(event) => updateDraftItem(index, { quantity: event.target.value })} className={fieldClass} type="number" min="1" placeholder="Qty" required />
                    <input value={item.unitPrice} onChange={(event) => updateDraftItem(index, { unitPrice: event.target.value })} className={fieldClass} type="number" min="0" placeholder="Price" />
                    <button type="button" onClick={() => setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="grid h-11 w-11 place-items-center rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" aria-label="Remove item">
                      <Trash2 size={16} />
                    </button>
                    {stockItem ? <p className="md:col-span-4 text-xs font-semibold text-muted">Available: {stockItem.quantity} {stockItem.unit} | Reorder at {stockItem.reorderLevel}</p> : null}
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => setDraftItems((items) => [...items, { inventoryItemId: "", quantity: "1", unitPrice: "0" }])} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
              <Plus size={16} /> Add Item
            </button>

            <div className="grid gap-3 md:grid-cols-3">
              <input value={discount} onChange={(event) => setDiscount(event.target.value)} className={fieldClass} type="number" min="0" placeholder="Discount" />
              <select aria-label="Payment status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as "Unpaid" | "Paid")} className={fieldClass}>
                <option>Unpaid</option>
                <option>Paid</option>
              </select>
              <select aria-label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}>
                {["Cash", "UPI", "Card", "Insurance", "Other"].map((method) => <option key={method}>{method}</option>)}
              </select>
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass} min-h-20 py-3`} placeholder="Pharmacy instructions or notes" />
            <div className="rounded border border-line bg-surface p-4">
              <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span className="font-bold text-ink">{formatAmount(subtotal)}</span></div>
              <div className="mt-2 flex justify-between text-sm text-muted"><span>Discount</span><span className="font-bold text-ink">{formatAmount(Number(discount) || 0)}</span></div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold text-ink"><span>Total</span><span>{formatAmount(total)}</span></div>
            </div>
            <button type="submit" disabled={!selectedVisitId} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)] disabled:cursor-not-allowed disabled:opacity-60">
              <BadgeIndianRupee size={17} /> Issue Dispense
            </button>
          </div>
        </form>

        <div className="rounded border border-line bg-surface">
          <div className="border-b border-line p-4">
            <p className="text-sm font-bold text-ink">Recent pharmacy dispenses</p>
          </div>
          <div className="grid max-h-[760px] gap-3 overflow-auto p-4">
            {loading ? <ModuleSkeleton /> : null}
            {!loading && dispenses.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-4 text-sm font-semibold text-muted">No pharmacy dispenses yet.</p> : null}
            {dispenses.map((record) => (
              <article key={record.id} className="rounded border border-line bg-soft/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{record.id} | {record.token}{record.uhid ? ` | ${record.uhid}` : ""}</p>
                    <h3 className="mt-1 text-lg font-bold text-ink">{record.patientName}</h3>
                    <p className="mt-1 text-sm text-muted">{record.service} | {new Date(record.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-bold text-teal-dark">{record.paymentStatus}</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {record.items.map((item) => (
                    <div key={`${record.id}-${item.inventoryItemId}`} className="flex justify-between rounded border border-line bg-surface px-3 py-2 text-sm">
                      <span className="font-semibold text-muted">{item.name} x {item.quantity} {item.unit}</span>
                      <span className="font-bold text-ink">{formatAmount(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-2 font-bold text-cyan-900 dark:text-cyan-300">
                  <span>Total</span>
                  <span>{formatAmount(record.total)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
