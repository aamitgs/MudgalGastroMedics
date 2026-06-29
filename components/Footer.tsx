import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Star } from "lucide-react";
import { fullAddress, site } from "@/lib/site-data";

const companyLinks = [
  { href: "/#doctor", label: "About MGM" },
  { href: "/#doctor", label: "Doctor Profile" },
  { href: "/gallery", label: "Facilities" },
  { href: "/contact", label: "Contact" },
  { href: "/contact#appointment", label: "Book Appointment" }
];

const serviceLinks = [
  { href: "/procedures/endoscopy", label: "Endoscopy" },
  { href: "/procedures/colonoscopy", label: "Colonoscopy" },
  { href: "/procedures/ercp", label: "ERCP" },
  { href: "/procedures/fibroscan", label: "Fibroscan" },
  { href: "/procedures/gastrointestinal-bleeding-management", label: "GI Bleeding Care" }
];

const supportLinks = [
  { href: "/contact#appointment", label: "Appointment Form" },
  { href: site.directionsUrl, label: "Get Directions" },
  { href: "/gallery", label: "Hospital Gallery" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#111111] px-5 pb-7 pt-14 text-sm text-[#969696] md:px-8">
      <div className="mx-auto w-[min(1500px,calc(100%-24px))]">
        <div className="grid items-start gap-9 lg:grid-cols-[1.35fr_0.72fr_0.72fr_0.84fr_1.05fr_1fr]">
          <div>
            <div className="w-fit rounded border border-brand/25 bg-white p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} style={{ width: "192px", height: "auto" }} />
            </div>
            <p className="mt-5 max-w-sm leading-6">
              Advanced gastroenterology, hepatology and endoscopy care in Agra with specialized treatment for digestive and liver diseases.
            </p>
            <a
              href={site.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-black text-white transition hover:border-cyan-200/60 hover:bg-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#4285f4]">G</span>
              <span className="flex text-[#ffd43b]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={15} fill="currentColor" />
                ))}
              </span>
              <span>4.8</span>
              <span className="h-5 w-px bg-white/20" />
              <span className="text-xs text-white/55">Google Reviews</span>
            </a>
          </div>

          <FooterColumn title="Company" links={companyLinks} />

          <FooterColumn title="Services" links={serviceLinks} />

          <div>
            <FooterColumn title="Support" links={supportLinks} />
            <div className="mt-7">
              <p className="text-xs font-black uppercase tracking-wider text-white/70">Business Hours</p>
              <p className="mt-3 leading-6">Mon-Sat, 10 AM-6 PM</p>
              <p className="leading-6">Call reception for urgent assistance</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">Contact Us</h3>
            <div className="grid gap-3">
              <ContactLine icon={<Phone size={16} />} label="Landline" value={site.phone} href={`tel:${site.phone}`} />
              <ContactLine icon={<Phone size={16} />} label="Mobile" value={site.mobile} href={`tel:${site.mobile}`} />
              <ContactLine icon={<MessageCircle size={16} />} label="WhatsApp" value={site.mobile} href={`https://wa.me/${site.whatsapp}`} />
              <ContactLine icon={<Mail size={16} />} label="Email" value={site.email} href={`mailto:${site.email}`} />
            </div>
            <div className="mt-4 flex gap-2 text-sm leading-6">
              <MapPin className="mt-1 shrink-0 text-brand" size={17} />
              <span>{fullAddress}</span>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">Check Us Out On Google</h3>
            <a href={site.directionsUrl} target="_blank" rel="noreferrer" className="mx-auto block w-fit lg:mx-0" aria-label="Open MGM on Google Maps">
              <GoogleQr />
            </a>
            <p className="mt-4 text-base">Scan to view reviews</p>
            <p className="mx-auto mt-2 max-w-56 text-xs leading-5 lg:mx-0">Mudgal Gastromedics Hospital, Shaheed Nagar, Agra</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <SocialPill href={site.directionsUrl} label="Google Reviews" />
          <SocialPill href={`https://wa.me/${site.whatsapp}`} label="WhatsApp" icon={<MessageCircle size={16} />} />
          <SocialPill href="#" label="Facebook" icon="f" />
          <SocialPill href="#" label="Instagram" icon="IG" />
          <SocialPill href="#" label="YouTube" icon="YT" />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Mudgal Gastromedics Hospital. Made by{" "}
            <a href="https://www.edata4you.com/" target="_blank" rel="noreferrer" className="font-bold text-white hover:text-cyan-200">
              eData4You
            </a>{" "}
            with ❤️ in Delhi,India.
          </p>
          <div className="inline-flex w-fit items-center overflow-hidden rounded-full border border-white/10 bg-white/10 font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 bg-brand px-3 py-1.5 text-white">
              <ShieldCheck size={15} /> Healthcare
            </span>
            <span className="px-3 py-1.5 text-white/60">Information Protected</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
            <Link href="/terms" className="hover:text-white">Disclaimer</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="fixed bottom-5 right-4 z-40 grid gap-3 md:bottom-7 md:right-6">
        <a href={`mailto:${site.email}`} className="grid h-12 w-12 place-items-center rounded-full bg-[#191919] text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-brand" aria-label="Email MGM">
          <Mail size={18} />
        </a>
        <a href={`https://wa.me/${site.whatsapp}`} className="grid h-12 w-12 place-items-center rounded-full bg-[#191919] text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-teal" aria-label="WhatsApp MGM">
          <MessageCircle size={20} />
        </a>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-white">{title}</h3>
      <div className="grid gap-2 text-sm leading-6">
        {links.map((link) =>
          link.href.startsWith("http") ? (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="hover:text-white">
              {link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

function ContactLine({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 shrink-0 text-white/45">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-white/45">{label}</p>
        <a href={href} className="text-sm hover:text-white">{value}</a>
      </div>
    </div>
  );
}

function SocialPill({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a href={href} target={href === "#" ? undefined : "_blank"} rel={href === "#" ? undefined : "noreferrer"} className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/[0.03] px-4 py-2 text-sm font-black text-white/70 transition hover:border-white/70 hover:bg-white/10 hover:text-white">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs">{icon ?? "G"}</span>
      {label}
    </a>
  );
}

function GoogleQr() {
  return (
    <div className="rounded-[28px] bg-[conic-gradient(#ea4335_0_25%,#fbbc05_0_50%,#34a853_0_75%,#4285f4_0)] p-2 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
      <div className="relative grid h-36 w-36 place-items-center rounded-[20px] bg-white p-3">
        <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1">
          {Array.from({ length: 25 }).map((_, index) => (
            <span key={index} className={`${index % 3 === 0 || index % 7 === 0 ? "bg-black" : "bg-white"} rounded-[2px]`} />
          ))}
        </div>
        <span className="absolute text-2xl font-black text-[#4285f4]">G</span>
      </div>
    </div>
  );
}
