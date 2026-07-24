"use client";

import { BookmarkPlus, ClipboardList, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import type { ClinicalTemplate } from "@/lib/clinical-template-types";

export type ClinicalTemplateFields = {
  diagnosis: string;
  history: string;
  generalExamination: string;
  perAbdomen: string;
  investigationAdvice: string;
  clinicalNote: string;
};

/**
 * Diagnosis-triggered documentation bundle (GERD, IBS, Fatty Liver...) — one
 * click fills History/Examination/Diagnosis/Advice+Investigation/Clinical
 * Note at once. Ships with a curated GI/hepatology starter set (seeded
 * server-side on first load) and doctors can save/delete their own from
 * there, same shared-library pattern as PrescriptionTemplateMenu.
 */
export function ClinicalTemplateMenu({
  currentFields,
  onApply
}: {
  currentFields: ClinicalTemplateFields;
  onApply: (template: ClinicalTemplate) => void;
}) {
  const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/clinical-templates", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!cancelled && response.ok && data?.ok) setTemplates(data.templates);
      } catch {
        // Non-critical — the picker still opens with a blank list.
      }
    }
    if (open) void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hasContentToSave = Boolean(currentFields.diagnosis.trim());

  async function saveTemplate() {
    if (!name.trim() || !hasContentToSave) return;
    setSaving(true);
    try {
      const response = await fetch("/api/clinical-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tag: tag.trim() || undefined, ...currentFields })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        notify.error(data.error || "Unable to save template.");
        return;
      }
      setTemplates((current) => [data.template, ...current]);
      setName("");
      setTag("");
      notify.success(`Saved "${data.template.name}" as a template`);
    } catch {
      notify.error("Unable to reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string, templateName: string) {
    const previous = templates;
    setTemplates((current) => current.filter((item) => item.id !== id));
    try {
      const response = await fetch("/api/clinical-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setTemplates(previous);
        notify.error(data.error || "Unable to delete template.");
        return;
      }
      notify.success(`Deleted "${templateName}"`);
    } catch {
      setTemplates(previous);
      notify.error("Unable to reach the server. Try again.");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ActionButton variant="outline" size="sm" className="gap-1.5 text-xs">
          <ClipboardList size={14} /> Clinical Templates
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-sm font-bold text-ink">Clinical templates</p>
        <p className="mb-2 text-xs text-muted">Fills empty fields only — never overwrites what you&apos;ve already written. Review and edit after applying.</p>
        <div className="grid max-h-56 gap-1.5 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="py-2 text-xs text-muted">No templates saved yet.</p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="flex items-center gap-2 rounded border border-line bg-soft/50 px-2.5 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onApply(template);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                  title={template.diagnosis}
                >
                  <span className="block truncate text-sm font-semibold text-ink">{template.name}</span>
                  {template.tag ? <span className="text-xs text-muted">{template.tag}</span> : null}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTemplate(template.id, template.name)}
                  aria-label={`Delete template ${template.name}`}
                  className="shrink-0 text-muted hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-line pt-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink"><BookmarkPlus size={13} /> Save this visit&apos;s fields as a template</p>
          <div className="grid gap-1.5">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name (e.g. IBS-D)"
              disabled={!hasContentToSave}
              className="rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:bg-soft disabled:text-muted"
            />
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Tag (optional, e.g. GI)"
              disabled={!hasContentToSave}
              className="rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:bg-soft disabled:text-muted"
            />
            <ActionButton variant="primary" size="sm" loading={saving} disabled={!hasContentToSave || !name.trim()} onClick={() => void saveTemplate()}>
              Save template
            </ActionButton>
          </div>
          {!hasContentToSave ? <p className="mt-1.5 text-xs text-muted">Save a diagnosis first, then save it here.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
