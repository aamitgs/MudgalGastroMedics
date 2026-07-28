"use client";

import { ListOrdered, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import { notify } from "@/lib/notify";
import type { ConsultationFeeRule, ServiceCategory, ServicePrice } from "@/lib/pricing-types";
import { consultationDayTypes, consultationVisitTypes, serviceCategories } from "@/lib/pricing-types";
import type { ServicePackage } from "@/lib/package-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormField } from "@/components/design-system/FormField";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

type PricingResponse = { ok: boolean; services?: ServicePrice[]; consultationFees?: ConsultationFeeRule[]; error?: string };
type PackagesResponse = { ok: boolean; packages?: Array<ServicePackage & { savingPaise: number }>; error?: string };

/**
 * The price master, consultation fee rules and packages (Tracks 5.1 and 5.7).
 *
 * These were API-only until now, which meant a hospital could not set a single
 * price without an engineer — and every other billing surface depends on them
 * existing. This is configuration rather than counter work, so it is
 * deliberately the last tab and reads as a settings screen.
 *
 * Changing a price demands a reason, matching the server rule: the audit trail
 * records who, and the revision on the service itself records why, so the
 * answer travels with the record.
 */
export function PriceMasterPanel() {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [fees, setFees] = useState<ConsultationFeeRule[]>([]);
  const [packages, setPackages] = useState<Array<ServicePackage & { savingPaise: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [service, setService] = useState({ code: "", name: "", category: "Consultation" as ServiceCategory, price: "" });
  const [fee, setFee] = useState({ visitType: "New", dayType: "", doctorName: "", fee: "" });
  const [pkg, setPkg] = useState({ code: "", name: "", price: "", items: "" });
  /** A real hospital carries hundreds of price codes; the list is unusable without a filter. */
  const [filter, setFilter] = useState("");
  const [showRetired, setShowRetired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [pricingRes, packagesRes] = await Promise.all([
      fetch("/api/pricing", { cache: "no-store" }).catch(() => null),
      fetch("/api/billing/packages", { cache: "no-store" }).catch(() => null)
    ]);

    const pricing = ((await pricingRes?.json().catch(() => ({}))) ?? {}) as PricingResponse;
    const packageData = ((await packagesRes?.json().catch(() => ({}))) ?? {}) as PackagesResponse;

    if (!pricing.ok) {
      setError(pricing.error || "Unable to load the price list.");
      setLoading(false);
      return;
    }

    setServices(pricing.services ?? []);
    setFees(pricing.consultationFees ?? []);
    setPackages(packageData.packages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function post(url: string, body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void post(url, body, successMessage));
      return false;
    }
    const data = (await response.json().catch(() => ({}))) as { ok: boolean; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to save that.");
      return false;
    }
    notify.success(successMessage);
    await load();
    return true;
  }

  async function changePrice(entry: ServicePrice) {
    const next = window.prompt(`New price for ${entry.name} (currently ${formatPaise(entry.basePricePaise)})`, String(entry.basePricePaise / 100));
    if (!next) return;
    // The server requires this too; asking here means the desk isn't bounced
    // by a validation error after typing the number.
    const reason = window.prompt("Why is this price changing? It is recorded against the service.");
    if (!reason?.trim()) {
      notify.error("A reason is required when changing a price.");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "service", id: entry.id, basePrice: Number(next), reason })
    }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as { ok: boolean; error?: string };
    setBusy(false);
    if (!data.ok) {
      notify.error(data.error || "Unable to change that price.");
      return;
    }
    notify.success(`${entry.name} updated`, { description: "Bills already raised are unaffected." });
    await load();
  }

  async function toggleActive(entry: ServicePrice) {
    setBusy(true);
    await fetch("/api/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "service", id: entry.id, active: !entry.active })
    }).catch(() => null);
    setBusy(false);
    await load();
  }

  const term = filter.trim().toLowerCase();
  const visibleServices = services
    .filter((entry) => showRetired || entry.active)
    .filter((entry) => !term || entry.code.toLowerCase().includes(term) || entry.name.toLowerCase().includes(term) || entry.category.toLowerCase().includes(term));

  return (
    <section aria-label="Price list" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Price list</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          What the hospital charges. Changing a price affects future bills only — invoices already raised keep the amounts they were issued
          with.
        </p>
      </div>

      <div className="grid gap-5 p-4">
        {loading ? (
          <ModuleSkeleton rows={4} tiles={0} />
        ) : error ? (
          <div className="grid gap-3 rounded border border-line bg-soft/60 p-6 text-center">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <ActionButton variant="secondary" size="sm" className="mx-auto" onClick={() => void load()}>
              Retry
            </ActionButton>
          </div>
        ) : (
          <>
            {/* --- services ------------------------------------------------ */}
            <section aria-label="Services" className="grid gap-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Services</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="svc-filter">
                    Search services
                  </label>
                  <input
                    id="svc-filter"
                    className="min-h-9 w-56 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="Search code, name or category"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  />
                  <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                    <input type="checkbox" checked={showRetired} onChange={(event) => setShowRetired(event.target.checked)} className="size-4 accent-[var(--site-brand)]" />
                    Show retired
                  </label>
                </div>
              </div>

              <form
                className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded border border-line bg-soft/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const ok = await post(
                    "/api/pricing",
                    { kind: "service", code: service.code, name: service.name, category: service.category, basePrice: Number(service.price) },
                    `${service.name} added to the price list`
                  );
                  if (ok) setService({ code: "", name: "", category: "Consultation", price: "" });
                }}
              >
                <FormField label="Code" htmlFor="svc-code" required hint="e.g. CONS-NEW">
                  <input id="svc-code" className={fieldClass} value={service.code} onChange={(e) => setService((s) => ({ ...s, code: e.target.value }))} />
                </FormField>
                <FormField label="Name" htmlFor="svc-name" required>
                  <input id="svc-name" className={fieldClass} value={service.name} onChange={(e) => setService((s) => ({ ...s, name: e.target.value }))} />
                </FormField>
                <FormField label="Category" htmlFor="svc-cat" required>
                  <select id="svc-cat" className={fieldClass} value={service.category} onChange={(e) => setService((s) => ({ ...s, category: e.target.value as ServiceCategory }))}>
                    {serviceCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Price" htmlFor="svc-price" required>
                  <input id="svc-price" className={fieldClass} inputMode="decimal" value={service.price} onChange={(e) => setService((s) => ({ ...s, price: e.target.value }))} />
                </FormField>
                <ActionButton type="submit" variant="primary" size="sm" loading={busy}>
                  <Plus size={14} /> Add
                </ActionButton>
              </form>

              {visibleServices.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleServices.slice(0, 40).map((entry) => (
                        <TableRow key={entry.id} className={entry.active ? undefined : "opacity-60"}>
                          <TableCell className="font-mono text-xs text-ink">{entry.code}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-ink">{entry.name}</span>
                            {!entry.active ? (
                              <StatusBadge tone="inactive" className="ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                Retired
                              </StatusBadge>
                            ) : null}
                            {entry.revisions.length ? (
                              <span className="mt-0.5 block text-[10px] text-muted">
                                {entry.revisions.length} price {entry.revisions.length === 1 ? "change" : "changes"} · last:{" "}
                                {entry.revisions[entry.revisions.length - 1].reason}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-muted">{entry.category}</TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-ink">{formatPaise(entry.basePricePaise)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <ActionButton variant="ghost" size="sm" onClick={() => void changePrice(entry)}>
                                Change price
                              </ActionButton>
                              <ActionButton variant="ghost" size="sm" onClick={() => void toggleActive(entry)}>
                                {entry.active ? "Retire" : "Restore"}
                              </ActionButton>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {visibleServices.length > 40 ? (
                    <p className="text-xs text-muted">Showing the first 40 of {visibleServices.length} matches — narrow the search to see the rest.</p>
                  ) : null}
                </div>
              ) : (
                <ModuleEmptyState
                  icon={ListOrdered}
                  title={term || !showRetired ? "No services match" : "No services priced yet"}
                  description={
                    term
                      ? "Try a different code, name or category."
                      : "Every bill draws its amounts from this list. Add the consultations, procedures and investigations the hospital charges for."
                  }
                  action={term ? "Clear search" : undefined}
                  onAction={term ? () => setFilter("") : undefined}
                />
              )}
            </section>

            {/* --- consultation fees --------------------------------------- */}
            <section aria-label="Consultation fees" className="grid gap-3 border-t border-line pt-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Consultation fees</p>
              <p className="-mt-1 text-xs text-muted">
                A doctor-specific rule outranks a day-specific one. Leave the doctor blank for the hospital-wide default.
              </p>

              <form
                className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded border border-line bg-soft/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const ok = await post(
                    "/api/pricing",
                    {
                      kind: "consultation-fee",
                      visitType: fee.visitType,
                      dayType: fee.dayType || undefined,
                      doctorName: fee.doctorName || undefined,
                      fee: Number(fee.fee)
                    },
                    "Consultation fee rule added"
                  );
                  if (ok) setFee({ visitType: "New", dayType: "", doctorName: "", fee: "" });
                }}
              >
                <FormField label="Visit type" htmlFor="fee-visit" required>
                  <select id="fee-visit" className={fieldClass} value={fee.visitType} onChange={(e) => setFee((f) => ({ ...f, visitType: e.target.value }))}>
                    {consultationVisitTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Day" htmlFor="fee-day" hint="Any day if blank">
                  <select id="fee-day" className={fieldClass} value={fee.dayType} onChange={(e) => setFee((f) => ({ ...f, dayType: e.target.value }))}>
                    <option value="">Any day</option>
                    {consultationDayTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Doctor" htmlFor="fee-doctor" hint="Blank = hospital default">
                  <input id="fee-doctor" className={fieldClass} value={fee.doctorName} onChange={(e) => setFee((f) => ({ ...f, doctorName: e.target.value }))} />
                </FormField>
                <FormField label="Fee" htmlFor="fee-amount" required>
                  <input id="fee-amount" className={fieldClass} inputMode="decimal" value={fee.fee} onChange={(e) => setFee((f) => ({ ...f, fee: e.target.value }))} />
                </FormField>
                <ActionButton type="submit" variant="primary" size="sm" loading={busy}>
                  <Plus size={14} /> Add
                </ActionButton>
              </form>

              {fees.length ? (
                <ul className="grid gap-1.5">
                  {fees.map((rule) => (
                    <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2 text-sm">
                      <span className="text-ink">
                        <span className="font-semibold">{rule.doctorName ?? "Hospital default"}</span> · {rule.visitType}
                        {rule.dayType ? ` · ${rule.dayType}` : ""}
                        {rule.followUpWindowDays ? ` · within ${rule.followUpWindowDays} days` : ""}
                      </span>
                      <span className="flex items-center gap-2">
                        {!rule.active ? (
                          <StatusBadge tone="inactive" className="rounded-full px-2 py-0.5 text-[10px] uppercase">
                            Retired
                          </StatusBadge>
                        ) : null}
                        <span className="font-bold tabular-nums text-ink">{formatPaise(rule.feePaise)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No consultation fees configured — an OPD bill has nothing to charge until one exists.</p>
              )}
            </section>

            {/* --- packages ------------------------------------------------- */}
            <section aria-label="Packages" className="grid gap-3 border-t border-line pt-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Packages</p>

              <form
                className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded border border-line bg-soft/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  // "CODE x QUANTITY" pairs, comma separated — the shortest
                  // thing to type that still names real price-list entries.
                  const items = pkg.items
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .map((part) => {
                      const [priceCode, quantity] = part.split(/\s*[x*]\s*/i);
                      return { priceCode: priceCode.trim(), quantity: Number(quantity || 1) };
                    });

                  const ok = await post(
                    "/api/billing/packages",
                    { code: pkg.code, name: pkg.name, price: Number(pkg.price), items },
                    `${pkg.name} package created`
                  );
                  if (ok) setPkg({ code: "", name: "", price: "", items: "" });
                }}
              >
                <FormField label="Code" htmlFor="pkg-code" required>
                  <input id="pkg-code" className={fieldClass} value={pkg.code} onChange={(e) => setPkg((p) => ({ ...p, code: e.target.value }))} />
                </FormField>
                <FormField label="Name" htmlFor="pkg-name" required>
                  <input id="pkg-name" className={fieldClass} value={pkg.name} onChange={(e) => setPkg((p) => ({ ...p, name: e.target.value }))} />
                </FormField>
                <FormField label="Bundle price" htmlFor="pkg-price" required>
                  <input id="pkg-price" className={fieldClass} inputMode="decimal" value={pkg.price} onChange={(e) => setPkg((p) => ({ ...p, price: e.target.value }))} />
                </FormField>
                <FormField label="Includes" htmlFor="pkg-items" required hint="Price codes, e.g. ENDO x1, ENDO-FU x10">
                  <input id="pkg-items" className={fieldClass} value={pkg.items} onChange={(e) => setPkg((p) => ({ ...p, items: e.target.value }))} />
                </FormField>
                <ActionButton type="submit" variant="primary" size="sm" loading={busy}>
                  <Plus size={14} /> Add
                </ActionButton>
              </form>

              {packages.length ? (
                <ul className="grid gap-1.5">
                  {packages.map((entry) => (
                    <li key={entry.id} className="grid gap-1 rounded border border-line px-3 py-2 text-sm">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-ink">
                          {entry.name} <span className="font-mono text-xs text-muted">{entry.code}</span>
                        </span>
                        <span className="font-bold tabular-nums text-ink">{formatPaise(entry.pricePaise)}</span>
                      </span>
                      <span className="text-xs text-muted">
                        {entry.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}
                        {entry.savingPaise > 0 ? ` · saves ${formatPaise(entry.savingPaise)}` : ""}
                        {entry.validityDays ? ` · valid ${entry.validityDays} days` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No packages defined yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
