"use client";

import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

export function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, passcode })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !data.ok) {
      setStatus(data.error || "Unable to sign in.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-xl rounded border border-line/80 bg-surface p-4 shadow-sm md:p-8">
      <span className="grid h-14 w-14 place-items-center rounded bg-soft text-brand">
        <LockKeyhole size={24} />
      </span>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-brand">Admin Login</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">Reception access</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Sign in with a named staff account to view appointment requests and manage hospital workflows.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label>
          <span className="mb-2 block text-sm font-semibold text-ink">Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="min-h-10 w-full rounded-lg border border-line bg-surface px-4 text-base text-ink shadow-none transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="admin"
            required
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-10 w-full rounded-lg border border-line bg-surface px-4 text-base text-ink shadow-none transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="Enter staff password"
            required
          />
        </label>
        <details className="rounded border border-line bg-soft/60 p-3">
          <summary className="cursor-pointer text-sm font-bold text-ink">Local passcode fallback</summary>
          <label className="mt-3 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Passcode</span>
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              placeholder="Optional local fallback"
            />
          </label>
        </details>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-5 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.34)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Checking..." : "Open Dashboard"}
        </button>
      </form>
      {status ? <p className="mt-4 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm font-semibold text-red-700 dark:text-red-300">{status}</p> : null}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Local defaults: username <span className="font-semibold text-ink">admin</span>, password <span className="font-semibold text-ink">mgm-admin</span>. Set <span className="font-semibold text-ink">STAFF_USERS_JSON</span> or <span className="font-semibold text-ink">ADMIN_PASSWORD</span> before production use.
      </p>
    </div>
  );
}
