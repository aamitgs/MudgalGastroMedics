/**
 * Full-shell-shaped loading skeleton for Hospital OS routes. Shown
 * automatically by Next.js (the `loading.tsx` convention) while a module
 * page's async Server Component resolves (cookies + RBAC context lookup),
 * before HospitalOsShell itself has mounted — so it mirrors the shell's
 * sidebar + top bar + content-grid shape rather than a generic skeleton, to
 * avoid a layout jump once the real shell renders. Also reused by
 * HospitalOsDynamic.tsx for the dashboard's client-only (ssr:false) load.
 */
export function HospitalOsRouteLoading() {
  return (
    <main className="hospital-os-theme min-h-screen bg-mist text-ink">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="flex min-h-screen" aria-hidden="true">
        <aside className="hidden w-[286px] border-r border-line bg-surface p-3 lg:block">
          <div className="h-10 rounded-lg bg-soft" />
          <div className="mt-8 grid gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-10 rounded-lg bg-soft" />
            ))}
          </div>
        </aside>
        <section className="flex-1">
          <div className="h-16 border-b border-line bg-surface" />
          <div className="mx-auto grid max-w-[1560px] grid-cols-[minmax(0,1fr)] gap-5 p-5">
            <div className="h-72 rounded-lg border border-line bg-surface" />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
              <div className="h-96 rounded-lg border border-line bg-surface" />
              <div className="h-96 rounded-lg border border-line bg-surface" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
