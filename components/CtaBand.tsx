import { ButtonLink } from "@/components/ButtonLink";
import { fullAddress, site } from "@/lib/site-data";
import { Clock, MapPin } from "lucide-react";

export function CtaBand() {
  return (
    <section aria-label="Book an appointment" className="bg-[linear-gradient(135deg,#082f3a,#0b3a46_48%,#075f59)] py-16 text-white">
      <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
        <div className="relative isolate overflow-hidden rounded border border-white/12 bg-white/8 p-6 shadow-[0_30px_90px_rgba(2,22,29,0.24)] backdrop-blur md:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-cyan-100/12" />
          <div aria-hidden="true" className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-brand via-gold to-teal" />
          <div className="relative grid gap-8 xl:grid-cols-[1fr_0.72fr] xl:items-stretch">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Need Expert Gastro & Liver Care?
              </div>
              <h2 className="max-w-3xl text-4xl font-bold leading-[1.06] md:text-6xl">Book your appointment today.</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/76">
                Call {site.phone} or WhatsApp {site.mobile}. Address: {fullAddress}
              </p>
              <div className="mt-5 flex max-w-xl gap-3 rounded border border-white/14 bg-white/8 p-4 text-white/78">
                <Clock className="mt-1 shrink-0 text-cyan-100" size={19} />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Business Hours</p>
                  <p className="mt-1">OPD: Mon-Sat, 11 AM-6 PM</p>
                  <p className="mt-1 text-sm text-white/62">Hospital operates 24/7. Call reception for urgent assistance.</p>
                </div>
              </div>
              <div className="mt-5 grid max-w-3xl gap-3 md:grid-cols-3">
                <ButtonLink href="/contact#appointment" className="min-h-13 px-6">Book Appointment</ButtonLink>
                <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-h-13 px-6">WhatsApp</ButtonLink>
                <ButtonLink href={`tel:${site.phone}`} variant="ghost" className="min-h-13 border-white/20 bg-white text-ink">Call Reception</ButtonLink>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="overflow-hidden rounded border border-white/16 bg-white/10 shadow-[0_18px_48px_rgba(2,22,29,0.2)]">
                <iframe
                  className="h-72 w-full border-0"
                  src={site.mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mudgal Gastromedics Hospital map"
                />
                <div className="border-t border-white/16 bg-[#082f3a]/92 p-4 shadow-[0_16px_40px_rgba(2,22,29,0.3)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Visit MGM</p>
                  <h3 className="mt-1 text-xl font-bold text-white">Find the hospital</h3>
                  <div className="mb-3 mt-3 flex items-start gap-2 text-sm text-white/78">
                    <MapPin className="mt-0.5 shrink-0 text-cyan-100" size={17} />
                    <span>
                      16 HIG, Shaheed Nagar, Agra
                      <span className="mt-1 block text-white/62">Landmark: Behind Shaheed Nagar Police Chowki</span>
                    </span>
                  </div>
                  <ButtonLink href={site.directionsUrl} variant="ghost" className="min-h-11 w-full border-white/20 bg-white text-ink">
                    Get Directions
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
