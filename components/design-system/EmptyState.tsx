import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[var(--hos-border)] bg-[var(--hos-muted)] p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] text-[var(--hos-primary)]">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-[var(--hos-text)]">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--hos-muted-text)]">{description}</p>
        <Button type="button" onClick={onAction} className="mt-5 bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">
          {action}
        </Button>
      </div>
    </div>
  );
}
