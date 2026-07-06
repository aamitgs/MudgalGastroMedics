import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  onAction?: () => void;
  /** Optional second, lower-emphasis path (P6 contract: primary + secondary). */
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  /** Optional "learn how this module works" link (P6 contract: help link). */
  helpHref?: string;
  helpLabel?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
  helpHref,
  helpLabel = "Learn how this works"
}: EmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[var(--hos-border)] bg-[var(--hos-muted)] p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] text-[var(--hos-primary)]">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-[var(--hos-text)]">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--hos-muted-text)]">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={onAction} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">
            {action}
          </Button>
          {secondaryAction ? (
            <Button type="button" variant="outline" onClick={onSecondaryAction} className="border-[var(--hos-border)] text-[var(--hos-text)]">
              {secondaryAction}
            </Button>
          ) : null}
        </div>
        {helpHref ? (
          <p className="mt-3">
            <a href={helpHref} className="text-sm font-semibold text-[var(--hos-primary)] underline-offset-4 hover:underline">
              {helpLabel}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
