import type { LucideIcon } from "lucide-react";

type PlatformFeatureCardProps = {
  title: string;
  text: string;
  tag?: string;
  icon: LucideIcon;
};

export function PlatformFeatureCard({ title, text, tag, icon: Icon }: PlatformFeatureCardProps) {
  return (
    <article className="group relative isolate h-full overflow-hidden rounded border border-line/80 bg-white p-6 shadow-[0_18px_55px_rgba(8,64,84,0.08)] transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-teal" />
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded bg-soft text-brand transition group-hover:bg-brand group-hover:text-white">
          <Icon size={21} />
        </span>
        {tag ? <span className="rounded-full border border-line bg-soft/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-dark">{tag}</span> : null}
      </div>
      <h3 className="mt-7 text-2xl font-bold leading-tight text-ink">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{text}</p>
    </article>
  );
}
