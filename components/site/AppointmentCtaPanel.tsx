import { CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/site/ButtonLink";
import { OpdWaitWidget } from "@/components/site/OpdWaitWidget";
import { site } from "@/lib/site-data";

type AppointmentCtaPanelProps = {
  className?: string;
  layout?: "auto" | "stacked";
};

export function AppointmentCtaPanel({ className = "", layout = "auto" }: AppointmentCtaPanelProps) {
  const gridClass = layout === "stacked" ? "grid gap-3" : "grid gap-3 sm:grid-cols-2";

  return (
    <div className={`rounded-lg border border-white/16 bg-[rgba(255,255,255,0.10)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md ${className}`}>
      <OpdWaitWidget className="mb-3 px-1" />
      <div className={gridClass}>
        <ButtonLink href="/portal#appointment" className="min-h-13 px-5 text-base shadow-[0_18px_46px_rgba(8,145,178,0.42)]">
          <CalendarCheck size={19} /> Book Appointment
        </ButtonLink>
        <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="min-h-13 border-white/35 bg-white/95 px-5 text-base text-ink shadow-[0_18px_46px_rgba(2,22,29,0.24)]">
          <Phone size={19} /> Call Reception
        </ButtonLink>
        <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-h-13 px-5 text-base shadow-[0_18px_46px_rgba(5,150,105,0.38)]">
          <MessageCircle size={19} /> WhatsApp
        </ButtonLink>
        <ButtonLink href={site.directionsUrl} variant="ghost" className="min-h-13 border-white/35 bg-white/95 px-5 text-base text-ink shadow-[0_18px_46px_rgba(2,22,29,0.24)]">
          <MapPin size={19} /> Get Directions
        </ButtonLink>
      </div>
    </div>
  );
}
