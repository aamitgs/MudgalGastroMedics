import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Section, SectionHead, Eyebrow } from "@/components/Section";
import { Stats } from "@/components/Stats";
import { doctor, equipment, fullAddress, galleryItems, patientFacilities, procedures, site, whyChoose } from "@/lib/site-data";

export default function Home() {
  return (
    <main>
      <section className="hero-bg text-white">
        <div className="mx-auto grid min-h-[640px] w-[min(1160px,calc(100%-32px))] items-center gap-10 py-16 lg:grid-cols-[1fr_410px]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">{site.tagline}</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">Mudgal Gastromedics Hospital</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85" data-en>
              A Gastro & Liver Superspeciality Centre in Agra for endoscopy, liver care, ERCP, colonoscopy, GI bleeding management and advanced therapeutic procedures.
            </p>
            <p className="mt-5 max-w-2xl text-lg text-white/85" data-hi>
              आगरा में एंडोस्कोपी, लिवर केयर, ईआरसीपी, कोलोनोस्कोपी और उन्नत गैस्ट्रो उपचार के लिए सुपरस्पेशियलिटी सेंटर।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost">Get Directions</ButtonLink>
            </div>
          </div>

          <aside className="rounded border border-white/50 bg-white/95 p-6 text-ink shadow-soft">
            <h2 className="text-2xl font-black">Need expert gastro & liver care?</h2>
            <p className="mt-2 text-muted">Call {site.phone} or WhatsApp {site.mobile} for appointment assistance.</p>
            <ul className="mt-5 grid gap-3">
              {["Consultant Gastroenterologist & Hepatologist", "Advanced endoscopy and ERCP support", "HDU, pharmacy, lift and accessible entry"].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 text-teal" size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <Section>
        <Stats />
      </Section>

      <Section id="doctor" muted>
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="overflow-hidden rounded border border-line bg-white shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <Image src={doctor.image} alt={`${doctor.name} dummy photo`} width={1200} height={900} />
            <div className="p-6">
              <h2 className="text-3xl font-black">{doctor.name}</h2>
              <p className="text-muted">{doctor.designation} | {doctor.registration}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {doctor.education.map((item) => (
                  <div key={item} className="rounded border border-line bg-soft p-4 font-bold">{item}</div>
                ))}
                <div className="rounded border border-line bg-soft p-4 font-bold">Experience: Max Super Speciality Hospital; MGM 2019-Present</div>
              </div>
            </div>
          </article>
          <div>
            <Eyebrow>Doctor Profile</Eyebrow>
            <h2 className="text-4xl font-black leading-tight md:text-5xl">Focused care for digestive, liver and pancreato-biliary diseases.</h2>
            <p className="mt-5 text-muted">Special interests include liver diseases, therapeutic endoscopy, colonoscopy, ERCP, GI cancer screening, obesity endoscopy and pancreatic disorders.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {doctor.interests.map((interest) => (
                <span key={interest} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-sm font-black text-teal-dark">{interest}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="procedures">
        <SectionHead eyebrow="Treatments" title="Advanced procedures & treatments">
          <p>Individual SEO landing pages are ready for major procedures including endoscopy, colonoscopy, ERCP and liver diagnostics.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {procedures.slice(0, 9).map((procedure) => (
            <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)] hover:border-brand">
              <h3 className="inline-lang text-xl font-black">
                <span data-en>{procedure.title}</span>
                <span data-hi>{procedure.hiTitle}</span>
              </h3>
              <p className="mt-2 text-muted" data-en>{procedure.summary}</p>
              <p className="mt-2 text-muted" data-hi>{procedure.hiSummary}</p>
            </Link>
          ))}
        </div>
        <div className="mt-7 columns-1 gap-6 md:columns-2">
          {procedures.map((procedure) => (
            <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="mb-3 block break-inside-avoid rounded border border-line bg-white px-4 py-3 font-black hover:border-brand hover:text-brand">
              {procedure.title}
            </Link>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Why Choose MGM" title="Patient-centered gastro and liver care" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((item) => (
            <div key={item} className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
              <ShieldCheck className="mb-3 text-teal" />
              <h3 className="text-lg font-black">{item}</h3>
              <p className="mt-2 text-muted">Premium, clean and clinically focused care pathway for patients and families.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Facilities & Infrastructure" title="Built for comfortable clinical care">
          <ButtonLink href="/gallery" variant="ghost">View Gallery</ButtonLink>
        </SectionHead>
        <GalleryGrid items={galleryItems.slice(0, 6)} />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {patientFacilities.map((item) => (
            <div key={item} className="rounded border border-line bg-white p-5">
              <h3 className="font-black">{item}</h3>
              <p className="mt-2 text-sm text-muted">Patient facility information placeholder. Confirm final wording before launch.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Technology" title="Modern medical equipment" />
        <div className="grid gap-5 md:grid-cols-3">
          {equipment.map((item) => (
            <article key={item.name} className="overflow-hidden rounded border border-line bg-white shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
              <Image src={item.src} alt={`${item.name} dummy equipment photo`} width={1200} height={900} />
              <div className="p-5">
                <h3 className="text-xl font-black">{item.name}</h3>
                <p className="mt-2 text-muted"><b>Clinical uses:</b> {item.uses}</p>
                <p className="mt-2 text-muted"><b>Benefits:</b> {item.benefits}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Patient Reviews" title="Dummy testimonials for review">
          <p>Replace these with verified patient reviews and consent-approved content before launch.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {["The staff guided us clearly through consultation and endoscopy preparation.", "Reception, waiting area and procedure communication were comfortable.", "Doctor explained the liver reports and treatment plan in simple language."].map((quote) => (
            <div key={quote} className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
              <p className="text-muted">&quot;{quote}&quot;</p>
              <p className="mt-3 font-black">Patient review placeholder</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Information" title="Timings, emergency policy and accreditation" />
        <div className="grid gap-5 md:grid-cols-3">
          {["Hospital Timings: Mon-Sat, 10:00 AM-6:00 PM. Dummy timing; verify before launch.", "Emergency / After-Hours: For urgent symptoms, call reception immediately. Dummy policy; verify before launch.", "Insurance / TPA: Selected insurance and reimbursement assistance placeholder. Confirm final partners.", "Accreditation: Add verified certificates when available.", "Privacy: Appointment details are used for patient communication only. Final legal text pending.", "Medical Disclaimer: Website content is educational and does not replace medical consultation."].map((item) => (
            <div key={item} className="rounded border border-line bg-white p-6">
              <h3 className="font-black">{item.split(":")[0]}</h3>
              <p className="mt-2 text-muted">{item.substring(item.indexOf(":") + 1).trim()}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="appointment" className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <h2 className="mb-5 text-3xl font-black">Book your appointment</h2>
            <AppointmentForm />
          </div>
          <div className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <h2 className="text-3xl font-black">Visit MGM</h2>
            <p className="mt-2 text-muted">{fullAddress}</p>
            <div className="mt-4 flex items-start gap-3 text-muted"><MapPin className="text-brand" /> Landmark: Behind Shaheed Nagar Police Chowki</div>
            <iframe className="mt-5 h-80 w-full rounded border-0" src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mudgal Gastromedics Hospital map" />
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href={`tel:${site.phone}`}>Call</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost">Directions</ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
