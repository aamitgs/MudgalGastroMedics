import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FloatingActionHub } from "@/components/site/FloatingActionHub";
import { localSeoPages } from "@/lib/local-seo-pages";
import { site } from "@/lib/site-data";

const companyLinks = [
  { href: "/about", label: "About MGM" },
  { href: "/dr-deepak-kumar-sharma-gastroenterologist-agra", label: "Doctor Profile" },
  { href: "/life-at-mgm", label: "Life@MGM" },
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

const areaLinks = localSeoPages.slice(0, 5).map((page) => ({ href: `/areas/${page.slug}`, label: page.title }));

const socialLinks = [
  { label: "WhatsApp Channel", href: "https://whatsapp.com/channel/0029VaLI8y2J93wdMvMwWM2d", color: "#25D366" },
  { label: "Facebook", href: "https://www.facebook.com/MudgalGastromedics", color: "#1877F2" },
  { label: "Instagram", href: "https://www.instagram.com/explore/locations/616704098791502/mudgal-gastromedics/", color: "#E1306C" },
  { label: "X", href: "https://x.com/gastromedics", color: "#000000" },
  { label: "YouTube", href: "https://www.youtube.com/@mudgalgastromedics9355", color: "#FF0000" }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-white px-5 pb-16 pt-14 text-[13px] text-muted md:px-8 md:pb-20">
      <div className="mx-auto w-[min(1500px,calc(100%-24px))]">
        <div className="grid grid-cols-2 items-start gap-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.68fr)_minmax(0,0.68fr)_minmax(0,0.78fr)_minmax(0,0.86fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="w-fit rounded bg-white p-3">
              <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} style={{ width: "192px", height: "auto" }} />
            </div>
            <p className="mt-2 max-w-sm leading-5">
              Agra&apos;s gastro and liver superspeciality centre - expert diagnosis and treatment for digestive, liver and pancreatic conditions.
            </p>
          </div>

          <FooterColumn title="MGM" links={companyLinks} />

          <FooterColumn title="Services" links={serviceLinks} limit={6} />

          <FooterColumn title="Areas Served" links={areaLinks} />

          <div>
            <FooterColumn title="Support" links={supportLinks} limit={6} />
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-ink">Contact Us</h3>
            <div className="grid gap-3">
              <ContactLine icon={<Phone size={16} />} label="Landline" value={site.phone} href={`tel:${site.phone.replace(/\s/g, "")}`} />
              <ContactLine icon={<Phone size={16} />} label="Mobile" value={site.mobile} href={`tel:${site.mobile}`} />
              <ContactLine icon={<MessageCircle size={16} />} label="WhatsApp" value={site.mobile} href={`https://wa.me/${site.whatsapp}`} />
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center text-center lg:col-span-1 lg:block lg:text-left">
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-ink">Check Us Out On Google</h3>
            <a href={site.directionsUrl} target="_blank" rel="noreferrer" className="block w-fit" aria-label="Open MGM on Google Maps">
              <GoogleQr />
            </a>
            <p className="mt-4 text-sm">Scan to view reviews</p>
            <p className="mt-2 max-w-56 text-xs leading-5">Mudgal Gastromedics Hospital, Shaheed Nagar, Agra</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              style={{ color: social.color }}
              className="text-sm font-black tracking-wide transition hover:opacity-80"
            >
              {social.label}
            </a>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Mudgal Gastromedics Hospital.</p>
          <div className="inline-flex w-fit items-center overflow-hidden rounded-full border border-line bg-soft font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 bg-brand-dark px-3 py-1.5 text-white">
              <ShieldCheck size={15} /> Healthcare
            </span>
            <span className="px-3 py-1.5 text-muted">Information Protected</span>
          </div>
          <p>
            Made by{" "}
            <a href="https://www.edata4you.com/" target="_blank" rel="noreferrer" className="font-bold text-ink hover:text-brand-dark">
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
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-ink">{title}</h3>
      <div className="grid gap-1.5 text-xs leading-5">
        {visibleLinks.map((link) => (
          <FooterLink key={link.label} link={link} />
        ))}
        {hiddenLinks.length ? (
          <details className="group/show-more">
            <summary className="mt-1 inline-flex cursor-pointer list-none items-center text-xs font-semibold text-muted transition hover:text-brand-dark [&::-webkit-details-marker]:hidden">
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
    <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-brand-dark">
      {link.label}
    </a>
  ) : (
    <Link href={link.href} prefetch={false} className="hover:text-brand-dark">
      {link.label}
    </Link>
  );
}

function ContactLine({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 shrink-0 text-muted">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
        <a href={href} className="text-[13px] hover:text-brand-dark">{value}</a>
      </div>
    </div>
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
