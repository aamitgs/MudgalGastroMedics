"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock3, Moon, PhoneCall, SunMedium } from "lucide-react";
import { site } from "@/lib/site-data";

const timeZone = "Asia/Kolkata";
const opdWindows = [
  { start: 11 * 60, end: 14 * 60 },
  { start: 17 * 60, end: 18 * 60 }
];
const clockNumbers = Array.from({ length: 12 }, (_, index) => {
  const value = index === 0 ? 12 : index;
  const angle = (value * 30 - 90) * (Math.PI / 180);
  return {
    value,
    x: 120 + 76 * Math.cos(angle),
    y: 120 + 76 * Math.sin(angle)
  };
});
const glassPanelClass =
  "relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.86),rgba(236,254,255,0.62)_48%,rgba(255,255,255,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-28px_70px_rgba(8,64,84,0.07),0_28px_78px_rgba(8,64,84,0.14)] backdrop-blur-2xl";
const glassRowClass =
  "flex items-center justify-between gap-4 rounded-[20px] border border-cyan-100/70 bg-white/60 px-4 py-3 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(8,64,84,0.08)] backdrop-blur-xl";

function getIndiaStatus(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const second = Number(parts.find((part) => part.type === "second")?.value ?? "0");
  const minutes = hour * 60 + minute;
  const isOpenDay = weekday !== "Sun";
  const isOpen = isOpenDay && opdWindows.some(({ start, end }) => minutes >= start && minutes < end);
  const displayTime = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);

  return { displayTime, isOpen, hour, minute, second };
}

