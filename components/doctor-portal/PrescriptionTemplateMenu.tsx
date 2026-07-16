"use client";

import { BookmarkPlus, ListChecks, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import type { PrescriptionTemplate } from "@/lib/prescription-template-types";

/**
 * Named, curated regimen library ("IBS-D", "H. pylori triple therapy",
 * "post-ERCP") — distinct from PrescriptionField's existing FavouriteChips,
 * which only surface text the doctor has already typed identically before.
 * Shared across whoever can edit prescriptions (single-doctor practice today,
 * not a personal per-user list).
 */
export function PrescriptionTemplateMenu({ draft, onInsert }: { draft: string; onInsert: (text: string) => void }) {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/prescription-templates", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!cancelled && response.ok && data?.ok) setTemplates(data.templates);
      } catch {
        // Non-critical — the field still works with a blank template list.
      }
    }
    if (open) void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function saveTemplate() {
    if (!name.trim() || !draft.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/prescription-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tag: tag.trim() || undefined, prescriptionText: draft })
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
      const response = await fetch("/api/prescription-templates", {
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
          <ListChecks size={14} /> Templates
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-sm font-bold text-ink">Prescription templates</p>
        <div className="grid max-h-56 gap-1.5 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="py-2 text-xs text-muted">No templates saved yet.</p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="flex items-center gap-2 rounded border border-line bg-soft/50 px-2.5 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onInsert(template.prescriptionText);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                  title={template.prescriptionText}
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
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink"><BookmarkPlus size={13} /> Save current prescription as a template</p>
          <div className="grid gap-1.5">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name (e.g. IBS-D)"
              disabled={!draft.trim()}
              className="rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:bg-soft disabled:text-muted"
            />
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Tag (optional, e.g. GI)"
              disabled={!draft.trim()}
              className="rounded border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:bg-soft disabled:text-muted"
            />
            <ActionButton variant="primary" size="sm" loading={saving} disabled={!draft.trim() || !name.trim()} onClick={() => void saveTemplate()}>
              Save template
            </ActionButton>
          </div>
          {!draft.trim() ? <p className="mt-1.5 text-xs text-muted">Write a prescription first, then save it here.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
