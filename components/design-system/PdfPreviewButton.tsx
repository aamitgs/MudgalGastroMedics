"use client";

import { Download, Eye, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { ActionButton, type ActionButtonSize, type ActionButtonVariant } from "@/components/design-system/ActionButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Shared "preview before you commit to a download" trigger for every
 * single-record PDF this app generates (receipt, prescription, referral
 * letter, medical certificate, discharge summary, purchase order) — the
 * previous pattern was a bare download link per call site, so staff had to
 * save a file to disk just to check it looked right. All six PDF routes
 * (app/api/pdf/*) now serve Content-Disposition: inline so the iframe below
 * renders them directly; the Download button's `download` attribute still
 * forces a save regardless of that header.
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <ActionButton variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <Eye size={14} /> {label}
      </ActionButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
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
