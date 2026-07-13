import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, MapPin, MessageCircle, PlayCircle, Star } from "lucide-react";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { ButtonLink } from "@/components/site/ButtonLink";
import { fullAddress, site } from "@/lib/site-data";

type LocalProminencePanelProps = {
  compact?: boolean;
};

export function LocalProminencePanel({ compact = false }: LocalProminencePanelProps) {
  return (
    <div className="overflow-hidden rounded border border-line bg-white shadow-lift">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-[linear-gradient(135deg,#e8fbfb,#ffffff)] p-6 md:p-8">
          <div className="flex items-center gap-4">
            <BrandIconTile className="h-14 w-14" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Local Trust Signals</p>
              <h2 className="mt-1 text-3xl font-black leading-tight text-ink">
                Reviews, photos and verified location.
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Check the hospital profile, patient review activity, real facility photos and directions before planning a visit to Shaheed Nagar, Agra.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={site.googleBusinessProfileUrl} variant="primary" className="min-h-12">
              Open Google profile <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="/gallery" variant="ghost" className="min-h-12">
              View hospital photos <Camera size={18} />
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          <a
            href={site.googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            className="group rounded border border-[#bfe5ea] bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded bg-[#ecfeff] text-brand">
                <Star size={21} />
              </span>
              <Image
                src="/images/qr/google-reviews-qr-code.png"
                alt="Google profile QR code"
                width={68}
                height={68}
                className="rounded border border-line bg-white p-1"
              />
            </div>
            <h3 className="mt-4 text-xl font-black text-ink">Google profile and reviews</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use Google to check patient review activity, route details, photos and current business profile information.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand">
              View on Google <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </a>

          <Link
            href="/gallery"
            className="group rounded border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
          >
            <span className="grid h-11 w-11 place-items-center rounded bg-[#eefaf5] text-teal">
              <Camera size={21} />
            </span>
            <h3 className="mt-4 text-xl font-black text-ink">Facility photos</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Browse reception, consultation, endoscopy, HDU, rooms, pharmacy and equipment photos from the hospital.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand">
              Open gallery <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>

          <a
            href={site.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="group rounded border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
          >
            <span className="grid h-11 w-11 place-items-center rounded bg-[#ecfeff] text-brand">
              <MapPin size={21} />
            </span>
            <h3 className="mt-4 text-xl font-black text-ink">Verified visit route</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{compact ? site.addressLine1 : fullAddress}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand">
              Get directions <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </a>

          <div className="rounded border border-line bg-white p-5 shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded bg-[#fff8ea] text-[#b7791f]">
              <MessageCircle size={21} />
            </span>
            <h3 className="mt-4 text-xl font-black text-ink">Active channels</h3>
            <div className="mt-4 grid gap-2">
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded border border-line px-3 py-2 text-sm font-black text-ink transition hover:border-brand hover:text-brand">
                WhatsApp reception <ArrowRight size={15} />
              </a>
              <a href={site.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded border border-line px-3 py-2 text-sm font-black text-ink transition hover:border-brand hover:text-brand">
                Facebook page <ArrowRight size={15} />
              </a>
              <a href={site.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded border border-line px-3 py-2 text-sm font-black text-ink transition hover:border-brand hover:text-brand">
                YouTube updates <PlayCircle size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
