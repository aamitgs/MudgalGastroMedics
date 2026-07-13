"use client";

import { CalendarCheck, KeyRound, LogOut, MessageCircle, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { LiveClockWeather } from "@/components/site/LiveClockWeather";
import { PatientFeedbackWidget } from "@/components/site/PatientFeedbackWidget";
import {
  PatientHealthDashboard,
  type PatientAppointmentSummary,
  type PatientIpdAdmissionSummary,
  type PatientInsuranceClaimSummary,
  type PatientVisitSummary,
  type PatientVitalsPoint
} from "@/components/patient-portal/PatientHealthDashboard";
import type { FamilyMember } from "@/lib/family-types";
import { site } from "@/lib/site-data";

type LookupResponse = {
  ok: boolean;
  appointments?: PatientAppointmentSummary[];
  visits?: PatientVisitSummary[];
  ipdAdmissions?: PatientIpdAdmissionSummary[];
  vitals?: PatientVitalsPoint[];
  insuranceClaims?: PatientInsuranceClaimSummary[];
  error?: string;
};

type FamilyResponse = {
  ok: boolean;
  members?: FamilyMember[];
  member?: FamilyMember;
  error?: string;
};

type AuthStep = "phone" | "otp" | "email" | "ready";

const inputClass =
  "min-h-13 w-full rounded-lg border border-line bg-white px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.34)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70";

export function PatientPortalAccess() {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicNotice, setMagicNotice] = useState("");
  const [authedPhone, setAuthedPhone] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileNotice, setProfileNotice] = useState("");

  const [appointments, setAppointments] = useState<PatientAppointmentSummary[]>([]);
  const [visits, setVisits] = useState<PatientVisitSummary[]>([]);
  const [ipdAdmissions, setIpdAdmissions] = useState<PatientIpdAdmissionSummary[]>([]);
  const [vitals, setVitals] = useState<PatientVitalsPoint[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<PatientInsuranceClaimSummary[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [printableVisit, setPrintableVisit] = useState<PatientVisitSummary | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const params = new URLSearchParams(window.location.search);
      const loginToken = params.get("loginToken");
      if (loginToken) {
        const response = await fetch("/api/patient/auth/magic-link/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: loginToken })
        });
        const data = await response.json().catch(() => ({}));
        window.history.replaceState(null, "", window.location.pathname);
        if (!active) return;
        if (data.ok) {
          setAuthedPhone(data.phone);
          setHasEmail(Boolean(data.hasEmail));
          setStep("ready");
          return;
        }
        setStatus(data.error || "Sign-in link could not be used.");
      }

      const me = await fetch("/api/patient/auth/me", { cache: "no-store" });
      if (!active) return;
      if (me.ok) {
        const data = await me.json().catch(() => ({}));
        if (active && data.ok) {
          setAuthedPhone(data.phone);
          setHasEmail(Boolean(data.hasEmail));
          setStep("ready");
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (step !== "ready" || !authedPhone) return;
    let active = true;

    async function loadRecords() {
      setLoading(true);
      const [lookupResponse, familyResponse] = await Promise.all([
        fetch("/api/patient/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }),
        fetch("/api/patient/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      ]);
      const data = (await lookupResponse.json().catch(() => ({}))) as LookupResponse;
      const familyData = (await familyResponse.json().catch(() => ({}))) as FamilyResponse;
      if (!active) return;
      setLoading(false);
      if (!lookupResponse.ok || !data.ok) {
        setStatus(data.error || "Unable to load your records.");
        return;
      }
      setAppointments(data.appointments ?? []);
      setVisits(data.visits ?? []);
      setIpdAdmissions(data.ipdAdmissions ?? []);
      setVitals(data.vitals ?? []);
      setInsuranceClaims(data.insuranceClaims ?? []);
      setFamilyMembers(familyResponse.ok && familyData.ok ? familyData.members ?? [] : []);
    }

    void loadRecords();
    return () => {
      active = false;
    };
  }, [step, authedPhone]);

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setDevCode("");
    const response = await fetch("/api/patient/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!data.ok) {
      setStatus(data.error || "Could not send the code.");
      return;
    }
    if (data.devCode) setDevCode(data.devCode);
    setStep("otp");
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const response = await fetch("/api/patient/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otpCode })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!data.ok) {
      setStatus(data.error || "Could not verify the code.");
      return;
    }
    setAuthedPhone(data.phone);
    setHasEmail(Boolean(data.hasEmail));
    setOtpCode("");
    setDevCode("");
    setStep("ready");
  }

  async function emailLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const response = await fetch("/api/patient/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!data.ok) {
      setStatus(data.error || "Sign-in failed.");
      return;
    }
    setAuthedPhone(data.phone);
    setHasEmail(true);
    setPassword("");
    setStep("ready");
  }

  async function requestMagicLink() {
    if (!email.includes("@")) {
      setStatus("Enter your email above first, then request the link.");
      return;
    }
    setStatus("");
    const response = await fetch("/api/patient/auth/magic-link/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json().catch(() => ({}));
    setMagicNotice(data.ok ? data.message : data.error || "Could not request the link.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileNotice("");
    const response = await fetch("/api/patient/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profileEmail, password: profilePassword })
    });
    const data = await response.json().catch(() => ({}));
    if (!data.ok) {
      setProfileNotice(data.error || "Could not save.");
      return;
    }
    setHasEmail(true);
    setShowProfileForm(false);
    setProfilePassword("");
    setProfileNotice("Email sign-in enabled for your account.");
  }

  async function signOut() {
    await fetch("/api/patient/auth/logout", { method: "POST" });
    setAuthedPhone("");
    setStep("phone");
    setAppointments([]);
    setVisits([]);
    setIpdAdmissions([]);
    setVitals([]);
    setInsuranceClaims([]);
    setFamilyMembers([]);
    setStatus("");
  }

  async function addFamilyMember(input: { name: string; relation: string; age?: string; phone?: string }) {
    const response = await fetch("/api/patient/family", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = (await response.json().catch(() => ({}))) as FamilyResponse;
    if (!response.ok || !data.ok || !data.member) return;
    setFamilyMembers((items) => [data.member as FamilyMember, ...items]);
  }

  async function removeFamilyMember(id: string) {
    const response = await fetch("/api/patient/family", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) return;
    setFamilyMembers((items) => items.filter((item) => item.id !== id));
  }

  function printVisit(visit: PatientVisitSummary) {
    setPrintableVisit(visit);
    window.setTimeout(() => window.print(), 80);
  }

  const hasResults = appointments.length > 0 || visits.length > 0 || ipdAdmissions.length > 0;
  const signedIn = step === "ready" && Boolean(authedPhone);

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <div className="rounded border border-line/80 bg-white p-6 shadow-[0_24px_70px_rgba(8,64,84,0.1)]">
        <span className="grid h-12 w-12 place-items-center rounded bg-soft text-brand">
          <ShieldCheck size={22} />
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-brand">Patient Access</p>
        <h2 className="mt-2 text-4xl font-bold leading-tight text-ink"><span data-en>Your health dashboard</span><span data-hi lang="hi">आपका हेल्थ डैशबोर्ड</span></h2>

        {!signedIn ? (
          <>
            <p className="mt-3 leading-relaxed text-muted">
              <span data-en>Sign in with the mobile number used for your appointments. We send a one-time code — nothing to remember.</span>
              <span data-hi lang="hi">अपॉइंटमेंट में इस्तेमाल किए गए मोबाइल नंबर से साइन इन करें। हम एक बार का कोड (OTP) भेजेंगे — कुछ याद रखने की ज़रूरत नहीं।</span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setStep("phone"); setStatus(""); }}
                className={`min-h-10 rounded border px-3 text-sm font-bold transition ${step !== "email" ? "border-brand bg-soft text-brand" : "border-line bg-white text-muted hover:border-brand hover:text-brand"}`}
              >
                <span data-en>Mobile OTP</span><span data-hi lang="hi">मोबाइल OTP</span>
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setStatus(""); }}
                className={`min-h-10 rounded border px-3 text-sm font-bold transition ${step === "email" ? "border-brand bg-soft text-brand" : "border-line bg-white text-muted hover:border-brand hover:text-brand"}`}
              >
                <span data-en>Email</span><span data-hi lang="hi">ईमेल</span>
              </button>
            </div>

            {step === "phone" ? (
              <form onSubmit={requestOtp} className="mt-5 grid gap-4">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Mobile number</span><span data-hi lang="hi">मोबाइल नंबर</span></span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                    required
                  />
                </label>
                <button type="submit" disabled={loading} className={primaryButton}>
                  <Smartphone size={18} /> {loading ? <span>...</span> : <><span data-en>Send One-Time Code</span><span data-hi lang="hi">OTP भेजें</span></>}
                </button>
              </form>
            ) : null}

            {step === "otp" ? (
              <form onSubmit={verifyOtp} className="mt-5 grid gap-4">
                <p className="rounded border border-line bg-soft/60 p-3 text-sm leading-relaxed text-muted">
                  Enter the 6-digit code sent to <span className="font-bold text-ink">{phone}</span>.
                </p>
                {devCode ? (
                  <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    SMS delivery is not configured yet — your code is <span className="font-mono font-bold">{devCode}</span>.
                  </p>
                ) : null}
                <input
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  className={inputClass}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                />
                <button type="submit" disabled={loading} className={primaryButton}>
                  <KeyRound size={18} /> {loading ? <span>...</span> : <><span data-en>Verify &amp; Open Dashboard</span><span data-hi lang="hi">OTP जांचें और डैशबोर्ड खोलें</span></>}
                </button>
                <button type="button" onClick={() => setStep("phone")} className="text-sm font-semibold text-brand hover:underline">
                  <span data-en>Use a different number</span><span data-hi lang="hi">दूसरा नंबर इस्तेमाल करें</span>
                </button>
              </form>
            ) : null}

            {step === "email" ? (
              <form onSubmit={emailLogin} className="mt-5 grid gap-4">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-ink">Email</span>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} type="email" required />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
                  <input value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} type="password" required />
                </label>
                <button type="submit" disabled={loading} className={primaryButton}>
                  <KeyRound size={18} /> {loading ? "Signing in..." : "Sign in"}
                </button>
                <button type="button" onClick={() => void requestMagicLink()} className="text-sm font-semibold text-brand hover:underline">
                  Email me a sign-in link instead
                </button>
                {magicNotice ? <p className="rounded border border-line bg-soft/60 p-3 text-sm font-semibold text-muted">{magicNotice}</p> : null}
                <p className="text-xs leading-relaxed text-muted">
                  Email sign-in works after you add an email from inside the portal (sign in once with mobile OTP first).
                </p>
              </form>
            ) : null}
          </>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Signed in as +91 {authedPhone}
            </p>
            {!hasEmail ? (
              <button
                type="button"
                onClick={() => setShowProfileForm((value) => !value)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-white px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
              >
                <KeyRound size={16} /> Enable email sign-in
              </button>
            ) : null}
            {showProfileForm ? (
              <form onSubmit={saveProfile} className="grid gap-3 rounded border border-line bg-soft/50 p-4">
                <input value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} className={inputClass} type="email" placeholder="Your email" required />
                <input value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} className={inputClass} type="password" placeholder="Create a password (min 12 characters)" required />
                <button type="submit" className={primaryButton}>Save</button>
              </form>
            ) : null}
            {profileNotice ? <p className="rounded border border-line bg-soft/60 p-3 text-sm font-semibold text-muted">{profileNotice}</p> : null}
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-white px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <LogOut size={16} /> <span data-en>Sign out</span><span data-hi lang="hi">साइन आउट</span>
            </button>
          </div>
        )}

        {status ? <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{status}</p> : null}
        <div className="mt-5 grid gap-2">
          <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-white px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <Phone size={17} /> <span data-en>Call Reception</span><span data-hi lang="hi">रिसेप्शन को कॉल करें</span>
          </a>
          <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white">
            <MessageCircle size={17} /> <span data-en>WhatsApp Reception</span><span data-hi lang="hi">व्हाट्सऐप रिसेप्शन</span>
          </a>
        </div>
      </div>

      <div>
        {!signedIn ? (
          <div className="grid h-full place-items-center rounded border border-dashed border-line bg-soft/60 p-8 text-center">
            <div>
              <CalendarCheck className="mx-auto text-brand" size={34} />
              <p className="mt-4 text-xl font-bold text-ink"><span data-en>Your health dashboard will appear here.</span><span data-hi lang="hi">आपका हेल्थ डैशबोर्ड यहाँ दिखेगा।</span></p>
              <p className="mt-2 text-muted"><span data-en>Sign in with your mobile number to see your timeline, prescriptions, bills and more.</span><span data-hi lang="hi">अपनी टाइमलाइन, पर्चे और बिल देखने के लिए मोबाइल नंबर से साइन इन करें।</span></p>
              <div className="mt-6 border-t border-line/70 pt-6">
                <LiveClockWeather variant="launcher" />
              </div>
            </div>
          </div>
        ) : null}
        {signedIn && !hasResults && !loading ? (
          <div className="grid h-full place-items-center rounded border border-dashed border-line bg-soft/60 p-8 text-center">
            <div>
              <p className="text-xl font-bold text-ink">No records found for this number yet.</p>
              <p className="mt-2 text-muted">Records appear here after your first appointment or visit. Contact reception for help.</p>
            </div>
          </div>
        ) : null}
        {signedIn && hasResults ? (
          <>
            <PatientFeedbackWidget visits={visits} />
            <PatientHealthDashboard
              phone={authedPhone}
              appointments={appointments}
              visits={visits}
              ipdAdmissions={ipdAdmissions}
              vitals={vitals}
              insuranceClaims={insuranceClaims}
              familyMembers={familyMembers}
              onAddFamilyMember={addFamilyMember}
              onRemoveFamilyMember={removeFamilyMember}
              onPrintVisit={printVisit}
            />
          </>
        ) : null}
      </div>
    </div>
    {printableVisit ? (
      <section className="patient-print">
        <div className="print-sheet">
          <header className="print-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" />
            <div>
              <h1>{site.name}</h1>
              <p>{site.tagline}</p>
              <p>{site.addressLine1}, {site.addressLine2}, {site.city}, {site.region} {site.postalCode}</p>
              <p>Phone: {site.phone} | WhatsApp: {site.mobile}</p>
            </div>
          </header>
          <div className="print-title">
            <div>
              <p>Patient Visit Summary</p>
              <h2>{printableVisit.patientName}</h2>
            </div>
            <div>
              <p>Token</p>
              <strong>{printableVisit.token}</strong>
            </div>
          </div>
          <dl className="print-grid">
            <div><dt>Visit Date</dt><dd>{new Date(printableVisit.createdAt).toLocaleDateString("en-IN")}</dd></div>
            {printableVisit.uhid ? <div><dt>UHID</dt><dd>{printableVisit.uhid}</dd></div> : null}
            <div><dt>Service</dt><dd>{printableVisit.service}</dd></div>
            <div><dt>Status</dt><dd>{printableVisit.status}</dd></div>
            <div><dt>Priority</dt><dd>{printableVisit.priority || "Routine"}</dd></div>
            <div><dt>Billing</dt><dd>{printableVisit.billingStatus}</dd></div>
            {printableVisit.receiptId ? <div><dt>Receipt ID</dt><dd>{printableVisit.receiptId}</dd></div> : null}
            {printableVisit.estimatedAmount ? <div><dt>Amount</dt><dd>Rs. {printableVisit.estimatedAmount}{printableVisit.paymentMethod ? ` via ${printableVisit.paymentMethod}` : ""}</dd></div> : null}
          </dl>
          {printableVisit.symptoms.length ? (
            <section className="print-block">
              <h3>Reported Symptoms</h3>
              <p>{printableVisit.symptoms.join(", ")}</p>
            </section>
          ) : null}
          {printableVisit.clinicalNote ? (
            <section className="print-block">
              <h3>Clinical Summary</h3>
              <p>{printableVisit.clinicalNote}</p>
            </section>
          ) : null}
          {printableVisit.prescription ? (
            <section className="print-block">
              <h3>Prescription</h3>
              <p>{printableVisit.prescription}</p>
            </section>
          ) : null}
          {printableVisit.advice ? (
            <section className="print-block">
              <h3>Advice</h3>
              <p>{printableVisit.advice}</p>
            </section>
          ) : null}
          {printableVisit.followUpDate ? (
            <section className="print-block">
              <h3>Follow-up</h3>
              <p>{printableVisit.followUpDate}</p>
            </section>
          ) : null}
          <footer className="print-footer">
            <p>This summary is generated from the hospital workflow. Follow the doctor&apos;s instructions and contact reception for urgent symptoms.</p>
            <p>Printed on {new Date().toLocaleDateString("en-IN")}</p>
          </footer>
        </div>
      </section>
    ) : null}
    </>
  );
}
