"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  ["24", "Advanced Endoscopy Services"],
  ["360", "Comprehensive Liver Care"],
  ["5", "Modern Diagnostic Facilities"],
  ["12", "Specialized Gastroenterology Care"],
  ["100", "Personalized Treatment Plans"]
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(([target, label]) => (
        <div key={label} className="rounded border border-line bg-white p-5 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
          <strong className="block text-4xl font-black leading-none text-brand">
            <Counter target={target} />
          </strong>
          <span className="mt-3 block font-extrabold leading-snug text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
