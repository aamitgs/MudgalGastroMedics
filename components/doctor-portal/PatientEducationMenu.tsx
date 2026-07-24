"use client";

import { BookOpen, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import type { OpdVisit } from "@/lib/opd-types";
import { getPatientEducationSheets, type PatientEducationSheet } from "@/lib/patient-education-sheets";
import { site } from "@/lib/site-data";

/**
 * Diagnosis-based patient handouts (Track: patient education sheets) — one
 * click to Preview/Print/Download (PdfPreviewButton, same as every other
 * PDF in this app), WhatsApp (pre-filled text — wa.me has no file-attach
 * scheme, so the message carries the guidance itself, not just a link) or
 * Email (server-rendered PDF attachment to the patient's address on file).
 */
export function PatientEducationMenu({ visit }: { visit: OpdVisit }) {
  const [open, setOpen] = useState(false);
  const [emailingKey, setEmailingKey] = useState<string | null>(null);
  const sheets = getPatientEducationSheets();

  function whatsAppHref(sheet: PatientEducationSheet) {
    const text = [`*${sheet.title}*`, "", ...sheet.points.map((point) => `• ${point}`), "", `— ${site.name}`].join("\n");
    return `https://wa.me/${visit.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }

  async function emailSheet(key: string) {
    setEmailingKey(key);
    try {
      const response = await fetch("/api/pdf/patient-education/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, sheet: key })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        notify.error(data.error || "Unable to email this sheet.");
        return;
      }
      notify.success(`Emailed to ${data.sentTo}`);
    } catch {
      notify.error("Unable to reach the server.");
    } finally {
      setEmailingKey(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ActionButton type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
          <BookOpen size={14} /> Patient Education
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <p className="mb-2 text-sm font-bold text-ink">Patient education sheets</p>
        <p className="mb-2 text-xs text-muted">Diet, lifestyle and procedure-prep handouts to send home with the patient.</p>
        <div className="grid max-h-80 gap-1.5 overflow-y-auto">
          {sheets.map((sheet) => (
            <div key={sheet.key} className="flex items-center justify-between gap-2 rounded border border-line bg-soft/50 p-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink" title={sheet.title}>{sheet.title}</span>
              <div className="flex shrink-0 items-center gap-1">
                <PdfPreviewButton
                  href={`/api/pdf/patient-education?visitId=${encodeURIComponent(visit.id)}&sheet=${encodeURIComponent(sheet.key)}`}
                  filename={`${sheet.key}-${visit.token}.pdf`}
                  title={sheet.title}
                  label="View"
                  variant="ghost"
                  size="sm"
                />
                <a
                  href={whatsAppHref(sheet)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share ${sheet.title} via WhatsApp`}
                  title="Share via WhatsApp"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded text-muted transition hover:bg-soft hover:text-brand"
                >
                  <MessageCircle size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => void emailSheet(sheet.key)}
                  disabled={emailingKey === sheet.key}
                  aria-label={`Email ${sheet.title}`}
                  title="Email to patient"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded text-muted transition hover:bg-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mail size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
