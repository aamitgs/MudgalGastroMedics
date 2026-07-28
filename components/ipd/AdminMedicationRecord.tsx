"use client";

import { AlertTriangle, CheckCircle2, Pill, PlusCircle, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { MedicationAdministration, MedicationOrder } from "@/lib/ipd-types";
import { medicationRoutes } from "@/lib/ipd-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { notify } from "@/lib/notify";

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

type IpdResponse = {
  ok: boolean;
  medicationOrders?: MedicationOrder[];
  medicationAdministrations?: MedicationAdministration[];
  order?: MedicationOrder;
  record?: MedicationAdministration;
  error?: string;
};

/** Doctor orders what to give (medication-order); nurses record each dose actually given (medication-administration) — see app/api/ipd/route.ts. */
export function AdminMedicationRecord({ admissionId }: { admissionId: string }) {
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/ipd", { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as IpdResponse;
    setLoading(false);
    if (!response?.ok || !data.ok) return;
    setOrders((data.medicationOrders ?? []).filter((order) => order.admissionId === admissionId));
    setAdministrations((data.medicationAdministrations ?? []).filter((record) => record.admissionId === admissionId));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admissionId]);

  async function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "medication-order",
          admissionId,
          drugName: formData.get("drugName"),
          dose: formData.get("dose"),
          route: formData.get("route"),
          frequency: formData.get("frequency")
        })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void addOrder(event));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.order) {
      notify.error(data.error || "Unable to add medication order.");
      return;
    }
    setOrders((current) => [data.order as MedicationOrder, ...current]);
    form.reset();
    notify.success("Medication order added.");
  }

  async function discontinue(id: string) {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "medication-order-discontinue", id })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void discontinue(id));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.order) {
      notify.error(data.error || "Unable to discontinue order.");
      return;
    }
    setOrders((current) => current.map((order) => (order.id === id ? (data.order as MedicationOrder) : order)));
  }

  async function recordDose(medicationOrderId: string, status: "Given" | "Missed" | "Refused") {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "medication-administration", medicationOrderId, status })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void recordDose(medicationOrderId, status));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.record) {
      notify.error(data.error || "Unable to record dose.");
      return;
    }
    setAdministrations((current) => [data.record as MedicationAdministration, ...current]);
    notify.success(status === "Given" ? "Dose recorded." : `Marked ${status.toLowerCase()}.`);
  }

  const activeOrders = orders.filter((order) => order.status === "Active");

  return (
    <div className="mt-3 rounded border border-line bg-soft/40 p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
        <Pill size={15} className="text-brand" /> Medication administration record
      </p>

      <form onSubmit={addOrder} className="mb-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
        <input name="drugName" required placeholder="Drug name" className={fieldClass} />
        <input name="dose" placeholder="Dose (e.g. 500mg)" className={fieldClass} />
        <select aria-label="Route" name="route" defaultValue="Oral" className={fieldClass}>
          {medicationRoutes.map((route) => (
            <option key={route}>{route}</option>
          ))}
        </select>
        <input name="frequency" placeholder="Frequency (e.g. Every 8 hours)" className={fieldClass} />
        <ActionButton type="submit" variant="secondary" size="sm" className="sm:col-span-2">
          <PlusCircle size={14} /> Add medication order
        </ActionButton>
      </form>

      {!loading && activeOrders.length === 0 ? (
        <ModuleEmptyState icon={Pill} title="No active medication orders" description="Add an order above; each dose given, missed or refused can then be recorded against it." />
      ) : null}

      <div className="grid gap-2">
        {activeOrders.map((order) => {
          const lastDose = administrations.find((record) => record.medicationOrderId === order.id);
          return (
            <div key={order.id} className="rounded border border-line bg-surface p-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {order.drugName} {order.dose ? `— ${order.dose}` : ""}
                  </p>
                  <p className="text-xs text-muted">{[order.route, order.frequency].filter(Boolean).join(" · ") || "No route/frequency noted"}</p>
                  {lastDose ? (
                    <p className="mt-1 text-[11px] text-muted">
                      Last: {lastDose.status} by {lastDose.administeredBy} at{" "}
                      {new Date(lastDose.administeredAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                    </p>
                  ) : null}
                </div>
                <button type="button" onClick={() => void discontinue(order.id)} className="text-xs font-semibold text-muted hover:text-red-600">
                  Discontinue
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ActionButton variant="success" size="sm" onClick={() => void recordDose(order.id, "Given")}>
                  <CheckCircle2 size={13} /> Given
                </ActionButton>
                <ActionButton variant="secondary" size="sm" onClick={() => void recordDose(order.id, "Missed")}>
                  <AlertTriangle size={13} /> Missed
                </ActionButton>
                <ActionButton variant="ghost" size="sm" onClick={() => void recordDose(order.id, "Refused")}>
                  <XCircle size={13} /> Refused
                </ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
