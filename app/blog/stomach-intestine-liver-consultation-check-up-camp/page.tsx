import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { Section, SectionHead } from "@/components/site/Section";
import { fullAddress, site } from "@/lib/site-data";

const title = "Stomach, Intestine & Liver Consultation and Check-Up Camp";
const hindiTitle = "पेट, आंत और लिवर परामर्श एवं जांच शिविर";
const slug = "/blog/stomach-intestine-liver-consultation-check-up-camp";
const campDate = "July 1, 2026";
const campDay = "Saturday";
const campDateDisplay = "1 July 2026, Saturday";
const hindiCampDateDisplay = "1 जुलाई 2026, शनिवार";
const campTime = "11:00 AM to 5:00 PM";
const hindiCampTime = "सुबह 11 बजे से शाम 5 बजे तक";
const venue = "Mudgal Gastro Medics, 16 HIG, Behind Shaheed Nagar Police Chowki, Shaheed Nagar, Agra";
const hindiVenue = "मुद्गल गैस्ट्रो मेडिक्स, 16 HIG, शहीद नगर पुलिस चौकी के पीछे, शहीद नगर, आगरा";
const registrationFee = "₹200";
const contactNumber = "9828912257";
const englishHashtags = [
  "#Agra",
  "#HealthCamp",
  "#GastroCamp",
  "#LiverCare",
  "#StomachCare",
  "#MedicalCamp",
  "#DrDeepakKumarSharma",
  "#MudgalGastroMedics",
  "#AgraHealth"
];
const hindiHashtags = [
  "#Agra",
  "#HealthCamp",
  "#GastroCamp",
  "#LiverCare",
  "#MudgalGastroMedics",
  "#DrDeepakKumarSharma",
  "#AgraHealth",
  "#MedicalCamp"
];

const campGuide = [
  {
    title: "Who should attend?",
    text: "This camp is suitable for patients with digestive, bowel or liver-related symptoms who need consultation and basic guidance.",
    items: ["Acidity, abdominal pain, bloating or vomiting", "Constipation, diarrhea or blood in stool", "Jaundice, fatty liver or abnormal liver reports", "Need for endoscopy, colonoscopy or FibroScan advice"]
  },
  {
    title: "What is included?",
    text: "The camp includes free consultation with registration, report review and guidance about tests or procedures if clinically needed.",
    items: ["Free consultation", "Blood test discount", "Endoscopy, colonoscopy and FibroScan discount", "Treatment and follow-up guidance"]
  },
  {
    title: "What to bring?",
    text: "Please bring previous records so the doctor can understand your medical history clearly.",
    items: ["Previous prescriptions", "Blood reports and liver function tests", "Ultrasound, CT, MRCP, endoscopy or colonoscopy reports", "List of current medicines and allergies"]
  },
  {
    title: "When to call before visiting",
    text: "Call reception before travelling if symptoms are urgent or severe.",
    items: ["Vomiting blood or black stools", "Severe abdominal pain", "Fever with jaundice", "Persistent vomiting, fainting or severe weakness"]
  }
];

const campFaqs = [
  ["Is consultation free in this camp?", "Yes, consultation is free. Registration is required and the registration fee is ₹200/-."],
  ["Can patients come without registration?", "No. Patients will not be seen without registration."],
  ["What discounts are available?", "Blood tests have 50% discount. Endoscopy, colonoscopy and FibroScan have 25% discount during the camp terms."],
  ["Should I bring old reports?", "Yes. Bring previous prescriptions, blood reports, ultrasound, CT/MRCP, endoscopy, colonoscopy and discharge summaries if available."],
  ["Who should call urgently before visiting?", "Patients with vomiting blood, black stools, severe pain, fever with jaundice, persistent vomiting or fainting should call reception before travelling."],
  ["Where is the camp?", `The camp is at ${venue}.`]
];

export const metadata: Metadata = {
  title,
  description:
    "Archived details for the stomach, intestine and liver consultation and check-up camp held at Mudgal Gastromedics Hospital, Agra on July 1, 2026.",
  alternates: { canonical: slug },
  openGraph: {
    title,
    description: `${campDate}, ${campTime} at ${site.name}, Shaheed Nagar, Agra.`,
    images: ["/images/hospital/campbanner.jpeg"],
    type: "article"
  }
};