export function HeroOpdTimingCard() {
  const [status, setStatus] = useState(() => getIndiaStatus(new Date()));

  useEffect(() => {
    const update = () => setStatus(getIndiaStatus(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const open = status.isOpen;
  const hourAngle = ((status.hour % 12) + status.minute / 60 + status.second / 3600) * 30;
  const minuteAngle = (status.minute + status.second / 60) * 6;
  const secondAngle = status.second * 6;

  return (
    <div className="relative isolate w-full overflow-hidden rounded-[36px] border border-cyan-100/70 bg-white p-3 text-ink shadow-[0_34px_90px_rgba(8,64,84,0.14),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-cyan-100/45 sm:p-4 lg:p-5">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-90 [background-image:radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(211,154,43,0.1),transparent_28%),radial-gradient(circle_at_70%_86%,rgba(16,185,129,0.12),transparent_34%)]" />
      <div aria-hidden="true" className="absolute inset-[1px] -z-10 rounded-[34px] border border-cyan-100/55 bg-white/75" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.32] [background-image:linear-gradient(rgba(8,145,178,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.22)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[36px] p-[3px]"
        style={{
          background: "linear-gradient(115deg, #0891b2 0%, #6ca88a 30%, #d39a2b 48%, #10b981 72%, #8de5d7 100%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude"
        }}
      />
      <div aria-hidden="true" className="absolute bottom-0 left-8 right-8 -z-10 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1fr_1fr] lg:items-stretch">
        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div aria-hidden="true" className="absolute inset-3 rounded-[26px] border border-white/55" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/80 bg-white/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <Clock3 size={15} /> Live India Time
            </div>

            <div className="relative mx-auto mt-7 grid h-56 w-56 shrink-0 place-items-center sm:h-60 sm:w-60">
              <div aria-hidden="true" className="absolute inset-3 rounded-full border border-cyan-200/15 bg-black/30 shadow-[0_0_70px_rgba(34,211,238,0.18)]" />
              <svg viewBox="0 0 240 240" className="relative h-full w-full drop-shadow-[0_28px_60px_rgba(0,0,0,0.48)]" role="img" aria-label={`Analog clock showing ${status.displayTime} IST`}>
                <defs>
                  <radialGradient id="opdClockFace" cx="42%" cy="34%" r="78%">
                    <stop stopColor="#18262a" />
                    <stop offset="0.46" stopColor="#081316" />
                    <stop offset="1" stopColor="#000000" />
                  </radialGradient>
                </defs>
                <circle cx="120" cy="120" r="112" fill="url(#opdClockFace)" />
                <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                {Array.from({ length: 60 }).map((_, index) => (
                  <line
                    key={index}
                    x1="120"
                    y1={index % 5 === 0 ? "18" : "13"}
                    x2="120"
                    y2={index % 5 === 0 ? "30" : "22"}
                    stroke={index % 5 === 0 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.42)"}
                    strokeWidth={index % 5 === 0 ? "3.5" : "2"}
                    strokeLinecap="round"
                    transform={`rotate(${index * 6} 120 120)`}
                  />
                ))}
                {clockNumbers.map((number) => (
                  <text
                    key={number.value}
                    x={number.x}
                    y={number.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.94)"
                    fontSize={number.value === 12 ? "27" : "25"}
                    fontWeight="800"
                  >
                    {number.value}
                  </text>
                ))}
                <line
                  x1="120"
                  y1="120"
                  x2="120"
                  y2="70"
                  stroke="#ffffff"
                  strokeWidth="10"
                  strokeLinecap="round"
                  transform={`rotate(${hourAngle} 120 120)`}
                />
                <line
                  x1="120"
                  y1="120"
                  x2="120"
                  y2="38"
                  stroke="#ffffff"
                  strokeWidth="9"
                  strokeLinecap="round"
                  transform={`rotate(${minuteAngle} 120 120)`}
                />
                <line
                  x1="120"
                  y1="132"
                  x2="120"
                  y2="24"
                  stroke="#d78b24"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  transform={`rotate(${secondAngle} 120 120)`}
                />
                <circle cx="120" cy="120" r="8" fill="#d78b24" stroke="rgba(255,255,255,0.82)" strokeWidth="2.2" />
              </svg>
            </div>

            <p className="mt-7 text-center text-5xl font-black leading-none tracking-tight text-ink drop-shadow-[0_8px_24px_rgba(255,255,255,0.72)] sm:text-6xl">
              {status.displayTime.toLowerCase()}
            </p>
            <p className="mt-4 text-center text-base font-semibold leading-6 text-muted">
              Current time at Shaheed Nagar, Agra
            </p>
          </div>
        </div>

        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div className="flex items-center justify-between gap-4">
            <p className="rounded-full border border-cyan-100/80 bg-white/65 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(8,64,84,0.08)] backdrop-blur-xl">OPD Consultation</p>
            <span className={`h-4 w-4 rounded-full ring-4 ring-white/80 ${open ? "bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.9)]" : "bg-gold shadow-[0_0_22px_rgba(211,154,43,0.85)]"}`} />
          </div>
          <div className="relative mt-5 overflow-hidden rounded-[28px] border border-cyan-100/30 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(8,84,98,0.78)_52%,rgba(4,120,87,0.62))] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_22px_55px_rgba(8,64,84,0.2)] backdrop-blur-2xl">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-200/25 blur-2xl" />
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.72)_1px,transparent_1px)] [background-size:46px_46px]" />
            <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/70">Morning OPD</p>
            <p className="mt-2 text-4xl font-black leading-none text-white sm:text-5xl">11 AM - 2 PM</p>
            <div className="my-5 h-px bg-gradient-to-r from-gold via-cyan-200/70 to-transparent" />
            <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/70">Evening OPD</p>
            <p className="mt-2 text-3xl font-black leading-none text-cyan-100 sm:text-4xl">5 PM - 6 PM</p>
          </div>
          <p className="mt-4 flex items-center gap-2 text-base font-bold text-muted">
            <CalendarDays size={18} /> Monday to Saturday.
          </p>
          <div className="mt-6 grid gap-3 border-t border-cyan-100/70 pt-5">
            <div className={glassRowClass}>
              <span className="text-sm font-bold text-muted">Sunday</span>
              <span className="font-black text-gold">Closed</span>
            </div>
            <div className={glassRowClass}>
              <span className="text-sm font-bold text-muted">Current OPD status</span>
              <span className={`font-black ${open ? "text-emerald-600" : "text-gold"}`}>{open ? "Open" : "Closed"}</span>
            </div>
          </div>
        </div>

        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-[20px] border border-cyan-100/80 bg-white/65 text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <Image src="/mgm-icon.png" alt="" width={40} height={40} className="h-9 w-9 object-contain" />
            </span>
            <div>
              <p className="inline-flex rounded-full border border-cyan-100/80 bg-white/65 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(8,64,84,0.08)] backdrop-blur-xl">Hospital Availability</p>
              <p className="mt-1 text-4xl font-black leading-tight text-ink">24 x 7</p>
            </div>
          </div>
          <p className="mt-5 text-base font-semibold leading-7 text-muted">
            OPD runs during morning and evening consultation hours. Hospital reception and care coordination remain available for patients and attendants.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-4 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <SunMedium className="mb-3 text-gold" size={22} />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Day Care</p>
              <p className="mt-1 font-black text-ink">OPD & Procedures</p>
            </div>
            <div className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-4 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <Moon className="mb-3 text-brand" size={22} />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">After Hours</p>
              <p className="mt-1 font-black text-ink">Hospital Support</p>
            </div>
          </div>
          <div className="mt-4 rounded-[22px] border border-red-100/90 bg-[linear-gradient(145deg,rgba(255,250,250,0.9),rgba(255,255,255,0.68))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_38px_rgba(127,29,29,0.07)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-600">
                  <AlertTriangle size={15} /> Warning signs
                </p>
              </div>
              <a
                href={`tel:${site.mobile.replace(/\s/g, "")}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-ink px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(8,64,84,0.18)] transition hover:-translate-y-0.5 hover:bg-brand"
              >
                <PhoneCall size={17} /> Call Reception
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
