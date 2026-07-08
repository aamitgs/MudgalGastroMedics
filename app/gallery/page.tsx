import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Section, SectionHead } from "@/components/Section";
import { getPublicGalleryItems } from "@/lib/cms-public";
import { equipment } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View hospital exterior, reception, consultation areas, endoscopy unit, HDU, patient rooms, equipment and facilities at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/gallery" }
};

export default async function GalleryPage() {
  const galleryItems = await getPublicGalleryItems();
  const equipmentGallery = equipment.map((item) => ({
    category: "Equipment",
    title: item.name,
    src: item.src
  }));
  const allGalleryItems = [...galleryItems, ...equipmentGallery];
  const facilitySections = [
    {
      id: "reception",
      eyebrow: "Reception",
      title: "Reception & Waiting Area",
      description: "Preview the arrival, reception and waiting areas before visiting the hospital.",
      items: galleryItems.filter((item) => item.category === "Reception")
    },
    {
      id: "consultation-areas",
      eyebrow: "OPD",
      title: "OPD Consultation Rooms",
      description: "Doctor consultation and duty doctor spaces used for patient evaluation and follow-up.",
      items: galleryItems.filter((item) => item.category === "Consultation Areas")
    },
    {
      id: "endoscopy-unit",
      eyebrow: "Endoscopy",
      title: "Endoscopy Unit",
      description: "Clinical areas and procedure visuals related to endoscopy and advanced gastro procedures.",
      items: galleryItems.filter((item) => item.category === "Endoscopy Unit")
    },
    {
      id: "ercp-setup",
      eyebrow: "ERCP",
      title: "ERCP Setup",
      description: "Equipment and imaging support used for pancreaticobiliary procedures such as ERCP.",
      items: [
        ...galleryItems.filter((item) => item.title === "CBD Stone Removal"),
        ...equipmentGallery.filter((item) => ["ERCP Scope", "C-Arm Machine"].includes(item.title))
      ]
    },
    {
      id: "hdu",
      eyebrow: "HDU",
      title: "HDU & Day Care",
      description: "High-dependency and monitored care areas for patients needing closer observation.",
      items: galleryItems.filter((item) => item.category === "HDU")
    },
    {
      id: "patient-rooms",
      eyebrow: "Rooms",
      title: "Patient Rooms",
      description: "Patient rooms, lobbies and IPD waiting spaces for admitted patients and attendants.",
      items: galleryItems.filter((item) => item.category === "Patient Rooms")
    },
    {
      id: "pharmacy",
      eyebrow: "Support",
      title: "Pharmacy",
      description: "In-house pharmacy support for medicines and patient convenience.",
      items: galleryItems.filter((item) => item.title === "Pharmacy")
    },
    {
      id: "equipment",
      eyebrow: "Technology",
      title: "Equipment",
      description: "Clinical equipment used for endoscopy, colonoscopy, ERCP, Fibroscan and therapeutic procedures.",
      items: equipmentGallery
    },
    {
      id: "accessibility",
      eyebrow: "Access",
      title: "Accessibility Facilities",
      description: "Access points and patient movement support, including lift and arrival areas.",
      items: galleryItems.filter((item) => ["Lift", "Entrance", "IPD Waiting Area"].includes(item.title))
    }
  ].filter((section) => section.items.length > 0);

  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Photo Gallery</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Facilities, rooms and equipment</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            Explore Mudgal Gastromedics Hospital, including our reception, consultation rooms, endoscopy unit, HDU, patient rooms and clinical equipment.
          </p>
        </div>
      </section>
      <Section id="hospital-gallery">
        <SectionHead eyebrow="Hospital Gallery" title="All facilities in one place">
          <p>Browse all hospital spaces, patient areas, clinical units and equipment together.</p>
        </SectionHead>
        <GalleryGrid items={allGalleryItems} />
      </Section>
      {facilitySections.map((section, index) => (
        <Section key={section.id} id={section.id} muted={index % 2 === 0}>
          <SectionHead eyebrow={section.eyebrow} title={section.title}>
            <p>{section.description}</p>
          </SectionHead>
          <GalleryGrid items={section.items} />
        </Section>
      ))}
    </main>
  );
}
