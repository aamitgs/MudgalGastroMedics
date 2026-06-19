import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
};

export function Section({ children, className = "", muted = false, id }: SectionProps) {
  return (
    <section id={id} className={`py-16 md:py-20 ${muted ? "bg-soft" : "bg-white"} ${className}`}>
      <div className="mx-auto w-[min(1160px,calc(100%-32px))]">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">{children}</p>;
}

export function SectionHead({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">{title}</h2>
      </div>
      {children ? <div className="max-w-xl text-muted">{children}</div> : null}
    </div>
  );
}
