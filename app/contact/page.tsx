import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ButtonLink } from "@/components/ButtonLink";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book an appointment at Mudgal Gastromedics Hospital, 16 HIG Shaheed Nagar, Agra. Call or WhatsApp +91 9828912257.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  const quickActions = [
    {
      title: "Call Reception",
      value: site.mobile,
      href: `tel:${site.mobile.replace(/\s/g, "")}`,
      icon: Phone,
      tone: "bg-brand text-white"
    },
    {
      title: "WhatsApp",
      value: site.mobile,
      href: `https://wa.me/${site.whatsapp}`,
      icon: MessageCircle,
      tone: "bg-teal text-white"
    },
    {
      title: "Email",
      value: site.email,
      href: `mailto:${site.email}`,
      icon: Mail,
      tone: "bg-ink text-white"
    }
  ];

  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Contact & Appointments</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Need Expert Gastro & Liver Care?</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">
            Book your appointment today. Call, WhatsApp, submit the appointment form, or get directions to Mudgal Gastromedics Hospital in Shaheed Nagar, Agra.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {quickActions.map(({ title, value, href, icon: Icon, tone }) => (
              <a key={title} href={href} className="group flex items-center gap-4 rounded border border-white/20 bg-white/12 p-4 shadow-[0_18px_45px_rgba(2,22,29,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded ${tone}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{title}</span>
                  <span className="block truncate text-sm text-white/75">{value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <MotionReveal>
          <div id="appointment" className="overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="border-b border-line bg-[linear-gradient(135deg,#ecfeff,#ffffff)] p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Book Appointment</p>
              <h2 className="mt-2 text-3xl font-black">Share your details with reception</h2>
              <p className="mt-2 text-muted">The team can use your request to prepare the next call or WhatsApp follow-up.</p>
            </div>
            <div className="p-6">
              <AppointmentForm />
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section muted className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr] lg:items-stretch">
          <MotionReveal>
            <div className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Visit MGM</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-ink">Shaheed Nagar, Agra</h2>
              <div className="mt-6 grid gap-4">
                <InfoLine icon={<MapPin size={20} />} title="Address" text="16 HIG, Shaheed Nagar, Behind Shaheed Nagar Police Chowki, Agra, Uttar Pradesh 282001" />
                <InfoLine icon={<Clock size={20} />} title="OPD / Business Hours" text="Mon-Sat, 11:00 AM-6:00 PM" />
                <InfoLine icon={<ShieldCheck size={20} />} title="Urgent Assistance" text="Hospital operates 24/7. For urgent symptoms, call reception before visiting." />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`}>Call</ButtonLink>
                <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
                <ButtonLink href={site.directionsUrl} variant="ghost">Get Directions</ButtonLink>
              </div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="h-full overflow-hidden rounded border border-line bg-white p-3 shadow-soft">
              <iframe
                className="h-[520px] w-full rounded border-0"
                src={site.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mudgal Gastromedics Hospital map"
              />
            </div>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Before You Visit" title="A smoother appointment experience">
          <p>Keep reports, prescriptions and prior investigation details ready so the care team can guide you faster.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Bring Reports", "Carry previous endoscopy, liver, ultrasound, CT, blood test or prescription records if available."],
            ["Confirm Preparation", "Some procedures may require fasting or medicine instructions. Confirm before arrival."],
            ["Use Direct Routes", "Call or WhatsApp reception for timing, directions and appointment coordination."]
          ].map(([title, text]) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function InfoLine({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded border border-line bg-soft/70 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-white text-brand shadow-sm">{icon}</span>
      <span>
        <span className="block font-black text-ink">{title}</span>
        <span className="mt-1 block text-muted">{text}</span>
      </span>
    </div>
  );
}
