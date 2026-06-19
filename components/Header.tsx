"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
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
  { href: "/gallery", label: "Hospital" },
  { href: "/contact", label: "Contact Us" }
] satisfies Array<{
  href: string;
  label: string;
  children?: Array<{ href: string; label: string }>;
}>;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-b border-line bg-white text-sm text-ink">
        <div className="mx-auto flex w-[min(1500px,calc(100%-40px))] flex-col justify-between gap-1 py-2 md:flex-row">
          <div>
            <a href={`tel:${site.phone}`}>{site.phone}</a> | <a href={`https://wa.me/${site.whatsapp}`}>{site.mobile}</a>
          </div>
          <div>16 HIG, Shaheed Nagar, Agra | Behind Shaheed Nagar Police Chowki</div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white text-ink shadow-[0_12px_28px_rgba(20,36,43,0.08)]">
        <div className="mx-auto flex min-h-[74px] w-[min(1500px,calc(100%-40px))] items-center gap-8">
          <Link href="/" className="shrink-0" aria-label="Mudgal Gastromedics Hospital home">
            <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} priority className="h-auto w-32 rounded bg-white p-1 md:w-36" />
          </Link>

          <nav className="hidden flex-1 items-center justify-start gap-4 font-extrabold tracking-normal text-ink xl:gap-6 lg:flex">
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap py-6 text-sm transition hover:text-[#19c7f3] xl:text-base ${item.label === "Home" ? "text-[#19c7f3]" : ""}`}
                >
                  {item.label}
                  {item.children?.length ? <ChevronDown size={15} strokeWidth={3} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="invisible absolute left-0 top-full min-w-60 translate-y-2 rounded border border-line bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} className="block rounded px-4 py-2.5 text-sm text-ink/80 hover:bg-soft hover:text-[#19c7f3]">
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
            <ButtonLink href="/contact#appointment" className="hidden whitespace-nowrap md:inline-flex">
              <span data-en>Book Appointment</span>
              <span data-hi>बुक करें</span>
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-10 w-11 place-items-center rounded border border-line bg-white lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="grid gap-1 border-t border-line bg-white px-5 py-4 font-extrabold text-ink shadow-soft lg:hidden">
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`}>
                <Link href={item.href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded px-2 py-3 hover:bg-white ${item.label === "Home" ? "text-[#19c7f3]" : ""}`}>
                  {item.label}
                  {item.children?.length ? <ChevronDown size={18} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="ml-3 grid border-l border-line pl-3">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm text-ink/70 hover:bg-white hover:text-[#19c7f3]">
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
          </nav>
        ) : null}
      </header>
    </>
  );
}
