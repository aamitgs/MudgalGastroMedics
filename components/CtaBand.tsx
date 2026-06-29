import { ButtonLink } from "@/components/ButtonLink";
import { fullAddress, site } from "@/lib/site-data";

export function CtaBand() {
  return (
    <section className="bg-ink py-14 text-white">
      <div className="mx-auto flex w-[min(1160px,calc(100%-32px))] flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Need Expert Gastro & Liver Care?</p>
          <h2 className="text-3xl font-black leading-tight md:text-5xl">Book your appointment today.</h2>
          <p className="mt-3 text-white/80">Call {site.phone} or WhatsApp {site.mobile}. Address: {fullAddress}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
          <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
          <ButtonLink href={site.directionsUrl} variant="ghost">Get Directions</ButtonLink>
        </div>
      </div>
    </section>
  );
}
