import type { Metadata } from "next";
import { Activity, ArrowRight, BrainCircuit, Building2, ClipboardList, Globe2, LockKeyhole, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PlatformFeatureCard } from "@/components/site/PlatformFeatureCard";
import { Section } from "@/components/site/Section";
import { implementationPhases, platformModules } from "@/lib/platform-data";
import { breadcrumbSchema } from "@/lib/seo-schema";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Digital Hospital Platform", url: "/platform" }
  ])
};

export const metadata: Metadata = {
  title: "Digital Hospital Platform",
  description: "Connected website, patient portal, hospital operations platform and AI planning roadmap for Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/platform" }
};

const moduleIcons = [Globe2, ClipboardList, Smartphone, Building2, BrainCircuit];

export default function PlatformPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg overflow-hidden py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
          <div>
            <p className="inline-lang mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              <span data-en>Operations Platform + Website + Portal + AI</span>
              <span data-hi lang="hi">ऑपरेशन्स प्लेटफ़ॉर्म + वेबसाइट + पोर्टल + एआई</span>
            </p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">
              <span data-en>One connected digital platform for MGM.</span>
              <span data-hi lang="hi">एमजीएम के लिए एक जुड़ा हुआ डिजिटल प्लेटफ़ॉर्म।</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82" data-en>
              The public website remains the patient-facing front desk, while CMS publishing, reception, doctor workflow, billing, reports, pharmacy and AI-assisted planning connect behind it.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82" data-hi lang="hi">
              सार्वजनिक वेबसाइट मरीज़ों के लिए फ्रंट डेस्क बनी रहती है, जबकि सीएमएस प्रकाशन, रिसेप्शन, डॉक्टर वर्कफ़्लो, बिलिंग, रिपोर्ट, फार्मेसी और एआई-सहायता प्राप्त योजना इसके पीछे जुड़ी होती है।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/portal" className="min-h-13 px-6">Patient Portal</ButtonLink>
              <ButtonLink href="/operations" variant="secondary" className="min-h-13 px-6">Operations Platform</ButtonLink>
              <ButtonLink href="/ai-planning" variant="ghost" className="min-h-13 px-6">AI Planning</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="grid gap-3">
              {[
                ["Appointment request", "अपॉइंटमेंट अनुरोध", "Website captures details, reports and symptoms", "वेबसाइट विवरण, रिपोर्ट और लक्षण दर्ज करती है"],
                ["Reception workflow", "रिसेप्शन वर्कफ़्लो", "Staff verifies, schedules and confirms", "स्टाफ सत्यापित करता है, समय तय करता है और पुष्टि करता है"],
                ["Doctor review", "डॉक्टर समीक्षा", "Reports, history and procedure notes stay connected", "रिपोर्ट, इतिहास और प्रक्रिया नोट्स जुड़े रहते हैं"],
                ["Patient follow-up", "मरीज़ फॉलो-अप", "Portal, WhatsApp and reminders close the loop", "पोर्टल, व्हाट्सएप और रिमाइंडर प्रक्रिया पूरी करते हैं"]
              ].map(([title, titleHi, text, textHi], index) => (
                <div key={title} className="flex gap-4 rounded border border-white/12 bg-white/10 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-200/15 text-cyan-100">{index + 1}</span>
                  <span className="inline-lang">
                    <span className="block font-bold">
                      <span data-en>{title}</span>
                      <span data-hi lang="hi">{titleHi}</span>
                    </span>
                    <span className="mt-1 block text-sm text-white/72">
                      <span data-en>{text}</span>
                      <span data-hi lang="hi">{textHi}</span>
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-10 grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand-dark">
              <span data-en>Connected Modules</span>
              <span data-hi lang="hi">जुड़े हुए मॉड्यूल</span>
            </p>
            <h2 className="inline-lang max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">
              <span data-en>Built as one system, released in phases.</span>
              <span data-hi lang="hi">एक प्रणाली के रूप में बनाया गया, चरणों में जारी किया गया।</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted" data-en>
            Each module can launch independently, but the data model should be planned together: patient, appointment, visit, billing, report, inventory and communication records.
          </p>
          <p className="text-lg leading-relaxed text-muted" data-hi lang="hi">
            प्रत्येक मॉड्यूल स्वतंत्र रूप से शुरू किया जा सकता है, लेकिन डेटा मॉडल को एक साथ योजनाबद्ध किया जाना चाहिए: मरीज़, अपॉइंटमेंट, विज़िट, बिलिंग, रिपोर्ट, इन्वेंटरी और संचार रिकॉर्ड।
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {platformModules.map((module, index) => (
            <PlatformFeatureCard key={module.title} {...module} icon={moduleIcons[index]} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="sticky top-28 rounded border border-line/80 bg-white p-7 shadow-[0_24px_70px_rgba(8,64,84,0.1)]">
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand-dark">
              <span data-en>Architecture</span>
              <span data-hi lang="hi">आर्किटेक्चर</span>
            </p>
            <h2 className="inline-lang text-4xl font-bold leading-tight text-ink">
              <span data-en>Recommended system core</span>
              <span data-hi lang="hi">अनुशंसित सिस्टम कोर</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted" data-en>
              Start with a shared patient record and appointment record. Add authenticated roles before adding billing, reports and AI workflows.
            </p>
            <p className="mt-4 leading-relaxed text-muted" data-hi lang="hi">
              एक साझा मरीज़ रिकॉर्ड और अपॉइंटमेंट रिकॉर्ड से शुरुआत करें। बिलिंग, रिपोर्ट और एआई वर्कफ़्लो जोड़ने से पहले प्रमाणित भूमिकाएं जोड़ें।
            </p>
            <div className="mt-6 grid gap-3">
              {[
                [LockKeyhole, "Role-based access for reception, doctor, pharmacy and admin", "रिसेप्शन, डॉक्टर, फार्मेसी और एडमिन के लिए भूमिका-आधारित पहुंच"],
                [ShieldCheck, "Medical data stays private with consent-led report uploads", "सहमति-आधारित रिपोर्ट अपलोड के साथ मेडिकल डेटा निजी रहता है"],
                [MessageCircle, "WhatsApp and SMS updates for confirmations and follow-ups", "पुष्टि और फॉलो-अप के लिए व्हाट्सएप और एसएमएस अपडेट"],
                [Activity, "AI assists routing and summaries, never final diagnosis", "एआई रूटिंग और सारांश में सहायता करता है, कभी अंतिम निदान नहीं करता"]
              ].map(([Icon, text, textHi]) => (
                <div key={text as string} className="flex items-center gap-3 rounded border border-line bg-soft/70 p-3">
                  <Icon className="text-brand-dark" size={19} />
                  <span className="inline-lang font-semibold text-ink">
                    <span data-en>{text as string}</span>
                    <span data-hi lang="hi">{textHi as string}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            {implementationPhases.map((phase) => (
              <article key={phase.phase} className="rounded border border-line/80 bg-white p-6 shadow-sm">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">{phase.phase}</span>
                <h3 className="mt-3 text-2xl font-bold text-ink">{phase.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{phase.text}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded border border-line/80 bg-[linear-gradient(135deg,#0b3a46,#0f766e)] p-8 text-white shadow-[0_28px_80px_rgba(8,64,84,0.18)] md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="inline-lang text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                <span data-en>Phase-one action</span>
                <span data-hi lang="hi">चरण-एक कार्रवाई</span>
              </p>
              <h2 className="inline-lang mt-3 text-4xl font-bold leading-tight md:text-5xl">
                <span data-en>Start from appointments and patient uploads.</span>
                <span data-hi lang="hi">अपॉइंटमेंट और मरीज़ अपलोड से शुरुआत करें।</span>
              </h2>
              <p className="mt-4 max-w-3xl text-white/78" data-en>
                This keeps the public website useful immediately and creates the first operational dataset for reception, portal and operations modules.
              </p>
              <p className="mt-4 max-w-3xl text-white/78" data-hi lang="hi">
                इससे सार्वजनिक वेबसाइट तुरंत उपयोगी बनी रहती है और रिसेप्शन, पोर्टल और ऑपरेशन्स मॉड्यूल के लिए पहला ऑपरेशनल डेटासेट तैयार होता है।
              </p>
            </div>
            <ButtonLink href="/portal#appointment" variant="ghost" className="min-h-13 px-7">
              Open Appointment Flow <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
