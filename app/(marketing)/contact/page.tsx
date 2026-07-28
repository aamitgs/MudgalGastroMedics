import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { ContactForm } from "@/components/site/ContactForm";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { LocalProminencePanel } from "@/components/site/LocalProminencePanel";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book an appointment at Mudgal Gastromedics Hospital, 16 HIG Shaheed Nagar, Agra. Call or WhatsApp +91 9828912257.",
  alternates: { canonical: "/contact" }
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Contact", url: "/contact" }
  ])
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
    }
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-end gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
              <span data-en>Contact & Appointments</span>
              <span data-hi lang="hi">संपर्क और अपॉइंटमेंट</span>
            </p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              <span data-en>Need Expert Gastro & Liver Care?</span>
              <span data-hi lang="hi">विशेषज्ञ गैस्ट्रो और लिवर देखभाल चाहिए?</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>
            Book your appointment today. Call, WhatsApp, submit the appointment form, or get directions to Mudgal Gastromedics Hospital in Shaheed Nagar, Agra.
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">
            आज ही अपॉइंटमेंट बुक करें। कॉल करें, व्हाट्सएप करें, अपॉइंटमेंट फॉर्म भरें, या आगरा के शहीद नगर स्थित मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल के लिए दिशा-निर्देश प्राप्त करें।
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3 lg:grid-cols-1">
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

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section muted className="pt-0">
        <LocalProminencePanel />
      </Section>

      <Section className="relative z-10 pt-0">
        <MotionReveal>
          <div id="appointment" className="mx-auto max-w-2xl overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="border-b border-line bg-[linear-gradient(135deg,#ecfeff,#ffffff)] p-6">
              <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
                <span data-en>Get in Touch</span>
                <span data-hi lang="hi">संपर्क करें</span>
              </p>
              <h2 className="inline-lang mt-2 text-3xl font-black">
                <span data-en>Send us a message</span>
                <span data-hi lang="hi">हमें संदेश भेजें</span>
              </h2>
              <p className="mt-2 text-muted" data-en>
                Looking to book a visit? Use the <a href="/portal" className="font-semibold text-brand-dark hover:underline">Patient Portal</a> for the full appointment form — this is for general questions.
              </p>
              <p className="mt-2 text-muted" data-hi lang="hi">
                विज़िट बुक करनी है? पूरे अपॉइंटमेंट फॉर्म के लिए <a href="/portal" className="font-semibold text-brand-dark hover:underline">पेशेंट पोर्टल</a> का उपयोग करें — यह सामान्य प्रश्नों के लिए है।
              </p>
            </div>
            <div className="p-6">
              <ContactForm />
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section muted className="pt-0">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-stretch">
          <MotionReveal>
            <div className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
                <span data-en>Visit MGM</span>
                <span data-hi lang="hi">एमजीएम आएं</span>
              </p>
              <h2 className="inline-lang mt-2 text-3xl font-black leading-tight text-ink">
                <span data-en>Shaheed Nagar, Agra</span>
                <span data-hi lang="hi">शहीद नगर, आगरा</span>
              </h2>
              <div className="mt-6 grid gap-4">
                <InfoLine
                  icon={<MapPin size={20} />}
                  title="Address"
                  hiTitle="पता"
                  text="16 HIG, Shaheed Nagar, Behind Shaheed Nagar Police Chowki, Agra, Uttar Pradesh 282001"
                  hiText="16 एचआईजी, शहीद नगर, शहीद नगर पुलिस चौकी के पीछे, आगरा, उत्तर प्रदेश 282001"
                />
                <InfoLine
                  icon={<Phone size={20} />}
                  title="Landline"
                  hiTitle="लैंडलाइन"
                  text={site.phone}
                  hiText={site.phone}
                />
                <InfoLine
                  icon={<Clock size={20} />}
                  title="OPD / Business Hours"
                  hiTitle="ओपीडी / कार्य समय"
                  text="Mon-Sat, Morning 11:00 AM-2:00 PM and Evening 5:00 PM-6:00 PM. Sunday closed."
                  hiText="सोम-शनि, सुबह 11:00 - दोपहर 2:00 और शाम 5:00 - 6:00. रविवार बंद."
                />
                <InfoLine
                  icon={<ShieldCheck size={20} />}
                  title="Urgent Assistance"
                  hiTitle="आपातकालीन सहायता"
                  text="Hospital operates 24/7. For urgent symptoms, call reception before visiting."
                  hiText="अस्पताल 24/7 खुला रहता है। आपातकालीन लक्षणों के लिए आने से पहले रिसेप्शन पर कॉल करें।"
                />
              </div>
              <AppointmentCtaPanel className="mt-6" />
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
          <p data-en>Keep reports, prescriptions and prior investigation details ready so the care team can guide you faster.</p>
          <p data-hi lang="hi">रिपोर्ट, प्रिस्क्रिप्शन और पिछली जांच का विवरण तैयार रखें ताकि केयर टीम आपकी तेज़ी से मदद कर सके।</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-3">
          {[
            [
              "Bring Reports",
              "रिपोर्ट लाएं",
              "Carry previous endoscopy, liver, ultrasound, CT, blood test or prescription records if available.",
              "यदि उपलब्ध हों तो पिछली एंडोस्कोपी, लिवर, अल्ट्रासाउंड, सीटी, ब्लड टेस्ट या प्रिस्क्रिप्शन रिकॉर्ड साथ लाएं।"
            ],
            [
              "Confirm Preparation",
              "तैयारी की पुष्टि करें",
              "Some procedures may require fasting or medicine instructions. Confirm before arrival.",
              "कुछ प्रक्रियाओं के लिए उपवास या दवा संबंधी निर्देशों की आवश्यकता हो सकती है। आने से पहले पुष्टि करें।"
            ],
            [
              "Use Direct Routes",
              "सीधे संपर्क करें",
              "Call or WhatsApp reception for timing, directions and appointment coordination.",
              "समय, दिशा-निर्देश और अपॉइंटमेंट समन्वय के लिए रिसेप्शन को कॉल या व्हाट्सएप करें।"
            ]
          ].map(([title, hiTitle, text, hiText]) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="inline-lang text-xl font-black">
                <span data-en>{title}</span>
                <span data-hi lang="hi">{hiTitle}</span>
              </h3>
              <p className="mt-2 text-muted" data-en>{text}</p>
              <p className="mt-2 text-muted" data-hi lang="hi">{hiText}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function InfoLine({ icon, title, hiTitle, text, hiText }: { icon: React.ReactNode; title: string; hiTitle: string; text: string; hiText: string }) {
  return (
    <div className="flex gap-3 rounded border border-line bg-soft/70 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-white text-brand-dark shadow-sm">{icon}</span>
      <span>
        <span className="inline-lang block font-black text-ink">
          <span data-en>{title}</span>
          <span data-hi lang="hi">{hiTitle}</span>
        </span>
        <span className="inline-lang mt-1 block text-muted">
          <span data-en>{text}</span>
          <span data-hi lang="hi">{hiText}</span>
        </span>
      </span>
    </div>
  );
}
