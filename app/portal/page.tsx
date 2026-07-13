import type { Metadata } from "next";
import { AppointmentForm } from "@/components/AppointmentForm";
import { HeroOpdTimingCard } from "@/components/HeroOpdTimingCard";
import { PatientPortalAccess } from "@/components/PatientPortalAccess";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Patient Portal & Appointment Booking",
  description:
    "Book an appointment and view your visit records, prescriptions and bills at Mudgal Gastromedics Hospital — one patient portal for both.",
  alternates: { canonical: "/portal" }
};

export default function PortalPage() {
  return (
    <main>
      <section className="page-hero-bg py-16 text-white md:py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Patient Portal</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            <span data-en>Book a visit. Track your care.</span>
            <span data-hi lang="hi">विज़िट बुक करें। अपनी देखभाल ट्रैक करें।</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/82">
            <span data-en>
              Request an appointment in under a minute — no sign-in needed. Already visited us? Sign in with your
              mobile number to see your timeline, prescriptions and bills.
            </span>
            <span data-hi lang="hi">
              एक मिनट में अपॉइंटमेंट का अनुरोध करें — साइन-इन की ज़रूरत नहीं। पहले आ चुके हैं? अपनी टाइमलाइन,
              पर्चे और बिल देखने के लिए मोबाइल नंबर से साइन इन करें।
            </span>
          </p>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section id="appointment" className="pt-10 md:pt-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Book Appointment</p>
          <h2 className="mt-2 text-4xl font-bold leading-tight text-ink">
            <span data-en>Request your appointment.</span>
            <span data-hi lang="hi">अपॉइंटमेंट का अनुरोध करें।</span>
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            <span data-en>
              Fill in your details and reception will confirm your slot. After booking, sign in below with the same
              mobile number to track your request.
            </span>
            <span data-hi lang="hi">
              अपनी जानकारी भरें, रिसेप्शन आपका समय कन्फ़र्म करेगा। बुकिंग के बाद उसी मोबाइल नंबर से नीचे साइन इन
              करके अपना अनुरोध ट्रैक करें।
            </span>
          </p>
        </div>
        <AppointmentForm />
      </Section>

      <Section muted className="pt-10 md:pt-14">
        <PatientPortalAccess />
      </Section>
    </main>
  );
}
