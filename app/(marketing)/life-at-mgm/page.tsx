import type { Metadata } from "next";
import { CakeSlice, Camera, HeartHandshake, PartyPopper, Sparkles, Trophy, Users } from "lucide-react";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  title: "Life@MGM",
  description: "Staff celebrations, birthdays, festivals, team events and workplace moments at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/life-at-mgm" }
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Life@MGM", url: "/life-at-mgm" }
  ])
};

const celebrationCategories = [
  {
    title: "Birthdays",
    titleHi: "जन्मदिन",
    description: "Warm team celebrations that recognize people beyond their roles.",
    descriptionHi: "टीम के जन्मदिन समारोह जो लोगों को उनकी भूमिका से परे पहचानते हैं।",
    icon: CakeSlice
  },
  {
    title: "Festivals",
    titleHi: "त्योहार",
    description: "Shared cultural moments that keep the workplace connected.",
    descriptionHi: "साझा सांस्कृतिक पल जो कार्यस्थल को जोड़े रखते हैं।",
    icon: Sparkles
  },
  {
    title: "Team Events",
    titleHi: "टीम कार्यक्रम",
    description: "Staff gatherings, learning moments and everyday teamwork.",
    descriptionHi: "स्टाफ सभाएं, सीखने के पल और रोज़मर्रा की टीमवर्क।",
    icon: Users
  },
  {
    title: "Milestones",
    titleHi: "उपलब्धियां",
    description: "Hospital achievements, anniversaries and special occasions.",
    descriptionHi: "अस्पताल की उपलब्धियां, वर्षगांठ और विशेष अवसर।",
    icon: Trophy
  }
];

const cultureValues = [
  ["Care", "देखभाल", "A respectful environment for patients, attendants and team members.", "मरीज़ों, परिजनों और टीम सदस्यों के लिए एक सम्मानजनक वातावरण।"],
  ["Teamwork", "टीमवर्क", "Clinical and support teams working together through busy hospital days.", "व्यस्त अस्पताल के दिनों में क्लिनिकल और सहायक टीमें मिलकर काम करती हैं।"],
  ["Learning", "सीखना", "Continuous improvement around patient communication, safety and service.", "मरीज़ संवाद, सुरक्षा और सेवा में निरंतर सुधार।"],
  ["Celebration", "उत्सव", "Recognizing the people who make the hospital experience warmer.", "उन लोगों को पहचानना जो अस्पताल के अनुभव को और गर्मजोशी भरा बनाते हैं।"]
];

