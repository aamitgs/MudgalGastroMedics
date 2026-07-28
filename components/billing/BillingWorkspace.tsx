"use client";

import { Search, UserSearch } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";
import type { BillingTotals, DuplicateWarning, PaymentHistoryEntry } from "@/lib/billing-workspace";
import type { InsuranceClaim } from "@/lib/finance-types";
import type { AcceptanceMethod, Estimate, EstimateStatus } from "@/lib/estimate-types";
import type { PackageBalance } from "@/lib/package-calc";
import type { Recommendation } from "@/lib/billing-assistant";
import type { WalletSummary } from "@/lib/wallet-calc";
import type { PatientWallet } from "@/lib/wallet-types";
import { notify } from "@/lib/notify";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import type { InvoicePaymentMethod } from "@/lib/billing-types";
import type { InvoicePaymentFormInput } from "@/lib/validation/billing";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { AdvanceWalletPanel } from "@/components/billing/AdvanceWalletPanel";
import { BillingAssistantPanel } from "@/components/billing/BillingAssistantPanel";
import { PackageEstimatePanel } from "@/components/billing/PackageEstimatePanel";
import { BillingWorkspaceSummary, type WorkspacePatient } from "@/components/billing/BillingWorkspaceSummary";
import { InvoiceCollectionPanel, type SkippedCharge } from "@/components/billing/InvoiceCollectionPanel";
import type { AdjustmentRequest } from "@/components/billing/InvoiceAdjustmentRequest";

type WorkspaceView = {
  patient: WorkspacePatient;
  latestVisit: OpdVisit | null;
  recentVisits: OpdVisit[];
  currentInvoice: Invoice | null;
  invoices: Invoice[];
  totals: BillingTotals;
  payments: PaymentHistoryEntry[];
  insuranceClaims: InsuranceClaim[];
  wallet: PatientWallet | null;
  walletSummary: WalletSummary;
  packageBalances: PackageBalance[];
  estimates: Array<Estimate & { effectiveStatus: EstimateStatus }>;
  duplicateWarnings: DuplicateWarning[];
  recommendations: Recommendation[];
};

type WorkspaceResponse = { ok: boolean; workspace?: WorkspaceView; error?: string };
type PatientsResponse = { ok: boolean; patients?: PatientRecord[]; error?: string };
type MutationResponse = { ok: boolean; invoice?: Invoice; error?: string };
type SyncResponse = MutationResponse & { added?: number; skipped?: SkippedCharge[] };

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

/**
 * The unified billing workspace (Track 5.4, §1) — one screen answering
 * "what does this patient owe, and what am I collecting right now?".
 *
 * Patient-first rather than invoice-first: at a counter the person in front of
 * you is the query, and the previous fragmented screens made staff find a bill
 * before they could see a balance.
 *
 * The whole patient picture arrives in one aggregate request
 * (/api/billing/workspace) rather than a fan-out of four, because a queue at
 * the counter cannot absorb serial round-trips.
 *
 * Not here yet, and deliberately not stubbed: WhatsApp/email invoice delivery
 * (5.8). Placeholder UI on a staff surface is worse than an absent feature.
 */
