import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { Section, SectionHead } from "@/components/site/Section";
import { getPublicGalleryItems } from "@/lib/cms-public";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { equipment } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "View hospital exterior, reception, consultation areas, endoscopy unit, HDU, patient rooms, equipment and facilities at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/gallery" }
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Gallery", url: "/gallery" }
  ])
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
      descriptionHi: "अस्पताल आने से पहले प्रवेश, रिसेप्शन और प्रतीक्षा क्षेत्र देखें।",
      items: galleryItems.filter((item) => item.category === "Reception")
    },
    {
      id: "consultation-areas",
      eyebrow: "OPD",
      title: "OPD Consultation Rooms",
      description: "Doctor consultation and duty doctor spaces used for patient evaluation and follow-up.",
      descriptionHi: "मरीज़ के मूल्यांकन और फॉलो-अप के लिए डॉक्टर परामर्श और ड्यूटी डॉक्टर कक्ष।",
      items: galleryItems.filter((item) => item.category === "Consultation Areas")
    },
    {
      id: "endoscopy-unit",
      eyebrow: "Endoscopy",
      title: "Endoscopy Unit",
      description: "Clinical areas and procedure visuals related to endoscopy and advanced gastro procedures.",
      descriptionHi: "एंडोस्कोपी और उन्नत गैस्ट्रो प्रक्रियाओं से संबंधित क्लिनिकल क्षेत्र और प्रक्रिया दृश्य।",
      items: galleryItems.filter((item) => item.category === "Endoscopy Unit")
    },
    {
      id: "ercp-setup",
      eyebrow: "ERCP",
      title: "ERCP Setup",
      description: "Equipment and imaging support used for pancreaticobiliary procedures such as ERCP.",
      descriptionHi: "ईआरसीपी जैसी पैंक्रियाटिकोबिलियरी प्रक्रियाओं के लिए उपयोग किए जाने वाले उपकरण और इमेजिंग सहायता।",
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
      descriptionHi: "करीबी निगरानी की आवश्यकता वाले मरीज़ों के लिए हाई-डिपेंडेंसी और मॉनिटर्ड केयर क्षेत्र।",
      items: galleryItems.filter((item) => item.category === "HDU")
    },
    {
      id: "patient-rooms",
      eyebrow: "Rooms",
      title: "Patient Rooms",
      description: "Patient rooms, lobbies and IPD waiting spaces for admitted patients and attendants.",
      descriptionHi: "भर्ती मरीज़ों और परिजनों के लिए मरीज़ कक्ष, लॉबी और आईपीडी प्रतीक्षा क्षेत्र।",
      items: galleryItems.filter((item) => item.category === "Patient Rooms")
    },
    {
      id: "pharmacy",
      eyebrow: "Support",
      title: "Pharmacy",
      description: "In-house pharmacy support for medicines and patient convenience.",
      descriptionHi: "दवाओं और मरीज़ों की सुविधा के लिए इन-हाउस फार्मेसी सहायता।",
      items: galleryItems.filter((item) => item.title === "Pharmacy")
    },
    {
      id: "equipment",
      eyebrow: "Technology",
      title: "Equipment",
      description: "Clinical equipment used for endoscopy, colonoscopy, ERCP, Fibroscan and therapeutic procedures.",
      descriptionHi: "एंडोस्कोपी, कोलोनोस्कोपी, ईआरसीपी, फाइब्रोस्कैन और चिकित्सीय प्रक्रियाओं के लिए उपयोग किया जाने वाला क्लिनिकल उपकरण।",
      items: equipmentGallery
    },
    {
      id: "accessibility",
      eyebrow: "Access",
      title: "Accessibility Facilities",
      description: "Access points and patient movement support, including lift and arrival areas.",
      descriptionHi: "लिफ्ट और प्रवेश क्षेत्रों सहित, प्रवेश बिंदु और मरीज़ आवागमन सहायता।",
      items: galleryItems.filter((item) => ["Lift", "Entrance", "IPD Waiting Area"].includes(item.title))
    }
  ].filter((section) => section.items.length > 0);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
            <span data-en>Photo Gallery</span>
            <span data-hi lang="hi">फोटो गैलरी</span>
          </p>
          <h1 className="inline-lang max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            <span data-en>Facilities, rooms and equipment</span>
            <span data-hi lang="hi">सुविधाएं, कमरे और उपकरण</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85" data-en>
            Explore Mudgal Gastromedics Hospital, including our reception, consultation rooms, endoscopy unit, HDU, patient rooms and clinical equipment.
          </p>
          <p className="mt-5 max-w-3xl text-lg text-white/85" data-hi lang="hi">
            मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल की सुविधाएं देखें, जिनमें रिसेप्शन, परामर्श कक्ष, एंडोस्कोपी यूनिट, एचडीयू, मरीज़ कक्ष और क्लिनिकल उपकरण शामिल हैं।
          </p>
        </div>
      </section>
      <Section id="hospital-gallery">
        <SectionHead eyebrow="Hospital Gallery" title="All facilities in one place">
          <p data-en>Browse all hospital spaces, patient areas, clinical units and equipment together.</p>
          <p data-hi lang="hi">सभी अस्पताल क्षेत्र, मरीज़ क्षेत्र, क्लिनिकल यूनिट और उपकरण एक साथ देखें।</p>
        </SectionHead>
        <GalleryGrid items={allGalleryItems} />
      </Section>
      {facilitySections.map((section, index) => (
        <Section key={section.id} id={section.id} muted={index % 2 === 0}>
          <SectionHead eyebrow={section.eyebrow} title={section.title}>
            <p data-en>{section.description}</p>
            <p data-hi lang="hi">{section.descriptionHi}</p>
          </SectionHead>
          <GalleryGrid items={section.items} />
        </Section>
      ))}
    </main>
  );
}
