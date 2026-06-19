import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ButtonLink } from "@/components/ButtonLink";
import { Section } from "@/components/Section";
import { fullAddress, site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book an appointment at Mudgal Gastromedics Hospital, 16 HIG Shaheed Nagar, Agra. Call 0562-3501228 or WhatsApp +91 9828912257.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Contact</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Need Expert Gastro & Liver Care?</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            Book your appointment today. Call, WhatsApp, submit the appointment form, or get directions to Mudgal Gastromedics Hospital in Shaheed Nagar, Agra.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="appointment" className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <h2 className="mb-5 text-3xl font-black">Appointment Form</h2>
            <AppointmentForm />
          </div>
          <div className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <h2 className="text-3xl font-black">Contact Details</h2>
            <div className="mt-5 grid gap-3 text-muted">
              <p><b className="text-ink">Phone:</b> <a href={`tel:${site.phone}`}>{site.phone}</a></p>
              <p><b className="text-ink">WhatsApp:</b> <a href={`https://wa.me/${site.whatsapp}`}>{site.mobile}</a>, {site.whatsappAlt}</p>
              <p><b className="text-ink">Email:</b> {site.email}, {site.emailAlt}</p>
              <p><b className="text-ink">Address:</b> {fullAddress}</p>
              <p><b className="text-ink">Hospital timings:</b> Mon-Sat, 10:00 AM-6:00 PM. Dummy schedule, verify before launch.</p>
              <p><b className="text-ink">Emergency/after-hours:</b> Call reception for urgent assistance. Dummy policy, verify before launch.</p>
              <p><b className="text-ink">Insurance/TPA:</b> Selected cashless and reimbursement support available. Dummy text, verify before launch.</p>
            </div>
            <div className="mt-5 flex items-start gap-3 text-muted"><MapPin className="text-brand" /> Landmark: Behind Shaheed Nagar Police Chowki</div>
            <iframe className="mt-5 h-80 w-full rounded border-0" src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mudgal Gastromedics Hospital map" />
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href={`tel:${site.phone}`}>Call</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost">Get Directions</ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
