"use client";

import { Activity, ClipboardCheck, Microscope, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { target: "24", label: "Advanced Endoscopy Services", detail: "Diagnostic and therapeutic procedures", icon: Stethoscope },
  { target: "360", label: "Comprehensive Liver Care", detail: "Focused hepatology support", icon: ShieldCheck },
  { target: "5", label: "Modern Diagnostic Facilities", detail: "Clinical evaluation infrastructure", icon: Microscope },
  { target: "12", label: "Specialized Gastroenterology Care", detail: "Digestive and pancreato-biliary care", icon: Activity },
  { target: "100", label: "Personalized Treatment Plans", detail: "Patient-specific care planning", icon: ClipboardCheck }
];

function Counter({ target }: { target: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const goal = Number(target);
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1100, 1);
        setValue(Math.round(goal * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{value}+</span>;
}

export function Stats() {
  return (
    <div className="relative isolate overflow-hidden rounded-[34px] bg-[linear-gradient(115deg,#0891b2_0%,#6ca88a_30%,#d39a2b_48%,#10b981_72%,#8de5d7_100%)] p-[3px] shadow-[0_34px_90px_rgba(8,64,84,0.16)]">
      <div className="relative overflow-hidden rounded-[31px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(236,254,255,0.5)_48%,rgba(255,255,255,0.7))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-34px_90px_rgba(8,64,84,0.06)] backdrop-blur-2xl md:p-5">
        <div aria-hidden="true" className="absolute inset-0 bg-white/42" />
        <div aria-hidden="true" className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div aria-hidden="true" className="absolute left-[35%] -top-28 h-72 w-72 rounded-full bg-gold/18 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-teal/20 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42),transparent_38%,rgba(8,145,178,0.08))]" />

      <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ target, label, detail, icon: Icon }) => (
          <div
            key={label}
            className="group relative min-h-[218px] overflow-hidden rounded-[24px] border border-white/80 bg-white/58 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-24px_70px_rgba(8,64,84,0.055),0_18px_42px_rgba(8,64,84,0.09)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-cyan-100 hover:bg-white/72 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_28px_70px_rgba(8,64,84,0.16)]"
          >
            <div aria-hidden="true" className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-cyan-200/30 blur-2xl transition group-hover:bg-cyan-200/45" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),transparent)]" />
            <div aria-hidden="true" className="absolute inset-3 rounded-[19px] border border-white/45" />
            <div className="relative mb-8 flex items-center justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[18px] border border-cyan-100/80 bg-cyan-50/70 text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(8,64,84,0.08)] transition group-hover:border-brand/30 group-hover:bg-white group-hover:text-teal-dark">
                <Icon size={19} />
              </span>
            </div>
            <strong className="relative block text-5xl font-black leading-none tracking-tight text-brand-dark md:text-6xl">
              <Counter target={target} />
            </strong>
            <span className="relative mt-5 block text-lg font-black leading-snug text-ink">{label}</span>
            <span className="relative mt-3 block text-base font-semibold leading-relaxed text-muted">{detail}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
