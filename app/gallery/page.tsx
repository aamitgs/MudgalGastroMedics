import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Section } from "@/components/Section";
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
      <Section>
        <GalleryGrid items={[...galleryItems, ...equipmentGallery]} />
      </Section>
    </main>
  );
}
