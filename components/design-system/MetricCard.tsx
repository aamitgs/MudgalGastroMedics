import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "danger";
};

const toneClass: Record<MetricCardProps["tone"], string> = {
  primary: "text-brand",
  success: "text-teal",
  warning: "text-gold",
  danger: "text-coral"
};

export function MetricCard({ label, value, delta, icon: Icon, tone }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <Icon className={toneClass[tone]} size={21} />
        <span className="text-xs font-medium text-muted">{delta}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase text-muted">{label}</p>
    </div>
  );
}
