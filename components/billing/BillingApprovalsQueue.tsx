"use client";

import { AlertTriangle, Check, ClipboardCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ApprovalStage, BillingApproval } from "@/lib/billing-approval-types";
import { formatPaise } from "@/lib/billing-calc";
import { notify } from "@/lib/notify";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";

type QueuedApproval = BillingApproval & { progressLabel: string; awaitingStage: ApprovalStage | null };

type ApprovalsResponse = {
  ok: boolean;
  approvals?: QueuedApproval[];
  actorStages?: ApprovalStage[];
  actorName?: string;
  error?: string;
};

const statusTone: Record<BillingApproval["status"], BadgeTone> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "critical"
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * The sign-off queue for discounts, refunds and cancellations (Track 5.6).
 *
 * Shows every request, not just the ones this user can act on: an approver
 * needs to see what is stuck at another stage, and a requester needs to see
 * where their own request has got to. Actions appear only on rows the viewer
 * can genuinely sign, so nobody is offered a button that would be refused.
 */
export function BillingApprovalsQueue() {
  const [approvals, setApprovals] = useState<QueuedApproval[]>([]);
  const [actorStages, setActorStages] = useState<ApprovalStage[]>([]);
  const [actorName, setActorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    let response: Response;
    try {
      response = await fetch(`/api/billing/approvals?pendingOnly=${pendingOnly}`, { cache: "no-store" });
    } catch {
      setError("Unable to reach the server. Check your connection and retry.");
      setLoading(false);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as ApprovalsResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load the approval queue.");
      setLoading(false);
      return;
    }

    setApprovals(data.approvals ?? []);
    setActorStages(data.actorStages ?? []);
    setActorName(data.actorName ?? "");
    setLoading(false);
  }, [pendingOnly]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function decide(approval: QueuedApproval, decision: "Approved" | "Rejected") {
    setBusyId(approval.id);
    let response: Response;
    try {
      response = await fetch("/api/billing/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: approval.id, decision, note: notes[approval.id] })
      });
    } catch {
      setBusyId(null);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void decide(approval, decision));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ok: boolean; approval?: QueuedApproval; error?: string };
    setBusyId(null);
    if (!response.ok || !data.ok || !data.approval) {
      notify.error(data.error || "Unable to record that decision.");
      return;
    }

    const updated = data.approval;
    if (updated.applyError) {
      // Approved but the effect failed — say so loudly rather than letting it
      // sit as an approved request that never happened.
      notify.error(`Approved, but applying it failed: ${updated.applyError}`);
    } else if (decision === "Rejected") {
      notify.success(`${updated.kind} request rejected`);
    } else if (updated.status === "Approved") {
      notify.success(`${updated.kind} approved and applied`, { description: `${updated.invoiceNo} · ${formatPaise(updated.amountPaise)}` });
    } else {
      notify.success(`Signed — ${updated.progressLabel}`);
    }

    setNotes((current) => ({ ...current, [approval.id]: "" }));
    await load();
  }

  const alreadySigned = (approval: QueuedApproval) => approval.decisions.some((decision) => decision.by === actorName);

  /** Mirrors the server's `canDecide` so no row offers a button that would be refused. */
  const canSign = (approval: QueuedApproval) =>
    approval.status === "Pending" &&
    approval.awaitingStage !== null &&
    actorStages.includes(approval.awaitingStage) &&
    approval.requestedBy !== actorName &&
    !alreadySigned(approval);

  return (
    <section aria-label="Billing approvals" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Approvals</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Discounts, refunds and cancellations awaiting sign-off. Approving the last required stage applies the change immediately.
          </p>
        </div>
        <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(event) => setPendingOnly(event.target.checked)}
            className="size-4 accent-[var(--site-brand)]"
          />
          Pending only
        </label>
      </div>

      <div className="p-4">
        {loading ? (
          <ModuleSkeleton rows={3} tiles={0} />
        ) : error ? (
          <div className="grid gap-3 rounded border border-line bg-soft/60 p-6 text-center">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <ActionButton variant="secondary" size="sm" className="mx-auto" onClick={() => void load()}>
              Retry
            </ActionButton>
          </div>
        ) : approvals.length === 0 ? (
          <ModuleEmptyState
            icon={ClipboardCheck}
            title={pendingOnly ? "Nothing awaiting approval" : "No approval requests yet"}
            description={
              pendingOnly
                ? "Discount, refund and cancellation requests raised from a bill appear here for Accounts and Admin sign-off."
                : "When someone requests a discount, refund or cancellation on a bill, it appears here with its full decision trail."
            }
            action={pendingOnly ? "Show settled requests too" : undefined}
            onAction={pendingOnly ? () => setPendingOnly(false) : undefined}
          />
        ) : (
          <ul className="grid gap-3">
            {approvals.map((approval) => (
              <li key={approval.id} className="grid gap-2 rounded border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      {approval.kind}
                      {approval.discountType ? <span className="text-xs font-semibold text-muted">{approval.discountType}</span> : null}
                      <StatusBadge tone={statusTone[approval.status]} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {approval.status}
                      </StatusBadge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {approval.patientName} · <span className="font-mono">{approval.invoiceNo}</span>
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-ink">{formatPaise(approval.amountPaise)}</p>
                </div>

                <p className="text-sm text-ink">{approval.reason}</p>
                <p className="text-xs text-muted">
                  Requested by {approval.requestedBy} · {timeLabel(approval.requestedAt)} · <span className="font-semibold">{approval.progressLabel}</span>
                </p>

                {approval.decisions.length ? (
                  <ul className="grid gap-1 border-t border-line pt-2">
                    {approval.decisions.map((entry) => (
                      <li key={`${entry.stage}-${entry.at}`} className="text-xs text-muted">
                        <span className={`font-bold ${entry.decision === "Approved" ? "text-teal-dark" : "text-coral"}`}>
                          {entry.stage} {entry.decision.toLowerCase()}
                        </span>{" "}
                        by {entry.by} · {timeLabel(entry.at)}
                        {entry.note ? ` — ${entry.note}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {approval.applyError ? (
                  <p className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-ink dark:border-red-900 dark:bg-red-950">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    Approved, but applying it failed: {approval.applyError}
                  </p>
                ) : null}

                {canSign(approval) ? (
                  <div className="grid gap-2 border-t border-line pt-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <input
                      aria-label={`Note on ${approval.kind} for ${approval.invoiceNo}`}
                      className="min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                      placeholder="Note (optional)"
                      value={notes[approval.id] ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [approval.id]: event.target.value }))}
                    />
                    <ActionButton variant="success" size="sm" loading={busyId === approval.id} onClick={() => void decide(approval, "Approved")}>
                      <Check size={14} /> Approve
                    </ActionButton>
                    <ActionButton variant="danger" size="sm" loading={busyId === approval.id} onClick={() => void decide(approval, "Rejected")}>
                      <X size={14} /> Reject
                    </ActionButton>
                  </div>
                ) : approval.status === "Pending" ? (
                  <p className="border-t border-line pt-2 text-xs text-muted">
                    {approval.requestedBy === actorName
                      ? "You raised this request, so someone else must approve it."
                      : alreadySigned(approval)
                        ? `You have already signed this — the ${approval.awaitingStage} signature must come from someone else.`
                        : `Waiting on ${approval.awaitingStage} sign-off.`}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
