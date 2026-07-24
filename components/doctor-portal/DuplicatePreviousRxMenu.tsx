"use client";

import { CopyPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { newItemId } from "@/components/doctor-portal/PrescriptionField";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PrescriptionItem } from "@/lib/opd-types";

type PreviousRxResponse = { ok: boolean; items?: PrescriptionItem[]; visitDate?: string | null; error?: string };
type Decision = "Continue" | "Modify" | "Stop";
const decisions: Decision[] = ["Continue", "Modify", "Stop"];

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Medication reconciliation (Track: dynamic prescription builder) — brings
 * up the patient's last prescription so the doctor dispositions each
 * medicine as Continue (carried forward unchanged), Modify (carried
 * forward, doctor edits dose/duration in the table after adding) or Stop
 * (discontinued — not added). Adds rows to the existing Rx table rather
 * than replacing it, same as any other quick-add path (favourites, templates).
 */
export function DuplicatePreviousRxMenu({
  phone,
  excludeVisitId,
  disabled,
  onApply
}: {
  phone: string;
  excludeVisitId: string;
  disabled?: boolean;
  onApply: (items: PrescriptionItem[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PrescriptionItem[] | null>(null);
  const [visitDate, setVisitDate] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [picks, setPicks] = useState<Record<string, Decision>>({});

  useEffect(() => {
    if (!open || items !== null) return;
    let active = true;
    fetch(`/api/opd/previous-prescription?phone=${encodeURIComponent(phone)}&excludeVisitId=${encodeURIComponent(excludeVisitId)}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((data: PreviousRxResponse) => {
        if (!active) return;
        if (!data.ok || !data.items) {
          setError(data.error || "Unable to load the previous prescription.");
          return;
        }
        setItems(data.items);
        setVisitDate(data.visitDate ?? null);
        setPicks(Object.fromEntries(data.items.map((item) => [item.id, "Continue" as Decision])));
      })
      .catch(() => {
        if (active) setError("Unable to reach the server.");
      });
    return () => {
      active = false;
    };
  }, [open, items, phone, excludeVisitId]);

  function apply() {
    if (!items) return;
    const toAdd = items
      .filter((item) => picks[item.id] !== "Stop")
      .map((item) => ({ ...item, id: newItemId(), status: picks[item.id] === "Modify" ? ("Modify" as const) : ("Continue" as const) }));
    if (toAdd.length) onApply(toAdd);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ActionButton type="button" variant="outline" size="sm" className="gap-1.5 text-xs" disabled={disabled}>
          <CopyPlus size={14} /> Duplicate Previous Rx
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <p className="text-sm font-bold text-ink">Previous prescription</p>
        {visitDate ? <p className="mb-2 text-xs text-muted">From visit on {formatVisitDate(visitDate)}</p> : null}
        {error ? <p className="py-2 text-xs text-muted">{error}</p> : null}
        {!error && items === null ? <p className="py-2 text-xs text-muted">Loading…</p> : null}
        {!error && items?.length === 0 ? <p className="py-2 text-xs text-muted">No previous prescription found for this patient.</p> : null}
        {items?.length ? (
          <div className="grid max-h-72 gap-2 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="rounded border border-line bg-soft/50 p-2">
                <p className="truncate text-sm font-semibold text-ink" title={item.medicine}>
                  {item.medicine} {item.strength ? <span className="font-normal text-muted">{item.strength}</span> : null}
                </p>
                <div className="mt-1.5 flex gap-1.5">
                  {decisions.map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      onClick={() => setPicks((current) => ({ ...current, [item.id]: decision }))}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold transition ${
                        picks[item.id] === decision
                          ? decision === "Stop"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                            : "border-brand bg-brand/10 text-brand"
                          : "border-line bg-white text-muted hover:border-brand hover:text-brand"
                      }`}
                    >
                      {decision}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {items?.length ? (
          <ActionButton variant="primary" size="sm" className="mt-3 w-full" onClick={apply}>
            Add to prescription
          </ActionButton>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
