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
    <div className="relative overflow-hidden rounded border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,254,255,0.92))] p-3 shadow-[0_28px_80px_rgba(8,64,84,0.16)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-teal" />
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-100/60" />
      <div className="relative grid gap-3 lg:grid-cols-5">
        {stats.map(({ target, label, detail, icon: Icon }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded border border-line/80 bg-white/82 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-soft"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded border border-line bg-soft text-brand transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                <Icon size={19} />
              </span>
            </div>
            <strong className="block text-4xl font-bold leading-none text-brand md:text-5xl">
              <Counter target={target} />
            </strong>
            <span className="mt-4 block text-base font-semibold leading-snug text-ink">{label}</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
