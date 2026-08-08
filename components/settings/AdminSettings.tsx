"use client";

import { AlertTriangle, Building2, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { sectionAccess, type HospitalOsSection } from "@/lib/hospital-os-data";
import type { ProductionCheck, ProductionCheckStatus } from "@/lib/production-readiness";
import { fullAddress, site } from "@/lib/site-data";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { ScrollHintRegion } from "@/components/design-system/ScrollHintRegion";
import { getStatusToneClass } from "@/components/design-system/StatusBadge";

type ReadinessResponse = {
  ok: boolean;
  readiness?: { checks: ProductionCheck[] };
  error?: string;
};

const sectionLabels: Record<HospitalOsSection, string> = {
  clinicalWorkspace: "Clinical consultation workspace",
  patientFlow: "Patient flow / operations table"
};

const integrationAreas = new Set<ProductionCheck["area"]>(["Integrations", "Operations", "Compliance"]);

function statusTone(status: ProductionCheckStatus) {
  if (status === "pass") return getStatusToneClass("success");
  if (status === "warn") return getStatusToneClass("warning");
  return getStatusToneClass("critical");
}

export function AdminSettings() {
  const [checks, setChecks] = useState<ProductionCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadIntegrationStatus() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/production/readiness", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ReadinessResponse;
    if (!response.ok || !data.ok || !data.readiness) {
      setError(data.error || "Unable to load integration status.");
      setLoading(false);
      return;
    }
    setChecks(data.readiness.checks.filter((check) => integrationAreas.has(check.area)));
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialIntegrationStatus() {
      const response = await fetch("/api/production/readiness", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ReadinessResponse;
      if (!active) return;
      if (!response.ok || !data.ok || !data.readiness) {
        setError(data.error || "Unable to load integration status.");
        setLoading(false);
        return;
      }
      setChecks(data.readiness.checks.filter((check) => integrationAreas.has(check.area)));
      setLoading(false);
    }

    void loadInitialIntegrationStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Settings</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Hospital profile, branches and access reference</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Read-only reference for staff. Staff and role assignment lives in HR; production/security config lives in the readiness report below.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 border-b border-line p-4 lg:grid-cols-2">
        <div className="rounded border border-line bg-soft/60 p-4">
          <p className="flex items-center gap-2 text-lg font-bold text-ink"><Building2 size={19} /> Hospital profile</p>
          <p className="mt-1 text-xs text-muted">Sourced from <code>lib/site-data.ts</code>. Update there and redeploy to change public-facing details.</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-bold text-ink">Name</dt><dd className="text-muted">{site.name}</dd></div>
            <div><dt className="font-bold text-ink">Tagline</dt><dd className="text-muted">{site.tagline}</dd></div>
            <div><dt className="font-bold text-ink">Address</dt><dd className="text-muted">{fullAddress}</dd></div>
            <div><dt className="font-bold text-ink">Phone</dt><dd className="text-muted">{site.phone}</dd></div>
            <div><dt className="font-bold text-ink">WhatsApp</dt><dd className="text-muted">+{site.whatsapp}</dd></div>
            <div><dt className="font-bold text-ink">Email</dt><dd className="text-muted">{site.email}</dd></div>
          </dl>
        </div>

        <div className="rounded border border-line bg-soft/60 p-4">
          <p className="flex items-center gap-2 text-lg font-bold text-ink"><MapPin size={19} /> Branches &amp; locations</p>
          <p className="mt-1 text-xs text-muted">Multi-branch switching is stubbed for v1 and not connected to a backend, matching the Hospital OS branch switcher.</p>
          <div className="mt-4 rounded border border-line bg-surface p-4">
            <p className="font-bold text-ink">Agra Main</p>
            <p className="mt-1 text-sm text-muted">{fullAddress}</p>
            <span className="mt-2 inline-block rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold text-teal-dark">Active branch</span>
          </div>
        </div>
      </div>

      <div className="border-b border-line p-4">
        <p className="flex items-center gap-2 text-lg font-bold text-ink"><ShieldCheck size={19} /> Hospital OS role access reference</p>
        <p className="mt-1 text-xs text-muted">Which staff roles see which Hospital OS sections. Enforced in the Hospital OS sidebar, content sections and command palette.</p>
        <ScrollHintRegion className="mt-4 rounded border border-line" scrollerClassName="rounded">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-soft text-xs font-black uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="p-3">Section</th>
                <th className="p-3">Roles with access</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(sectionAccess) as HospitalOsSection[]).map((section) => (
                <tr key={section} className="border-t border-line">
                  <td className="p-3 font-semibold text-ink">{sectionLabels[section]}</td>
                  <td className="p-3 text-muted">{sectionAccess[section].join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHintRegion>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-ink">Notification &amp; integration channels</p>
          <ActionButton variant="secondary" onClick={() => void loadIntegrationStatus()} className="px-3 text-sm">
            <RefreshCw size={15} /> Refresh
          </ActionButton>
        </div>
        <p className="mt-1 text-xs text-muted">Pulled from the production readiness report. See the full report below for security and data checks.</p>
        {error && checks.length > 0 ? <p className="mt-3 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
        {loading ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
            <ModuleSkeleton />
          </div>
        ) : null}
        {!loading && checks.length === 0 ? (
          <div className="mt-4">
            <ModuleEmptyState
              icon={AlertTriangle}
              title="Unable to load integration status"
              description={error || "No integration checks are available right now."}
              action="Retry"
              onAction={() => void loadIntegrationStatus()}
            />
          </div>
        ) : null}
        {!loading && checks.length > 0 ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
            {checks.map((check) => (
              /*
                `min-w-0` and `break-words` are both load-bearing. A grid item
                keeps `min-width: auto` — its min-content width — even in a
                `minmax(0, 1fr)` track, and these labels carry tokens no
                browser will break on its own ("PDF generation
                (prescription/invoice/discharge)" is 32 unbroken characters,
                and the details name packages like @react-pdf/renderer). Below
                a 1024px viewport that pushed the whole settings page into
                horizontal scroll.
              */
              <div key={check.id} className={`min-w-0 break-words rounded border p-4 ${statusTone(check.status)}`}>
                <p className="font-bold">{check.label}</p>
                <p className="mt-1 text-sm">{check.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
