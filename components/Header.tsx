"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { site } from "@/lib/site-data";
import { ButtonLink } from "@/components/ButtonLink";
import { LanguageToggle } from "@/components/LanguageToggle";

const navItems = [
  { href: "/", label: "Home" },
  {
    href: "/#doctor",
    label: "About Us",
    children: [
      { href: "/#doctor", label: "Doctor Profile" },
      { href: "/duty-doctor", label: "Duty Doctor" },
      { href: "/#procedures", label: "Treatments" },
      { href: "/contact", label: "Book Appointment" }
    ]
  },
  {
    href: "/gallery",
    label: "Facilities",
    children: [
      { href: "/gallery", label: "Hospital Gallery" },
      { href: "/gallery", label: "Endoscopy Unit" },
      { href: "/gallery", label: "HDU & Patient Rooms" },
      { href: "/gallery", label: "Equipment" }
    ]
  },
  {
    href: "/#procedures",
    label: "Special Procedures",
    children: [
      { href: "/procedures/endoscopy", label: "Endoscopy" },
      { href: "/procedures/colonoscopy", label: "Colonoscopy" },
      { href: "/procedures/ercp", label: "ERCP" },
      { href: "/procedures/fibroscan", label: "Fibroscan" },
      { href: "/procedures/gi-stenting", label: "GI Stenting" }
    ]
  },
  {
    href: "/#procedures",
    label: "GI Diseases",
    children: [
      { href: "/procedures/gastrointestinal-bleeding-management", label: "GI Bleeding" },
      { href: "/procedures/variceal-banding", label: "Varices" },
      { href: "/procedures/cbd-stone-removal", label: "CBD Stone" },
      { href: "/procedures/pancreatic-duct-stone-removal", label: "Pancreatic Disorders" }
    ]
  },
  {
    href: "/contact#appointment",
    label: "Symptoms",
    children: [
      { href: "/contact#appointment", label: "Abdominal Pain" },
      { href: "/contact#appointment", label: "Acidity / Reflux" },
      { href: "/contact#appointment", label: "Jaundice" },
      { href: "/contact#appointment", label: "Blood in Stool" }
    ]
  },
  {
    href: "/life-at-mgm",
    label: "MGM",
    children: [{ href: "/life-at-mgm", label: "Life@MGM" }]
  },
  { href: "/contact", label: "Contact Us" }
] satisfies Array<{
  href: string;
  label: string;
  children?: Array<{ href: string; label: string }>;
}>;

export function Header() {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <div className="border-b border-line bg-ink text-sm text-white">
        <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-col justify-between gap-2 py-2 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1.5 hover:text-cyan-200">
              <Phone size={15} /> {site.phone}
            </a>
            <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex items-center gap-1.5 hover:text-cyan-200">
              WhatsApp {site.mobile}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/75">
            <span className="inline-flex items-center gap-1.5"><Clock size={15} /> Mon-Sat, 10 AM-6 PM</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> Shaheed Nagar, Agra</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 text-ink shadow-[0_12px_28px_rgba(20,36,43,0.08)] backdrop-blur">
        <div className="mx-auto flex min-h-[88px] w-[min(1560px,calc(100%-32px))] items-center gap-8">
          <Link href="/" className="shrink-0 rounded bg-white p-1" aria-label="Mudgal Gastromedics Hospital home">
            <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} priority className="rounded" style={{ width: "150px", height: "auto" }} />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-5 font-semibold tracking-normal text-ink min-[1280px]:flex xl:gap-7">
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap py-8 text-[15px] font-semibold transition hover:text-[#19c7f3] xl:text-base ${item.label === "Home" ? "text-[#19c7f3]" : ""}`}
                >
                  {item.label}
                  {item.children?.length ? <ChevronDown size={15} strokeWidth={3} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="invisible absolute left-0 top-full min-w-60 translate-y-2 rounded border border-line bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} className="block rounded px-4 py-2.5 text-sm text-ink/80 hover:bg-soft hover:text-brand">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ButtonLink href="/contact#appointment" className="hidden whitespace-nowrap border-coral bg-coral px-7 text-lg hover:bg-brand-dark md:inline-flex">
              <span data-en>Book Appointment</span>
              <span data-hi>बुक करें</span>
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded border border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_10px_24px_rgba(8,64,84,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:text-brand focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 min-[1280px]:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
        {open ? (
          <motion.nav
            className="grid max-h-[calc(100vh-88px)] gap-1 overflow-y-auto border-t border-line bg-white px-5 py-4 font-extrabold text-ink shadow-soft min-[1280px]:hidden"
            initial={reducedMotion ? false : { opacity: 0, y: -8 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`}>
                <Link href={item.href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded px-2 py-3 hover:bg-soft ${item.label === "Home" ? "text-brand" : ""}`}>
                  {item.label}
                  {item.children?.length ? <ChevronDown size={18} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="ml-3 grid border-l border-line pl-3">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm text-ink/70 hover:bg-soft hover:text-brand">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <ButtonLink href="/contact#appointment" className="mt-2">
              Book Appointment
            </ButtonLink>
          </motion.nav>
        ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