export default function CampBlogPostPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: `${site.url}/images/hospital/campbanner.jpeg`,
    datePublished: "2026-07-07",
    dateModified: "2026-07-07",
    author: {
      "@type": "Organization",
      name: site.name
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/mgm-logo.png`
      }
    },
    mainEntityOfPage: `${site.url}${slug}`,
    description: metadata.description
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero-bg py-16 text-white md:py-24">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <Link href="/blog" className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-gold" />
              Archived Camp
            </Link>
            <h1 className="max-w-5xl text-5xl font-black leading-tight md:text-7xl">{title}</h1>
            <p className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-cyan-100 md:text-5xl" lang="hi">
              {hindiTitle}
            </p>
          </div>
          <div className="grid gap-3 rounded border border-white/18 bg-white/12 p-5 text-white shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <Fact icon={<CalendarDays size={18} />} label="Date" value={campDateDisplay} />
            <Fact icon={<Clock size={18} />} label="Timing" value={campTime} />
            <Fact icon={<MapPin size={18} />} label="Location" value="Shaheed Nagar, Agra" />
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <div className="overflow-hidden rounded border border-line/80 bg-white p-2 shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
          <Image
            src="/images/hospital/campbanner.jpeg"
            alt="Mudgal Gastromedics stomach, intestine and liver consultation and check-up camp banner"
            width={1600}
            height={810}
            sizes="(min-width: 1180px) 1180px, calc(100vw - 32px)"
            className="h-auto w-full rounded object-contain"
            priority
          />
        </div>
      </Section>

      <Section className="overflow-hidden pt-0">
        <HeroOpdTimingCard />
      </Section>

      <Section>
        <SectionHead eyebrow="Camp Patient Guide" title="Who should attend and what to prepare">
          <p>This camp has been completed. These archived details are kept for reference.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {campGuide.map((block) => (
            <article key={block.title} className="rounded border border-line bg-white p-5 shadow-soft">
              <h2 className="text-2xl font-black leading-tight text-ink">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{block.text}</p>
              <ul className="mt-4 grid gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={17} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="FAQs" title="Camp FAQs" />
        <div className="grid gap-4 lg:grid-cols-2">
          {campFaqs.map(([question, answer]) => (
            <details key={question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-lg font-black text-ink">{question}</summary>
              <p className="mt-3 leading-relaxed text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-start">
          <article className="grid gap-6">
            <div className="rounded border border-line/80 bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">English Details</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-ink md:text-5xl">{title}</h2>
              <div className="mt-6 grid gap-3 text-lg leading-relaxed text-muted">
                <p><span className="font-bold text-ink">Date:</span> {campDateDisplay}</p>
                <p><span className="font-bold text-ink">Time:</span> {campTime}</p>
                <p><span className="font-bold text-ink">Venue:</span> {venue}</p>
                <p><span className="font-bold text-ink">Free Consultation</span></p>
                <p><span className="font-bold text-ink">Registration Fee:</span> {registrationFee}/-</p>
                <p><span className="font-bold text-ink">Contact:</span> {contactNumber}</p>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-ink">Special Offers</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {[
                    "Blood tests: 50% off",
                    "Endoscopy, Colonoscopy & Fibroscan: 25% off"
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded border border-line bg-soft/60 p-4 text-muted">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={19} />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-6 rounded border border-coral/20 bg-red-50 p-4 font-semibold text-coral">
                Note: Patients will not be seen without registration.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {englishHashtags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-soft/70 px-3 py-1.5 text-sm font-semibold text-teal-dark">{tag}</span>
                ))}
              </div>
            </div>

            <div className="rounded border border-line/80 bg-white p-6 shadow-sm md:p-8" lang="hi">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Hindi Details</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-ink md:text-5xl">{hindiTitle}</h2>
              <div className="mt-6 grid gap-3 text-lg leading-relaxed text-muted">
                <p><span className="font-bold text-ink">दिनांक:</span> {hindiCampDateDisplay}</p>
                <p><span className="font-bold text-ink">समय:</span> {hindiCampTime}</p>
                <p><span className="font-bold text-ink">स्थान:</span> {hindiVenue}</p>
                <p><span className="font-bold text-ink">परामर्श नि:शुल्क</span></p>
                <p><span className="font-bold text-ink">पंजीकरण शुल्क:</span> {registrationFee}/-</p>
                <p><span className="font-bold text-ink">संपर्क:</span> {contactNumber}</p>
              </div>
              <p className="mt-6 rounded border border-coral/20 bg-red-50 p-4 font-semibold text-coral">
                नोट: बिना पंजीकरण के मरीज नहीं देखे जाएंगे।
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {hindiHashtags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-soft/70 px-3 py-1.5 text-sm font-semibold text-teal-dark">{tag}</span>
                ))}
              </div>
            </div>
          </article>

          <aside className="grid gap-5">
            <div className="rounded border border-line/80 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Camp Completed</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                This camp is archived. For current consultation, appointment or future camp information, contact reception.
              </p>
              <AppointmentCtaPanel className="mt-5" layout="stacked" />
            </div>

            <div className="rounded border border-line/80 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Venue</p>
              <h3 className="mt-2 text-xl font-bold text-ink">{site.name}</h3>
              <p className="mt-3 leading-relaxed text-muted">{fullAddress}</p>
              <p className="mt-2 leading-relaxed text-muted">{site.addressLine2}</p>
              <AppointmentCtaPanel className="mt-5" layout="stacked" />
            </div>
          </aside>
        </div>
      </Section>
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded border border-white/16 bg-white/10 p-3">
      <span className="mt-0.5 shrink-0 text-cyan-100">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/58">{label}</p>
        <p className="mt-1 font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
