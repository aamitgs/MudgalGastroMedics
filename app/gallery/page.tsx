import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Section } from "@/components/Section";
import { equipment, galleryItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View hospital exterior, reception, consultation areas, endoscopy unit, HDU, patient rooms, equipment and facilities at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/gallery" }
};

export default function GalleryPage() {
  const equipmentGallery = equipment.map((item) => ({
    category: "Equipment",
    title: item.name,
    src: item.src
  }));

  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Photo Gallery</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Facilities, rooms and equipment</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            Named dummy photos are ready for replacement with real MGM hospital images. Gallery supports categories, lightbox viewing and mobile-friendly browsing.
          </p>
        </div>
      </section>
      <Section>
        <GalleryGrid items={[...galleryItems, ...equipmentGallery]} />
      </Section>
      <CtaBand />
    </main>
  );
}
