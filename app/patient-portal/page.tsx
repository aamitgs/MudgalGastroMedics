import type { Metadata } from "next";
import { Bell, CalendarCheck, FileUp, KeyRound, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/AppointmentCtaPanel";
import { ButtonLink } from "@/components/ButtonLink";
import { Section } from "@/components/Section";
import { portalFeatures } from "@/lib/platform-data";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Patient Portal",
  description: "Patient portal plan for appointments, reports, prescriptions, preparation instructions and follow-up reminders at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/patient-portal" }
};

export default function PatientPortalPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Patient Portal</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">A simple patient account for every visit.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82">
              Patients can request appointments, upload reports, view visit instructions and receive follow-up reminders through a mobile-first portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/portal" className="min-h-13 px-6">Open Portal</ButtonLink>
            </div>
            <AppointmentCtaPanel className="mt-5 max-w-3xl" />
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="rounded bg-white p-5 text-ink">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Portal Preview</p>
                  <h2 className="mt-1 text-2xl font-bold">Patient dashboard</h2>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded bg-soft text-brand"><KeyRound size={20} /></span>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  ["Next appointment", "Gastro consultation | Flexible"],
                  ["Request lookup", "Phone number and optional request ID"],
                  ["Preparation", "Fasting and medicine instructions"],
                  ["Follow-up", "Reminder after consultation"]
                ].map(([title, text]) => (
                  <div key={title} className="rounded border border-line bg-soft/60 p-4">
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm text-muted">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-10 grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">Portal Features</p>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">Patient-friendly, not complicated.</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted">
            The portal should reduce calls for routine tasks while still keeping reception reachable by phone and WhatsApp.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portalFeatures.map((feature, index) => (
            <div key={feature} className="rounded border border-line/80 bg-white p-5 shadow-sm">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-brand">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-lg font-bold text-ink">{feature}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [CalendarCheck, "Appointment Timeline", "Show requested, confirmed, completed and follow-up visits in one place."],
            [FileUp, "Report Vault", "Allow PDFs and images for prior reports, prescriptions and test files."],
            [Bell, "Reminder System", "Send preparation, visit and follow-up reminders through WhatsApp/SMS."],
            [ShieldCheck, "Consent First", "Keep patient data behind OTP login and role-controlled staff access."],
            [MessageCircle, "Reception Handoff", "Every portal action can still hand off to reception when staff help is needed."]
          ].map(([Icon, title, text]) => (
            <article key={title as string} className="rounded border border-line/80 bg-white p-6 shadow-soft">
              <span className="grid h-12 w-12 place-items-center rounded bg-soft text-brand"><Icon size={21} /></span>
              <h3 className="mt-5 text-2xl font-bold text-ink">{title as string}</h3>
              <p className="mt-3 leading-relaxed text-muted">{text as string}</p>
            </article>
          ))}
        </div>
      </Section>
    </main>
  );
}
