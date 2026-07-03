import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "danger";
};

const toneClass: Record<MetricCardProps["tone"], string> = {
  primary: "text-[var(--hos-primary)]",
  success: "text-[var(--hos-success)]",
  warning: "text-[var(--hos-warning)]",
  danger: "text-[var(--hos-danger)]"
};

export function MetricCard({ label, value, delta, icon: Icon, tone }: MetricCardProps) {
  return (
    <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)] shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Icon className={toneClass[tone]} size={21} />
          <span className="text-xs font-medium text-[var(--hos-muted-text)]">{delta}</span>
        </div>
        <p className="mt-4 text-2xl font-semibold leading-none text-[var(--hos-text)]">{value}</p>
        <p className="mt-2 text-xs font-semibold uppercase text-[var(--hos-muted-text)]">{label}</p>
      </CardContent>
    </Card>
  );
}
