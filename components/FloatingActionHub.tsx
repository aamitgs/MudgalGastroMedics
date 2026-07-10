import { ArrowUp, CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { site } from "@/lib/site-data";

const hubActions = [
  {
    href: "/portal#appointment",
    label: "Book Appointment",
    icon: CalendarCheck,
    className:
      "border-cyan-300/25 bg-[image:var(--site-brand-gradient)] text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)]"
  },
  {
    href: `https://wa.me/${site.whatsapp}`,
    label: "WhatsApp",
    icon: MessageCircle,
    className:
      "border-emerald-300/25 bg-[linear-gradient(135deg,#10b981,#047857)] text-white shadow-[0_18px_42px_rgba(5,150,105,0.32),inset_0_1px_0_rgba(255,255,255,0.2)]"
  },
  {
    href: `tel:${site.mobile.replace(/\s/g, "")}`,
    label: "Call Reception",
    icon: Phone,
    className:
      "border-white/65 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_18px_42px_rgba(8,64,84,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]"
  },
  {
    href: site.directionsUrl,
    label: "Get Directions",
    icon: MapPin,
    className:
      "border-white/65 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_18px_42px_rgba(8,64,84,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]"
  }
];

export function FloatingActionHub() {
  return (
    <div className="fixed bottom-5 right-4 z-40 grid items-start justify-items-end gap-3 md:bottom-7 md:right-6">
      <LanguageToggle compact className="ring-1 ring-black/10" />
      <a
        href="#top"
        className="grid h-12 w-12 place-items-center rounded-full border border-white/60 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_16px_42px_rgba(8,64,84,0.2),inset_0_1px_0_rgba(255,255,255,0.95)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:text-brand focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60"
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </a>
      <details className="group/hub relative">
        <summary
          className="grid h-14 w-14 cursor-pointer list-none place-items-center rounded-full border border-white/15 bg-[#151515] text-white shadow-[0_18px_46px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-[#0f3f45] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 [&::-webkit-details-marker]:hidden"
          aria-label="Open contact actions"
        >
          <MessageCircle size={23} />
        </summary>
        <div className="absolute bottom-16 right-0 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-cyan-100/20 bg-[#082f36]/96 p-4 text-white shadow-[0_28px_80px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Need help?</p>
            <p className="mt-1 text-lg font-black leading-tight">Reach reception quickly</p>
          </div>
          <div className="grid gap-2">
            {hubActions.map(({ href, label, icon: Icon, className }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 text-center font-black transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 ${className}`}
              >
                <Icon size={18} /> {label}
              </a>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
