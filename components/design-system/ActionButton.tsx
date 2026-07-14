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
    "border border-cyan-300 dark:border-cyan-800/20 bg-[image:var(--site-brand-gradient)] text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)] hover:-translate-y-0.5",
  success:
    "border border-teal/30 bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] text-white shadow-[0_18px_42px_rgba(5,150,105,0.24)] hover:-translate-y-0.5",
  warning:
    "border border-gold/35 bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold/25",
  secondary: "border border-line bg-soft text-ink hover:border-brand hover:text-brand",
  danger: "border border-coral bg-coral text-white hover:bg-coral/90",
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
