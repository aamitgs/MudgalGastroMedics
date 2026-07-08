import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * The shared staff-facing button (Track 1.3). Encodes the app's own button
 * language — cyan-gradient primary, emerald success, soft-outline secondary,
 * red danger, ghost — with unified hover / focus / disabled / loading states,
 * so modules stop hand-rolling 40+ variations of the same Tailwind strings.
 *
 * Deliberately NOT the shadcn `ui/button`: that primitive's theme (near-black
 * `default`) does not match this product's visual language. This is the one
 * source of truth for staff action buttons.
 */
export type ActionButtonVariant = "primary" | "success" | "warning" | "secondary" | "danger" | "ghost" | "outline";
export type ActionButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20";

const sizes: Record<ActionButtonSize, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-9 px-4",
  lg: "min-h-11 px-5"
};

const variants: Record<ActionButtonVariant, string> = {
  primary:
    "border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)] hover:-translate-y-0.5",
  success:
    "border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)] hover:-translate-y-0.5",
  warning:
    "border border-amber-300 dark:border-amber-800/40 bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/25",
  secondary: "border border-line bg-soft text-ink hover:border-brand hover:text-brand",
  danger: "border border-red-600 bg-red-600 text-white hover:bg-red-700",
  ghost: "text-muted hover:bg-soft hover:text-brand",
  outline: "border border-line text-muted hover:border-brand hover:text-brand"
};

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  loading?: boolean;
};

export function ActionButton({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