export default function LifeAtMgmPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Life@MGM</p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              <span data-en>The people, moments and culture behind MGM</span>
              <span data-hi lang="hi">एमजीएम के पीछे के लोग, पल और संस्कृति</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>
              A curated space for staff celebrations, festivals, birthdays, milestones and everyday team moments at Mudgal Gastromedics Hospital.
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">
              मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में स्टाफ समारोहों, त्योहारों, जन्मदिनों, उपलब्धियों और रोज़मर्रा के टीम पलों के लिए एक विशेष स्थान।
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Team Moments", "टीम के पल", "Birthdays, festivals and gatherings", "जन्मदिन, त्योहार और सभाएं"],
              ["Hospital Culture", "अस्पताल संस्कृति", "Care, respect and collaboration", "देखभाल, सम्मान और सहयोग"],
              ["Photo Archive", "फोटो संग्रह", "Approved photos ready to publish", "प्रकाशन के लिए स्वीकृत फ़ोटो तैयार"]
            ].map(([title, titleHi, text, textHi]) => (
              <div key={title} className="rounded border border-white/20 bg-white/12 p-4 shadow-[0_18px_45px_rgba(2,22,29,0.18)] backdrop-blur">
                <p className="inline-lang font-black">
                  <span data-en>{title}</span>
                  <span data-hi lang="hi">{titleHi}</span>
                </p>
                <p className="mt-1 inline-lang text-sm text-white/70">
                  <span data-en>{text}</span>
                  <span data-hi lang="hi">{textHi}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <SectionHead eyebrow="Celebration Gallery" title="Life beyond clinical care">
          <p data-en>Designed as a premium gallery surface for approved staff photographs as they are added.</p>
          <p data-hi lang="hi">यह एक प्रीमियम गैलरी स्थान के रूप में डिज़ाइन किया गया है, जहां स्वीकृत स्टाफ तस्वीरें जोड़ी जाएंगी।</p>
        </SectionHead>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {celebrationCategories.map(({ title, titleHi, description, descriptionHi, icon: Icon }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
            <article className="group h-full rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded bg-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                <Icon size={24} />
              </span>
              <h2 className="inline-lang text-xl font-black">
                <span data-en>{title}</span>
                <span data-hi lang="hi">{titleHi}</span>
              </h2>
              <p className="mt-2 inline-lang text-sm text-muted">
                <span data-en>{description}</span>
                <span data-hi lang="hi">{descriptionHi}</span>
              </p>
            </article>
            </MotionReveal>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded border border-line bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_30%),linear-gradient(135deg,#ecfeff,#ffffff)] p-6 shadow-soft">
            <div className="absolute inset-6 grid grid-cols-3 gap-3 opacity-80">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className={`rounded border border-white/80 bg-white/65 shadow-sm ${index === 1 || index === 5 ? "translate-y-8" : ""} ${index === 3 ? "col-span-2" : ""}`} />
              ))}
            </div>
            <div className="relative z-10 flex min-h-[360px] flex-col justify-end">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-brand text-white shadow-soft">
                <Camera size={26} />
              </span>
              <h2 className="inline-lang max-w-xl text-4xl font-black leading-tight">
                <span data-en>Approved celebration photos can live here beautifully.</span>
                <span data-hi lang="hi">स्वीकृत समारोह तस्वीरें यहां खूबसूरती से प्रदर्शित की जा सकती हैं।</span>
              </h2>
              <p className="mt-3 max-w-lg text-muted" data-en>Upload staff photographs later and this space can become a polished gallery for MGM culture, events and team milestones.</p>
              <p className="mt-3 max-w-lg text-muted" data-hi lang="hi">बाद में स्टाफ तस्वीरें अपलोड करें और यह स्थान एमजीएम संस्कृति, कार्यक्रमों और टीम की उपलब्धियों के लिए एक शानदार गैलरी बन सकता है।</p>
            </div>
          </div>
          <div className="grid gap-5">
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <PartyPopper className="mb-4 text-teal" size={32} />
              <h2 className="inline-lang text-2xl font-black">
                <span data-en>Photos coming soon</span>
                <span data-hi lang="hi">फ़ोटो जल्द आ रही हैं</span>
              </h2>
              <p className="mt-2 text-muted" data-en>Add approved staff photographs to publish them in this gallery.</p>
              <p className="mt-2 text-muted" data-hi lang="hi">इस गैलरी में प्रकाशित करने के लिए स्वीकृत स्टाफ तस्वीरें जोड़ें।</p>
            </div>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <HeartHandshake className="mb-4 text-brand-dark" size={32} />
              <h2 className="inline-lang text-2xl font-black">
                <span data-en>Human side of care</span>
                <span data-hi lang="hi">देखभाल का मानवीय पक्ष</span>
              </h2>
              <p className="mt-2 text-muted" data-en>This page helps patients and visitors see the team culture behind the hospital.</p>
              <p className="mt-2 text-muted" data-hi lang="hi">यह पृष्ठ मरीज़ों और आगंतुकों को अस्पताल के पीछे की टीम संस्कृति दिखाने में मदद करता है।</p>
            </div>
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Culture" title="What Life@MGM should communicate">
          <p data-en>Warmth and professionalism can sit together. This page is designed to show that balance.</p>
          <p data-hi lang="hi">गर्मजोशी और व्यावसायिकता साथ-साथ रह सकते हैं। यह पृष्ठ उसी संतुलन को दिखाने के लिए बनाया गया है।</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cultureValues.map(([title, titleHi, text, textHi]) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="inline-lang text-xl font-black">
                <span data-en>{title}</span>
                <span data-hi lang="hi">{titleHi}</span>
              </h3>
              <p className="mt-2 inline-lang text-muted">
                <span data-en>{text}</span>
                <span data-hi lang="hi">{textHi}</span>
              </p>
            </div>
          ))}
        </div>
      </Section>

    </main>
  );
}