export function BillingWorkspace() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<PatientRecord[]>([]);
  const [searching, setSearching] = useState(false);

  const [phone, setPhone] = useState<string | null>(null);
  const [view, setView] = useState<WorkspaceView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<SkippedCharge[]>([]);

  /**
   * Whether this user may write money off. The server is the real gate
   * (billing-adjustments on /api/billing/wallet); this only decides whether to
   * offer an action that would be refused, so reception isn't shown a refund
   * button that always fails.
   */
  const [canAdjust, setCanAdjust] = useState(false);

  const latestSearch = useRef(0);
  const latestLoad = useRef(0);
  /** Set when the query box is filled by picking a result, so the pick doesn't re-open the list it came from. */
  const suppressSearch = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as { permissions?: Record<string, string[]> };
      if (!active) return;
      setCanAdjust(Boolean(data.permissions?.["billing-adjustments"]?.includes("edit")));
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (suppressSearch.current) {
      suppressSearch.current = false;
      return;
    }

    const term = query.trim();

    // Debounced for the same reason as the collection desk: this search runs
    // server-side, so a request per keystroke is a request per keystroke.
    // Everything, including clearing the list, happens inside the timer so no
    // state is set synchronously during the effect.
    const timer = setTimeout(async () => {
      if (term.length < 2) {
        setMatches([]);
        return;
      }

      const requestId = ++latestSearch.current;
      setSearching(true);
      const response = await fetch(`/api/patients?page=0&pageSize=8&q=${encodeURIComponent(term)}`, { cache: "no-store" }).catch(() => null);
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as PatientsResponse;
      if (requestId !== latestSearch.current) return;
      setMatches(data.patients ?? []);
      setSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const loadWorkspace = useCallback(async (patientPhone: string) => {
    const requestId = ++latestLoad.current;
    setLoading(true);
    setError("");

    let response: Response;
    try {
      response = await fetch(`/api/billing/workspace?phone=${encodeURIComponent(patientPhone)}`, { cache: "no-store" });
    } catch {
      if (requestId !== latestLoad.current) return;
      setError("Unable to reach the server. Check your connection and retry.");
      setLoading(false);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as WorkspaceResponse;
    if (requestId !== latestLoad.current) return;

    if (!response.ok || !data.ok || !data.workspace) {
      setError(data.error || "Unable to load this patient's billing.");
      setView(null);
      setLoading(false);
      return;
    }

    setView(data.workspace);
    setOpenInvoiceId(data.workspace.currentInvoice?.id ?? null);
    setLoading(false);
  }, []);

  function selectPatient(patientPhone: string, name: string) {
    suppressSearch.current = true;
    setPhone(patientPhone);
    setQuery(name);
    setMatches([]);
    setSkipped([]);
    void loadWorkspace(patientPhone);
  }

  const openInvoice = view?.invoices.find((invoice) => invoice.id === openInvoiceId) ?? null;

  async function patchInvoice(body: Record<string, unknown>): Promise<Invoice | null> {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void patchInvoice(body));
      return null;
    }

    const data = (await response.json().catch(() => ({}))) as SyncResponse;
    setBusy(false);
    if (!response.ok || !data.ok || !data.invoice) {
      notify.error(data.error || "Unable to update this invoice.");
      return null;
    }
    if (body.action === "sync-charges") setSkipped(data.skipped ?? []);
    return data.invoice;
  }

  /** Totals, outstanding and duplicate warnings all move when a bill changes, so the whole view is refetched rather than patched in place. */
  async function refreshAfter(updated: Invoice | null) {
    if (!updated || !phone) return;
    setOpenInvoiceId(updated.id);
    await loadWorkspace(phone);
  }

  async function issueInvoice(invoice: Invoice) {
    const updated = await patchInvoice({ action: "issue", id: invoice.id });
    if (updated) notify.success(`${updated.invoiceNo} issued`, { description: `${formatPaise(updated.totalPaise)} due` });
    await refreshAfter(updated);
  }

  async function syncCharges(invoice: Invoice) {
    const updated = await patchInvoice({ action: "sync-charges", id: invoice.id });
    if (updated) notify.success("Charges pulled from this visit", { description: `${updated.invoiceNo} totals ${formatPaise(updated.totalPaise)}` });
    await refreshAfter(updated);
  }

  async function walletRequest(method: "POST" | "PATCH", body: Record<string, unknown>, successMessage: string) {
    if (!phone) return;
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing/wallet", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void walletRequest(method, body, successMessage));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ok: boolean; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to update the advance wallet.");
      return;
    }

    notify.success(successMessage);
    await loadWorkspace(phone);
  }

  async function depositAdvance(amount: number, paymentMethod: InvoicePaymentMethod, reference: string) {
    if (!view) return;
    await walletRequest(
      "POST",
      {
        phone: view.patient.phone,
        patientName: view.patient.name,
        uhid: view.patient.uhid,
        patientId: view.patient.patientId,
        amount,
        method: paymentMethod,
        reference
      },
      `${formatPaise(Math.round(amount * 100))} deposit recorded`
    );
  }

  async function applyAdvance(amount: number) {
    if (!openInvoice) return;
    await walletRequest(
      "PATCH",
      { action: "apply-advance", invoiceId: openInvoice.id, amount },
      `${formatPaise(Math.round(amount * 100))} advance applied to ${openInvoice.invoiceNo}`
    );
  }

  async function refundAdvance(amount: number, paymentMethod: InvoicePaymentMethod, reason: string) {
    if (!view) return;
    await walletRequest(
      "PATCH",
      { action: "refund", phone: view.patient.phone, amount, method: paymentMethod, reason },
      `${formatPaise(Math.round(amount * 100))} advance refunded`
    );
  }

  async function estimateAction(body: Record<string, unknown>, successMessage: string) {
    if (!phone) return;
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing/estimates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void estimateAction(body, successMessage));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ok: boolean; invoice?: Invoice; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to update this estimate.");
      return;
    }

    notify.success(successMessage, data.invoice ? { description: `Billed as ${data.invoice.invoiceNo}` } : undefined);
    if (data.invoice) setOpenInvoiceId(data.invoice.id);
    await loadWorkspace(phone);
  }

  async function sendInvoice(invoice: Invoice, channel: "Email" | "WhatsApp") {
    // Email needs an address and the patient record may not carry one; asking
    // beats failing, and beats inventing a placeholder.
    const to = channel === "Email" ? window.prompt(`Email ${invoice.invoiceNo} to which address?`)?.trim() : undefined;
    if (channel === "Email" && !to) return;

    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, channel, to })
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void sendInvoice(invoice, channel));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ok: boolean; link?: string; note?: string; delivered?: boolean; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to send this invoice.");
      return;
    }

    if (data.link) {
      window.open(data.link, "_blank", "noopener,noreferrer");
      notify.info("WhatsApp opened with the message ready", { description: data.note });
      return;
    }

    // Never claim delivery when SMTP isn't configured.
    if (data.delivered) notify.success(`${invoice.invoiceNo} emailed to ${to}`);
    else notify.warning("Recorded, but not delivered", { description: data.note });
  }

  async function requestAdjustment(invoice: Invoice, request: AdjustmentRequest) {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, invoiceId: invoice.id })
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void requestAdjustment(invoice, request));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ok: boolean; approval?: { requiredStages: string[] }; error?: string };
    setBusy(false);
    if (!response.ok || !data.ok || !data.approval) {
      notify.error(data.error || "Unable to raise that request.");
      return;
    }

    notify.success(`${request.kind} sent for approval`, {
      description: `Needs sign-off from ${data.approval.requiredStages.join(" then ")}. The bill is unchanged until then.`
    });
  }

  async function collectPayment(invoice: Invoice, payment: InvoicePaymentFormInput) {
    const updated = await patchInvoice({ action: "record-payment", id: invoice.id, ...payment });
    if (updated) {
      const settled = updated.balancePaise <= 0;
      notify.success(settled ? `${updated.invoiceNo} settled in full` : `${formatPaise(Math.round(payment.amount * 100))} received`, {
        description: settled ? undefined : `${formatPaise(updated.balancePaise)} still due`
      });
    }
    await refreshAfter(updated);
    return Boolean(updated);
  }

  return (
    <section aria-label="Billing workspace" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Patient workspace</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          One screen for a patient&apos;s full financial position — outstanding balance, current bill, previous bills, payments and insurance.
        </p>

        <div className="relative mt-3 max-w-lg">
          <label htmlFor="workspace-patient-search" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Find patient
          </label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="workspace-patient-search"
              className={`${fieldClass} pl-9`}
              placeholder="Name, UHID or mobile number"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {matches.length ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-line bg-surface shadow-lg">
              {matches.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => selectPatient(patient.phone, patient.name)}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-soft focus-visible:bg-soft focus-visible:outline-none"
                  >
                    <span className="font-semibold text-ink">{patient.name}</span>
                    <span className="text-xs text-muted">
                      {patient.uhid} · {patient.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {searching && !matches.length ? <p className="mt-1 text-xs text-muted">Searching…</p> : null}
        </div>
      </div>

      <div className="p-4">
        {!phone ? (
          <ModuleEmptyState
            icon={UserSearch}
            title="Search for a patient to begin"
            description="Look them up by name, UHID or mobile number to see their outstanding balance, current bill, previous bills and payment history in one place."
          />
        ) : loading ? (
          <ModuleSkeleton />
        ) : error ? (
          <div className="grid gap-3 rounded border border-line bg-soft/60 p-6 text-center">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <ActionButton variant="secondary" size="sm" className="mx-auto" onClick={() => void loadWorkspace(phone)}>
              Retry
            </ActionButton>
          </div>
        ) : view ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <BillingWorkspaceSummary
              patient={view.patient}
              latestVisit={view.latestVisit}
              totals={view.totals}
              invoices={view.invoices}
              payments={view.payments}
              insuranceClaims={view.insuranceClaims}
              duplicateWarnings={view.duplicateWarnings}
              currentInvoiceId={openInvoice?.id}
              onOpenInvoice={(invoiceId) => {
                setSkipped([]);
                setOpenInvoiceId(invoiceId);
              }}
            />

            <BillingAssistantPanel recommendations={view.recommendations ?? []} />

            <PackageEstimatePanel
              balances={view.packageBalances}
              estimates={view.estimates}
              busy={busy}
              onShare={(estimate) => estimateAction({ action: "share", id: estimate.id }, `${estimate.estimateNo} marked as shared`)}
              onAccept={(estimate, patientSignatureName, acceptanceMethod: AcceptanceMethod) =>
                estimateAction(
                  { action: "accept", id: estimate.id, patientSignatureName, method: acceptanceMethod },
                  `${estimate.estimateNo} accepted by ${patientSignatureName}`
                )
              }
              onConvert={(estimate) => estimateAction({ action: "convert", id: estimate.id }, `${estimate.estimateNo} converted to a bill`)}
            />

            <AdvanceWalletPanel
              wallet={view.wallet}
              summary={view.walletSummary}
              openInvoiceBalancePaise={openInvoice?.balancePaise ?? 0}
              canRefund={canAdjust}
              busy={busy}
              onDeposit={depositAdvance}
              onApply={applyAdvance}
              onRefund={refundAdvance}
            />

            <div className="grid gap-3">
              {openInvoice ? (
                <>
                  <InvoiceCollectionPanel
                    invoice={openInvoice}
                    busy={busy}
                    skipped={skipped}
                    onIssue={issueInvoice}
                    onCollect={collectPayment}
                    onSyncCharges={syncCharges}
                    onRequestAdjustment={requestAdjustment}
                    onSend={sendInvoice}
                    onClose={() => setOpenInvoiceId(null)}
                  />

                  {/*
                    Sticky so the actions stay reachable while the desk scrolls
                    a long itemised bill — an 8-hour-a-day user should never
                    scroll back up to find "collect".
                  */}
                  <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/95 p-3 shadow-sm backdrop-blur">
                    <span className="mr-auto text-sm font-semibold text-ink">
                      Balance due <span className="tabular-nums">{formatPaise(openInvoice.balancePaise)}</span>
                    </span>
                    {openInvoice.visitId ? (
                      <PdfPreviewButton
                        href={`/api/pdf/invoice?visitId=${encodeURIComponent(openInvoice.visitId)}`}
                        title={`Invoice — ${view.patient.name}`}
                        description={`${openInvoice.invoiceNo} · ${formatPaise(openInvoice.totalPaise)}`}
                        label="Preview / print"
                        size="sm"
                        className="min-h-8 px-2 text-xs"
                      />
                    ) : null}
                    {openInvoice.status === "Draft" ? (
                      <ActionButton variant="primary" size="sm" loading={busy} onClick={() => void issueInvoice(openInvoice)}>
                        Issue invoice
                      </ActionButton>
                    ) : null}
                  </div>
                </>
              ) : (
                <ModuleEmptyState
                  icon={UserSearch}
                  title="No bill selected"
                  description="Pick one of this patient's bills on the left to see its charges and collect against it."
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
