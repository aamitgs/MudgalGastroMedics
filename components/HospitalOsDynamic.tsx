"use client";

import dynamic from "next/dynamic";

const HospitalOperatingSystem = dynamic(
  () => import("@/components/HospitalOperatingSystem").then((module) => module.HospitalOperatingSystem),
  {
    ssr: false,
    loading: () => <HospitalOsLoading />
  }
);

export function HospitalOsDynamic() {
  return <HospitalOperatingSystem />;
}

function HospitalOsLoading() {
  return (
    <main className="hospital-os-theme min-h-screen bg-[var(--hos-bg)] text-[var(--hos-text)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[286px] border-r border-[var(--hos-border)] bg-[var(--hos-surface)] p-3 lg:block">
          <div className="h-10 rounded-lg bg-[var(--hos-muted)]" />
          <div className="mt-8 grid gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-10 rounded-lg bg-[var(--hos-muted)]" />
            ))}
          </div>
        </aside>
        <section className="flex-1">
          <div className="h-16 border-b border-[var(--hos-border)] bg-[var(--hos-surface)]" />
          <div className="mx-auto grid max-w-[1560px] gap-5 p-5">
            <div className="h-72 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)]" />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
              <div className="h-96 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)]" />
              <div className="h-96 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
