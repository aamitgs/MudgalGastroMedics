import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FloatingActionHub } from "@/components/site/FloatingActionHub";
import { localSeoPages } from "@/lib/local-seo-pages";
import { site } from "@/lib/site-data";

const companyLinks = [
  { href: "/about", label: "About MGM" },
  { href: "/dr-deepak-kumar-sharma-gastroenterologist-agra", label: "Doctor Profile" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Facilities" },
  { href: "/contact", label: "Contact" },
  { href: "/portal#appointment", label: "Book Appointment" }
];

const serviceLinks = [
  { href: "/services/gastroenterology", label: "Gastroenterology" },
  { href: "/services/liver-clinic", label: "Liver Clinic" },
  { href: "/services/endoscopy-services", label: "Endoscopy Services" },
  { href: "/services/ercp-bile-duct-care", label: "ERCP & Bile Duct" },
  { href: "/services/fibroscan-fatty-liver-assessment", label: "Fatty Liver" },
  { href: "/services/gi-bleeding-emergency-gastro-care", label: "GI Bleeding Care" },
  { href: "/services/acidity-gerd-ulcer-clinic", label: "Acidity / GERD Clinic" },
  { href: "/services/ibs-constipation-bowel-disorder-clinic", label: "IBS & Bowel Clinic" }
];

const supportLinks = [
  { href: "/portal#appointment", label: "Appointment Form" },
  { href: "/portal", label: "Patient Portal" },
  { href: "/faqs", label: "FAQs" },
  { href: site.directionsUrl, label: "Get Directions" },
  { href: "/gallery", label: "Hospital Gallery" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/patient-rights-responsibilities", label: "Patient Rights" },
  { href: "/refund-cancellation-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/terms", label: "Terms" },
  { href: "/editorial-policy", label: "Editorial Policy" }
];

const areaLinks = [
  { href: "/areas", label: "All Local Care Areas" },
  ...localSeoPages.slice(0, 5).map((page) => ({ href: `/areas/${page.slug}`, label: page.title }))
];

const socialLinks = {
  whatsappChannel: "https://whatsapp.com/channel/0029VaLI8y2J93wdMvMwWM2d",
  facebook: "https://www.facebook.com/MudgalGastromedics",
  youtube: "https://www.youtube.com/@mudgalgastromedics9355"
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#111111] px-5 pb-16 pt-14 text-[13px] text-[#969696] md:px-8 md:pb-20">
      <div className="mx-auto w-[min(1500px,calc(100%-24px))]">
        <div className="grid items-start gap-9 lg:grid-cols-[1.25fr_0.68fr_0.68fr_0.78fr_0.86fr_1fr_1fr]">
          <div>
            <div className="w-fit rounded border border-brand/25 bg-white p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} style={{ width: "192px", height: "auto" }} />
            </div>
            <p className="mt-5 max-w-sm leading-5">
              Advanced gastroenterology, hepatology and endoscopy care in Agra with specialized treatment for digestive and liver diseases.
            </p>
          </div>

          <FooterColumn title="Mudgalgastromedics" links={companyLinks} />

          <FooterColumn title="Services" links={serviceLinks} limit={6} />

          <FooterColumn title="Areas Served" links={areaLinks} />

          <div>
            <FooterColumn title="Support" links={supportLinks} limit={6} />
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">Contact Us</h3>
            <div className="grid gap-3">
              <ContactLine icon={<Phone size={16} />} label="Landline" value={site.phone} href={`tel:${site.phone.replace(/\s/g, "")}`} />
              <ContactLine icon={<Phone size={16} />} label="Mobile" value={site.mobile} href={`tel:${site.mobile}`} />
              <ContactLine icon={<MessageCircle size={16} />} label="WhatsApp" value={site.mobile} href={`https://wa.me/${site.whatsapp}`} />
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">Check Us Out On Google</h3>
            <a href={site.directionsUrl} target="_blank" rel="noreferrer" className="mx-auto block w-fit lg:mx-0" aria-label="Open MGM on Google Maps">
              <GoogleQr />
            </a>
            <p className="mt-4 text-sm">Scan to view reviews</p>
            <p className="mx-auto mt-2 max-w-56 text-xs leading-5 lg:mx-0">Mudgal Gastromedics Hospital, Shaheed Nagar, Agra</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <SocialPill href={socialLinks.whatsappChannel} label="WhatsApp Channel" tone="whatsapp" icon={<MessageCircle size={16} />} />
          <SocialPill href={socialLinks.facebook} label="Facebook" tone="facebook" icon="f" />
          <SocialPill href={socialLinks.youtube} label="YouTube" tone="youtube" icon="YT" />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Mudgal Gastromedics Hospital.</p>
          <div className="inline-flex w-fit items-center overflow-hidden rounded-full border border-white/10 bg-white/10 font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 bg-brand-dark px-3 py-1.5 text-white">
              <ShieldCheck size={15} /> Healthcare
            </span>
            <span className="px-3 py-1.5 text-white/60">Information Protected</span>
          </div>
          <p>
            Made by{" "}
            <a href="https://www.edata4you.com/" target="_blank" rel="noreferrer" className="font-bold text-white hover:text-cyan-200">
              eData4You
            </a>{" "}
            with ❤️ in Delhi,India.
          </p>
        </div>
      </div>

      <FloatingActionHub />
    </footer>
  );
}

function FooterColumn({ title, links, limit }: { title: string; links: Array<{ href: string; label: string }>; limit?: number }) {
  const visibleLinks = typeof limit === "number" ? links.slice(0, limit) : links;
  const hiddenLinks = typeof limit === "number" ? links.slice(limit) : [];

  return (
    <div>
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">{title}</h3>
      <div className="grid gap-1.5 text-[13px] leading-5">
        {visibleLinks.map((link) => (
          <FooterLink key={link.label} link={link} />
        ))}
        {hiddenLinks.length ? (
          <details className="group/show-more">
            <summary className="mt-1 inline-flex cursor-pointer list-none items-center text-[13px] font-semibold text-white/70 transition hover:text-white [&::-webkit-details-marker]:hidden">
              <span className="group-open/show-more:hidden">Show more</span>
              <span className="hidden group-open/show-more:inline">Show fewer</span>
            </summary>
            <div className="mt-2 grid gap-2">
              {hiddenLinks.map((link) => (
                <FooterLink key={link.label} link={link} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function FooterLink({ link }: { link: { href: string; label: string } }) {
  return link.href.startsWith("http") ? (
    <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-white">
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className="hover:text-white">
      {link.label}
    </Link>
  );
}

function ContactLine({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 shrink-0 text-white/45">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-white/45">{label}</p>
        <a href={href} className="text-[13px] hover:text-white">{value}</a>
      </div>
    </div>
  );
}

function SocialPill({ href, label, icon, tone }: { href: string; label: string; icon?: React.ReactNode; tone: "whatsapp" | "facebook" | "youtube" }) {
  const tones = {
    whatsapp: "border-teal/30 bg-[linear-gradient(135deg,rgba(5,150,105,0.22),rgba(255,255,255,0.04))] text-cyan-50 hover:border-teal/70 hover:bg-[linear-gradient(135deg,rgba(5,150,105,0.34),rgba(255,255,255,0.08))] [&_span]:bg-teal/18 [&_span]:text-cyan-100",
    facebook: "border-brand/28 bg-[linear-gradient(135deg,rgba(8,145,178,0.22),rgba(255,255,255,0.04))] text-cyan-50 hover:border-brand/70 hover:bg-[linear-gradient(135deg,rgba(8,145,178,0.34),rgba(255,255,255,0.08))] [&_span]:bg-brand/18 [&_span]:text-cyan-100",
    youtube: "border-coral/28 bg-[linear-gradient(135deg,rgba(220,38,38,0.18),rgba(255,255,255,0.04))] text-cyan-50 hover:border-coral/70 hover:bg-[linear-gradient(135deg,rgba(220,38,38,0.3),rgba(255,255,255,0.08))] [&_span]:bg-coral/18 [&_span]:text-cyan-100"
  };

  return (
    <a
      href={href}
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noreferrer"}
      className={`group inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2 text-[13px] font-black shadow-[0_18px_44px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 hover:-translate-y-1 hover:text-white hover:shadow-[0_24px_60px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.18)] ${tones[tone]}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition group-hover:scale-105">{icon ?? "G"}</span>
      {label}
    </a>
  );
}

function GoogleQr() {
  return (
    <div className="relative h-40 w-40 overflow-hidden rounded-[28px] shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
      <Image
        src="/images/qr/google-reviews-qr-code.png"
        alt=""
        fill
        sizes="160px"
        className="object-contain"
        aria-hidden="true"
      />
      <Image
        src="/images/qr/google-reviews-qr-pattern.png"
        alt="Google review QR code for Mudgal Gastromedics Hospital"
        width={228}
        height={228}
        sizes="126px"
        className="absolute left-[10.9%] top-[10.9%] h-[78.3%] w-[78.3%]"
      />
    </div>
  );
}
