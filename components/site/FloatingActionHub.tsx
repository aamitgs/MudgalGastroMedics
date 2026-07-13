import { ArrowUp, CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";
import { LanguageToggle } from "@/components/site/LanguageToggle";
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
      <LanguageToggle compact className="ring-1 ring-cyan-100/80" />
      <details className="group/hub relative">
        <summary
          className="group grid h-16 w-16 cursor-pointer list-none place-items-center rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_25%,#303030,#151515_58%,#050505)] text-white shadow-[0_22px_54px_rgba(0,0,0,0.36),0_0_0_6px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-100/40 hover:shadow-[0_26px_64px_rgba(8,64,84,0.3),0_0_0_7px_rgba(8,145,178,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 [&::-webkit-details-marker]:hidden"
          aria-label="Open contact actions"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition group-hover:border-cyan-100/35 group-hover:bg-cyan-100/10">
            <MessageCircle size={25} strokeWidth={2.25} />
          </span>
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
      <a
        href="#top"
        className="group grid h-14 w-14 place-items-center rounded-full border border-white/65 bg-[linear-gradient(180deg,#ffffff,#f6fbfc)] text-ink shadow-[0_18px_46px_rgba(8,64,84,0.18),0_0_0_5px_rgba(255,255,255,0.5),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-cyan-100/70 transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:text-brand hover:shadow-[0_22px_58px_rgba(8,145,178,0.22),0_0_0_6px_rgba(8,145,178,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60"
        aria-label="Back to top"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(180deg,#ffffff,#eef8fa)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition group-hover:bg-soft">
          <ArrowUp size={22} strokeWidth={2.3} />
        </span>
      </a>
    </div>
  );
}
