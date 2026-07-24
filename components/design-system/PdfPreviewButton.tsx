"use client";

import { Download, Eye, Minimize2, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { ActionButton, type ActionButtonSize, type ActionButtonVariant } from "@/components/design-system/ActionButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Shared "preview before you commit to a download" trigger for every
 * single-record PDF this app generates (receipt, prescription, referral
 * letter, medical certificate, discharge summary, purchase order, patient
 * education sheets) — the previous pattern was a bare download link per
 * call site, so staff had to save a file to disk just to check it looked
 * right. All PDF routes (app/api/pdf/*) serve Content-Disposition: inline
 * so the iframe below renders them directly; the Download button's
 * `download` attribute still forces a save regardless of that header.
 *
 * Opens full-screen by default (Track: full-screen preview everywhere) so a
 * last-minute check before printing/sending doesn't need to squint at a
 * postage-stamp iframe — one shared change here covers every call site.
 * "Restore" shrinks back to a compact centered dialog for a quick glance.
 */
export function PdfPreviewButton({
  href,
  filename,
  title,
  description,
  label = "Preview",
  variant = "outline",
  size = "sm",
  className
}: {
  /** The inline-serving PDF route, e.g. /api/pdf/invoice?visitId=... */
  href: string;
  /** Suggested filename for the Download button — matches what the API route names the file. */
  filename?: string;
  title: string;
  description?: string;
  label?: string;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <ActionButton
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          setFullScreen(true);
          setOpen(true);
        }}
      >
        <Eye size={14} /> {label}
      </ActionButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={fullScreen ? "flex h-[95vh] max-h-[95vh] w-[98vw] max-w-[98vw] flex-col sm:max-w-[98vw]" : "flex max-h-[90vh] max-w-4xl flex-col sm:max-w-4xl"}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 pr-8">
              <div className="min-w-0">
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </div>
              {fullScreen ? (
                <button
                  type="button"
                  onClick={() => setFullScreen(false)}
                  aria-label="Exit full screen"
                  title="Exit full screen"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  <Minimize2 size={13} /> Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFullScreen(true)}
                  aria-label="Full screen"
                  title="Full screen"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  <Eye size={13} /> Full Screen
                </button>
              )}
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded border border-line bg-soft/40">
            {/* Mounted only while open — no reason to keep re-fetching/rendering a hidden PDF in the background. */}
            {open ? <iframe ref={iframeRef} src={href} title={title} className="h-full min-h-[60vh] w-full" /> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <a
              href={href}
              download={filename}
              className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-soft px-4 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <Download size={16} /> Download
            </a>
            <ActionButton variant="primary" onClick={() => iframeRef.current?.contentWindow?.print()}>
              <Printer size={16} /> Print
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
