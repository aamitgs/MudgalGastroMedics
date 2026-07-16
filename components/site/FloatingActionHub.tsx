import { ArrowUp, CalendarCheck, ChevronDown, MapPin, MessageCircle, Phone } from "lucide-react";
import { opdWindows, site } from "@/lib/site-data";

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
      "border-teal/30 bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] text-white shadow-[0_18px_42px_rgba(5,150,105,0.28),inset_0_1px_0_rgba(255,255,255,0.2)]"
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

const opdTiming = `OPD ${opdWindows[0].startLabel}-${opdWindows[0].endLabel}, ${opdWindows[1].startLabel.replace(" PM", "")}-${opdWindows[1].endLabel}`;

export function FloatingActionHub() {
  return (
    <div className="fixed bottom-5 right-4 z-40 md:bottom-7 md:right-6">
      <details className="group/hub relative">
        <summary
          className="group flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border border-cyan-200/22 bg-[rgba(18,49,59,0.94)] px-2.5 py-1 text-white shadow-[0_14px_30px_rgba(8,64,84,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/42 hover:bg-[rgba(8,64,84,0.96)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-100/60 [&::-webkit-details-marker]:hidden"
          aria-label="Open contact actions"
        >
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-50/78 sm:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-cyan-100 shadow-[0_0_0_2px_rgba(34,211,238,0.12)]" />
            Reception
          </span>
          <span className="hidden h-0.5 w-0.5 rounded-full bg-gold/55 sm:block" />
          <span className="hidden text-[10px] font-black text-cyan-100/90 sm:inline sm:text-[11px]">24 x 7</span>
          <span className="hidden h-5 w-px bg-cyan-100/18 xl:block" />
          <span className="hidden text-[10px] font-black text-white/72 xl:inline">{opdTiming}</span>
          <span className="h-5 w-px bg-cyan-100/18" />
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-gold sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-teal shadow-[0_0_10px_rgba(5,150,105,0.54)]" />
            Get Help
            <ChevronDown size={12} strokeWidth={3} className="transition group-open/hub:rotate-180" />
          </span>
        </summary>
        <div className="absolute bottom-16 right-0 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-cyan-100/18 bg-[linear-gradient(135deg,rgba(18,49,59,0.98),rgba(8,64,84,0.96))] p-4 text-white shadow-[0_28px_80px_rgba(8,64,84,0.34),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur">
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Reception help</p>
            <p className="mt-1 text-lg font-black leading-tight">Reach reception quickly</p>
            <p className="mt-2 rounded-lg border border-cyan-100/14 bg-white/10 px-3 py-2 text-sm font-bold text-cyan-50/78">
              {opdTiming}. Sunday closed.
            </p>
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
            <a
              href="#top"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/18 bg-white/8 px-4 text-center font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60"
            >
              <ArrowUp size={18} /> Back to top
            </a>
          </div>
        </div>
      </details>
    </div>
  );
}
