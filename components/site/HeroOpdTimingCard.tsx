"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock3, CloudSun, Droplets, Moon, PhoneCall, SunMedium, Wind } from "lucide-react";
import { isOpdOpenNow, opdWindows, site } from "@/lib/site-data";

const timeZone = "Asia/Kolkata";
const weatherEndpoint =
  "https://api.open-meteo.com/v1/forecast?latitude=27.1767&longitude=78.0081&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FKolkata";
const initialClockSnapshot = new Date("2026-01-01T09:00:00.000Z");
type WeatherInfo = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
};

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

function getWeatherSummary(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain possible";
  if (code >= 95) return "Thunderstorm";
  return "Agra weather";
}

function parseWeather(data: unknown): WeatherInfo | null {
  const current = (data as { current?: Record<string, unknown> })?.current;
  const temperature = Number(current?.temperature_2m);
  const humidity = Number(current?.relative_humidity_2m);
  const windSpeed = Number(current?.wind_speed_10m);
  const code = Number(current?.weather_code);

  if (![temperature, humidity, windSpeed, code].every(Number.isFinite)) return null;
  return { temperature, humidity, windSpeed, code };
}

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
  const isOpen = isOpdOpenNow(weekday, minutes);
  const displayTime = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);

  return { displayTime, isOpen, hour, minute, second };
}

export function HeroOpdTimingCard() {
  const [status, setStatus] = useState(() => getIndiaStatus(initialClockSnapshot));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    const update = () => setStatus(getIndiaStatus(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const response = await fetch(weatherEndpoint, { cache: "no-store" });
        if (!response.ok) throw new Error("Weather request failed");
        const nextWeather = parseWeather(await response.json());
        if (!active) return;
        if (nextWeather) {
          setWeather(nextWeather);
          setWeatherError(false);
        } else {
          setWeatherError(true);
        }
      } catch {
        if (active) setWeatherError(true);
      }
    }

    loadWeather();
    const timer = window.setInterval(loadWeather, 30 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
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
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.5),transparent_38%,rgba(8,145,178,0.08))]" />
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

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div aria-hidden="true" className="absolute inset-3 rounded-[26px] border border-white/55" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/80 bg-white/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <Clock3 size={15} /> Live India Time
            </div>

            <div className="relative mx-auto mt-7 grid h-56 w-56 shrink-0 place-items-center sm:h-60 sm:w-60">
              <div aria-hidden="true" className="absolute inset-3 rounded-full border border-cyan-200/15 bg-ink/30 shadow-[0_0_70px_rgba(34,211,238,0.18)]" />
              <svg viewBox="0 0 240 240" className="relative h-full w-full drop-shadow-[0_28px_60px_rgba(8,64,84,0.44)]" role="img" aria-label={`Analog clock showing ${status.displayTime} IST`}>
                <defs>
                  <radialGradient id="opdClockFace" cx="42%" cy="34%" r="78%">
                    <stop stopColor="#164e63" />
                    <stop offset="0.46" stopColor="#12313b" />
                    <stop offset="1" stopColor="#082f3a" />
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
            <div className="mt-5 rounded-[24px] border border-cyan-100/80 bg-white/62 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_42px_rgba(8,64,84,0.09)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-cyan-100/80 bg-cyan-50/70 text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_rgba(8,64,84,0.08)]">
                    <CloudSun size={24} />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-dark">Agra Weather</p>
                    <p className="mt-0.5 text-sm font-bold text-muted">
                      {weather ? getWeatherSummary(weather.code) : weatherError ? "Weather unavailable" : "Updating weather"}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-3xl font-black leading-none text-ink">
                  {weather ? (
                    <>
                      {Math.round(weather.temperature)}
                      <span className="text-xl">&deg;C</span>
                    </>
                  ) : (
                    <span className="text-xl text-muted">--</span>
                  )}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-center gap-2 rounded-[16px] border border-cyan-100/70 bg-white/60 px-3 py-2 text-xs font-black text-muted">
                  <Droplets size={15} className="text-brand-dark" /> {weather ? `${Math.round(weather.humidity)}% humidity` : "Humidity --"}
                </div>
                <div className="flex items-center justify-center gap-2 rounded-[16px] border border-cyan-100/70 bg-white/60 px-3 py-2 text-xs font-black text-muted">
                  <Wind size={15} className="text-brand-dark" /> {weather ? `${Math.round(weather.windSpeed)} km/h` : "Wind --"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div className="flex items-center justify-between gap-4">
            <p className="rounded-full border border-cyan-100/80 bg-white/65 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(8,64,84,0.08)] backdrop-blur-xl">OPD Consultation</p>
            <span className={`h-4 w-4 rounded-full ring-4 ring-white/80 ${open ? "bg-teal shadow-[0_0_24px_rgba(5,150,105,0.78)]" : "bg-gold shadow-[0_0_22px_rgba(211,154,43,0.85)]"}`} />
          </div>
          <div className="relative mt-5 overflow-hidden rounded-[28px] border border-cyan-100/30 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(8,84,98,0.78)_52%,rgba(4,120,87,0.62))] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_22px_55px_rgba(8,64,84,0.2)] backdrop-blur-2xl">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-200/25 blur-2xl" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%,rgba(255,255,255,0.08))]" />
            <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/70">Morning OPD</p>
            <p className="mt-2 text-4xl font-black leading-none text-white sm:text-5xl">{opdWindows[0].startLabel} - {opdWindows[0].endLabel}</p>
            <div className="my-5 h-px bg-gradient-to-r from-gold via-cyan-200/70 to-transparent" />
            <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/70">Evening OPD</p>
            <p className="mt-2 text-3xl font-black leading-none text-cyan-100 sm:text-4xl">{opdWindows[1].startLabel} - {opdWindows[1].endLabel}</p>
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
              <span className={`font-black ${open ? "text-teal" : "text-gold"}`}>{open ? "Open" : "Closed"}</span>
            </div>
          </div>
        </div>

        <div className={`${glassPanelClass} p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-[20px] border border-cyan-100/80 bg-white/65 text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_rgba(8,64,84,0.08)] backdrop-blur-xl">
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
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-4 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <SunMedium className="mb-3 text-gold" size={22} />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Day Care</p>
              <p className="mt-1 font-black text-ink">OPD & Procedures</p>
            </div>
            <div className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-4 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_rgba(8,64,84,0.08)] backdrop-blur-xl">
              <Moon className="mb-3 text-brand-dark" size={22} />
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">After Hours</p>
              <p className="mt-1 font-black text-ink">Hospital Support</p>
            </div>
          </div>
          <div className="mt-4 rounded-[20px] border border-coral/20 bg-[linear-gradient(145deg,rgba(255,250,250,0.9),rgba(255,255,255,0.68))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_38px_rgba(127,29,29,0.07)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-coral">
                  <AlertTriangle size={14} /> Warning signs
                </p>
                <p className="mt-1 overflow-hidden text-sm font-bold leading-5 text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  Call reception before visiting for vomiting blood, black stools, severe pain, fever with jaundice, breathing difficulty or persistent vomiting.
                </p>
              </div>
              <a
                href={`tel:${site.mobile.replace(/\s/g, "")}`}
                className="hidden min-h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-xs font-black text-white shadow-[0_16px_34px_rgba(8,64,84,0.18)] transition hover:-translate-y-0.5 hover:bg-brand sm:inline-flex"
              >
                <PhoneCall size={15} /> Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
