import type { LucideIcon } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";

/**
 * Empty state for staff/admin surfaces (Track 1.4). Uses the globally-available
 * site tokens (`border-line`, `bg-soft`, `text-ink`, `text-muted`, `text-brand`)
 * so it renders correctly under StaffChrome, where the `--hos-*` OS-shell tokens
 * are NOT in scope.
 *
 * The sibling `EmptyState` primitive stays reserved for the `.hospital-os-theme`
 * OS shell, which themes itself with `--hos-*`. Two surfaces, two token systems,
 * one shared shape.
 */
type ModuleEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  /** Optional second, lower-emphasis path (P6 contract: primary + secondary). */
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  /** Optional "learn how this module works" link (P6 contract: help link). */
  helpHref?: string;
  helpLabel?: string;
};

export function ModuleEmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
  helpHref,
  helpLabel = "Learn how this works"
}: ModuleEmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center rounded border border-dashed border-line bg-soft/60 p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded border border-line bg-surface text-brand">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
        {action || secondaryAction ? (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {action ? (
              <ActionButton variant="primary" onClick={onAction}>
                {action}
              </ActionButton>
            ) : null}
            {secondaryAction ? (
              <ActionButton variant="secondary" onClick={onSecondaryAction}>
                {secondaryAction}
              </ActionButton>
            ) : null}
          </div>
        ) : null}
        {helpHref ? (
          <p className="mt-3">
            <a href={helpHref} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {helpLabel}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
