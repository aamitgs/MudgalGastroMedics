"use client";

import Image from "next/image";
import { BadgeIndianRupee, FlaskConical, HeartPulse, Pill, Settings, Stethoscope, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AccessLogin } from "@/components/chrome/AccessLogin";
import { AdminLogin } from "@/components/chrome/AdminLogin";
import { DoctorLogin } from "@/components/chrome/DoctorLogin";
import { LiveClockWeather } from "@/components/site/LiveClockWeather";
import type { AccessRole } from "@/lib/access/matrix";
import { site } from "@/lib/site-data";

type WorkspaceTile = {
  key: string;
  label: string;
  hint: string;
  icon: typeof Stethoscope;
  /** Preselected role for the login form; empty string = user's default role. */
  role: AccessRole | "";
  /** Where the tile lands once authenticated. */
  destination: string;
};

// Destinations are the real Hospital OS routes (Track 4.13) — these used to
// be /admin#module-x anchors from before that migration; /admin is now just
// a redirect, so those stale hrefs still worked but only via two extra hops
// through HospitalOsShell's legacy-hash fallback.
const tiles: WorkspaceTile[] = [
  { key: "doctor", label: "Doctor Portal", hint: "OPD queue & consultations", icon: Stethoscope, role: "", destination: "/doctor" },
  { key: "reception", label: "Reception Desk", hint: "Appointments & registration", icon: UsersRound, role: "reception", destination: "/mudgalgastromedics-os/appointments" },
  { key: "pharmacy", label: "Pharmacy", hint: "Dispensing & stock", icon: Pill, role: "pharmacist", destination: "/mudgalgastromedics-os/pharmacy" },
  { key: "laboratory", label: "Laboratory", hint: "Orders & results", icon: FlaskConical, role: "lab-technician", destination: "/mudgalgastromedics-os/lab" },
  { key: "nursing", label: "Nursing Station", hint: "Beds, vitals & HDU", icon: HeartPulse, role: "nurse", destination: "/mudgalgastromedics-os/ipd" },
  { key: "billing", label: "Billing", hint: "Receipts & claims", icon: BadgeIndianRupee, role: "billing-accounts", destination: "/mudgalgastromedics-os/billing" },
  { key: "administration", label: "Administration", hint: "Operations & access control", icon: Settings, role: "admin", destination: "/mudgalgastromedics-os" }
];

const lastWorkspaceKey = "mgmLastWorkspace";

type SystemStatus = { ok: boolean; version?: string; environment?: string };

export function WorkspaceLauncher() {
  const [chosen, setChosen] = useState<WorkspaceTile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [lastTile, setLastTile] = useState<WorkspaceTile | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);
  const [showDoctorPasscode, setShowDoctorPasscode] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const stored = window.localStorage.getItem(lastWorkspaceKey);
      const remembered = tiles.find((tile) => tile.key === stored) ?? null;

      const [me, health] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }).catch(() => null),
        fetch("/api/health", { cache: "no-store" }).catch(() => null)
      ]);
      if (!active) return;

      if (remembered) setLastTile(remembered);
      if (me?.ok) {
        const data = await me.json().catch(() => null);
        if (active && data?.ok && data.status === "active") setSignedIn(true);
      }
      if (health?.ok) {
        const data = await health.json().catch(() => null);
        if (active && data?.ok) setSystem({ ok: true, version: data.version, environment: data.environment });
      } else if (active) {
        setSystem({ ok: false });
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  function openTile(tile: WorkspaceTile) {
    window.localStorage.setItem(lastWorkspaceKey, tile.key);
    if (signedIn) {
      window.location.assign(tile.destination);
      return;
    }
    setChosen(tile);
  }

  if (chosen) {
    return (
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => {
            setChosen(null);
            setShowDoctorPasscode(false);
          }}
          className="mb-4 text-sm font-semibold text-brand transition hover:underline"
        >
          ← All workspaces
        </button>
        <AccessLogin
          initialRole={chosen.role}
          landingOverride={chosen.destination}
          workspaceLabel={chosen.label}
        />
        {chosen.key === "doctor" ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowDoctorPasscode((value) => !value)}
              className="text-xs font-semibold text-muted underline-offset-2 transition hover:text-brand hover:underline"
            >
              Trouble signing in?
            </button>
            {showDoctorPasscode ? (
              <div className="mt-4">
                <DoctorLogin />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-center text-center">
        <Image src="/mgm-logo.png" alt={site.name} width={128} height={128} className="h-28 w-28 object-contain" />
        <h1 className="mt-4 text-3xl font-bold leading-tight text-ink">{site.name}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">Choose your workspace</p>
        <div className="mt-3">
          <LiveClockWeather variant="launcher" />
        </div>
      </div>

      {lastTile ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-soft/60 p-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Welcome back</p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink">Last workspace: {lastTile.label}</p>
          </div>
          <button
            type="button"
            onClick={() => openTile(lastTile)}
            className="inline-flex min-h-9 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Continue
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button key={tile.key} type="button" onClick={() => openTile(tile)} className="group flex flex-col items-center gap-3 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-ink transition group-hover:-translate-y-0.5 group-hover:border-brand group-hover:text-brand group-hover:shadow-md">
                <Icon size={24} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{tile.label}</span>
                <span className="mt-0.5 block text-xs font-medium text-muted">{tile.hint}</span>
              </span>
            </button>
          );
        })}

        <a href="/portal" className="group flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-line bg-surface text-teal-dark transition group-hover:-translate-y-0.5 group-hover:border-teal group-hover:shadow-md">
            <UserRound size={24} />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Patient Portal</span>
            <span className="mt-0.5 block text-xs font-medium text-muted">Book & track your care</span>
          </span>
        </a>
      </div>

      {signedIn ? (
        <p className="mt-8 text-center text-xs font-semibold text-muted">
          You are signed in — choosing a workspace opens it directly.
        </p>
      ) : (
        <p className="mt-8 text-center text-xs leading-relaxed text-muted">
          Staff access only. Your account determines what each workspace shows.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted" aria-label="System status">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${system === null ? "bg-line" : system.ok ? "bg-teal" : "bg-coral"}`} />
          {system === null ? "Checking system..." : system.ok ? "System operational" : "Status unavailable"}
        </span>
        {system?.version ? <span>v{system.version}</span> : null}
        {system?.environment && system.environment !== "production" ? (
          <span className="rounded bg-gold/15 px-1.5 py-0.5 uppercase tracking-wide text-gold">{system.environment}</span>
        ) : null}
      </div>

      {!signedIn ? (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setShowLegacy((value) => !value)} className="text-xs font-semibold text-muted underline-offset-2 transition hover:text-brand hover:underline">
            Trouble signing in?
          </button>
          {showLegacy ? (
            <div className="mt-4">
              <AdminLogin />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
