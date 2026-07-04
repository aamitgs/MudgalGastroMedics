"use client";

import Image from "next/image";
import { Eye, EyeOff, FileCheck2, KeyRound, LockKeyhole, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import { useState } from "react";
import { roleMeta, staffLoginRoles, type AccessRole } from "@/lib/access/matrix";
import { site } from "@/lib/site-data";

type Step = "credentials" | "password-change" | "mfa-setup" | "mfa-verify";

const inputClass =
  "min-h-13 w-full rounded-lg border border-line bg-surface px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-5 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.34)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70";

export function AccessLogin({
  initialRole = "",
  landingOverride,
  workspaceLabel
}: {
  initialRole?: string;
  landingOverride?: string;
  workspaceLabel?: string;
} = {}) {
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [landing, setLanding] = useState(landingOverride ?? "/admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [totpSecret, setTotpSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  function advance(status: string, landingPath?: string) {
    // A workspace tile's destination wins over the role's default landing.
    const resolved = landingOverride ?? landingPath;
    if (resolved) setLanding(resolved);
    setError("");
    if (status === "password-change-required") {
      setCurrentPassword(password);
      setStep("password-change");
    } else if (status === "mfa-setup-required") {
      setStep("mfa-setup");
      void startMfaSetup();
    } else if (status === "mfa-pending") {
      setStep("mfa-verify");
    } else {
      window.location.assign(landingOverride ?? landingPath ?? landing);
    }
  }

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: role || undefined })
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      advance(data.status, data.landing);
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPasswordChange(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Password change failed.");
        return;
      }
      advance(data.status);
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startMfaSetup() {
    try {
      const response = await fetch("/api/auth/mfa/setup");
      const data = await response.json();
      if (data.ok) setTotpSecret(data.secret);
      else setError(data.error || "Could not start MFA setup.");
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
    }
  }

  async function submitMfa(event: React.FormEvent, mode: "setup" | "verify") {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(mode === "setup" ? "/api/auth/mfa/setup" : "/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode })
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      window.location.assign(landing);
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-line/80 bg-surface p-8 shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
        <div className="flex flex-col items-center text-center">
          <Image src="/mgm-logo.png" alt={site.name} width={64} height={64} className="h-16 w-16 object-contain" />
          <h1 className="mt-4 text-2xl font-bold leading-tight text-ink">{site.name}</h1>
          <p className="mt-1 text-sm font-semibold text-muted">{site.secondaryTagline}</p>
          {workspaceLabel ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold text-brand">
              {workspaceLabel}
            </p>
          ) : null}
        </div>

        {step === "credentials" ? (
          <form onSubmit={submitLogin} className="mt-8 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputClass}
                autoComplete="username"
                autoFocus={Boolean(workspaceLabel)}
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-brand"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Log in as</span>
              <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
                <option value="">My default role</option>
                {staffLoginRoles.map((staffRole) => (
                  <option key={staffRole} value={staffRole}>
                    {roleMeta[staffRole].label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs leading-relaxed text-muted">
                Picks your workspace if you hold more than one role. Access is always verified against your account, not this selection.
              </span>
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              <LockKeyhole size={18} /> {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setShowForgot((value) => !value)}
              className="text-sm font-semibold text-brand transition hover:underline"
            >
              Forgot password?
            </button>
            {showForgot ? (
              <p className="rounded-lg border border-line bg-soft/60 p-3 text-xs leading-relaxed text-muted">
                Ask a Super Admin to reset your password from User Management. You will receive a temporary
                password and be asked to set a new one at next login.
              </p>
            ) : null}
          </form>
        ) : null}

        {step === "password-change" ? (
          <form onSubmit={submitPasswordChange} className="mt-8 grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3">
              <KeyRound className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" size={18} />
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                Set a new password before continuing. Minimum 12 characters mixing cases, numbers and symbols.
              </p>
            </div>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              <KeyRound size={18} /> {loading ? "Saving..." : "Set new password"}
            </button>
          </form>
        ) : null}

        {step === "mfa-setup" ? (
          <form onSubmit={(event) => submitMfa(event, "setup")} className="mt-8 grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-line bg-soft/60 p-3">
              <Smartphone className="mt-0.5 shrink-0 text-brand" size={18} />
              <p className="text-sm leading-relaxed text-muted">
                Your role requires two-factor authentication. In Google Authenticator or any TOTP app, add an
                account with this key, then enter the 6-digit code it shows.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-soft/60 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Setup key</p>
              <p className="mt-2 break-all font-mono text-sm font-bold text-ink">{totpSecret || "Loading..."}</p>
            </div>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">6-digit code</span>
              <input
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                className={inputClass}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </label>
            <button type="submit" disabled={loading || !totpSecret} className={buttonClass}>
              <ShieldCheck size={18} /> {loading ? "Verifying..." : "Enable two-factor"}
            </button>
          </form>
        ) : null}

        {step === "mfa-verify" ? (
          <form onSubmit={(event) => submitMfa(event, "verify")} className="mt-8 grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-line bg-soft/60 p-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={18} />
              <p className="text-sm leading-relaxed text-muted">Enter the 6-digit code from your authenticator app.</p>
            </div>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ink">6-digit code</span>
              <input
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                className={inputClass}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
              />
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              <ShieldCheck size={18} /> {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm font-semibold text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted" aria-label="Security posture">
        <span className="inline-flex items-center gap-1"><LockKeyhole size={12} aria-hidden="true" /> Encrypted connection</span>
        <span className="inline-flex items-center gap-1"><UserCheck size={12} aria-hidden="true" /> RBAC enforced</span>
        <span className="inline-flex items-center gap-1"><FileCheck2 size={12} aria-hidden="true" /> Audit logged</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck size={12} aria-hidden="true" /> MFA</span>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        Staff access only. Patients can view their records via the{" "}
        <a href="/portal" className="font-semibold text-brand hover:underline">patient portal</a>.
      </p>
    </div>
  );
}
