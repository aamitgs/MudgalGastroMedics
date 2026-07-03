"use client";

import { LockKeyhole, Stethoscope } from "lucide-react";
import { FormEvent, useState } from "react";

export function DoctorLogin() {
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/doctor/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode })
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
    <div className="mx-auto max-w-xl rounded border border-line/80 bg-white p-6 shadow-[0_28px_80px_rgba(8,64,84,0.14)] md:p-8">
      <span className="grid h-14 w-14 place-items-center rounded bg-soft text-brand">
        <Stethoscope size={24} />
      </span>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-brand">Doctor Login</p>
      <h2 className="mt-2 text-4xl font-bold leading-tight text-ink">Clinical access</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Enter the doctor passcode to open the OPD queue, patient context, prescriptions and follow-up list.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label>
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><LockKeyhole size={16} /> Passcode</span>
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="min-h-13 w-full rounded-lg border border-line bg-white px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="Enter doctor passcode"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cyan-300/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-5 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.34)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Checking..." : "Open Doctor Portal"}
        </button>
      </form>
      {status ? <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{status}</p> : null}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Local default passcode is <span className="font-semibold text-ink">mgm-doctor</span>. Set <span className="font-semibold text-ink">DOCTOR_PASSCODE</span> before production use.
      </p>
    </div>
  );
}
