"use client";

import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Weather = {
  tempC: number;
  label: string;
  icon: "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "storm";
};

const weatherIcons = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  storm: CloudLightning
} as const;

const istTimeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata"
});

const istDayFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  timeZone: "Asia/Kolkata"
});

/** OPD hours: Mon-Sat, 11:00-14:00 and 17:00-18:00 IST. Hospital operation is 24/7. */
function isHospitalOpen(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: "Asia/Kolkata"
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const minutes = hour * 60 + minute;
  return weekday !== "Sun" && ((minutes >= 11 * 60 && minutes < 14 * 60) || (minutes >= 17 * 60 && minutes < 18 * 60));
}

function greetingFor(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now)
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Digital IST clock + Agra weather chip. The clock is timezone-pinned so it
 * shows hospital time on any device; the weather chip hides itself entirely
 * if the (cached, server-side) weather API is unavailable.
 */
export function LiveClockWeather({ variant }: { variant: "site" | "os" | "launcher" }) {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    // First tick goes through the timer too, keeping this effect body free of
    // synchronous state writes (react-hooks/set-state-in-effect).
    const tick = () => setNow(new Date());
    const firstTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (active && data?.ok) {
          setWeather({ tempC: data.tempC, label: data.label, icon: data.icon });
        }
      } catch {
        // Weather is decorative; stay hidden on failure.
      }
    }

    void loadWeather();
    const refresh = window.setInterval(() => void loadWeather(), 30 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  // Render nothing until mounted so server and client markup always match.
  if (!now) return null;

  const WeatherIcon = weather ? weatherIcons[weather.icon] : null;
  const open = isHospitalOpen(now);

  if (variant === "os") {
    return (
      <div className="hidden min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-sm font-semibold text-[var(--hos-text)] xl:flex" aria-label="Current time and weather in Agra">
        <span className="tabular-nums whitespace-nowrap">{istDayFormat.format(now)} {istTimeFormat.format(now)}</span>
        <span className="text-[var(--hos-muted-text)]">IST</span>
        {weather && WeatherIcon ? (
          <>
            <span aria-hidden="true" className="text-[var(--hos-border)]">|</span>
            <WeatherIcon size={16} className="text-[var(--hos-primary)]" aria-hidden="true" />
            <span className="tabular-nums">{weather.tempC}°C</span>
            <span className="hidden text-[var(--hos-muted-text)] 2xl:inline">{weather.label}</span>
          </>
        ) : null}
      </div>
    );
  }

  if (variant === "launcher") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-bold text-ink">{greetingFor(now)}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold text-muted" aria-label="Current time, OPD status and weather in Agra">
          <span className="tabular-nums whitespace-nowrap">{istDayFormat.format(now)} {istTimeFormat.format(now)} IST</span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-400" : "bg-red-400"}`} />
            {open ? "OPD open now" : "OPD closed"}
            <span className="text-muted/80">· 11 AM-2 PM & 5 PM-6 PM, Mon-Sat. Sunday closed</span>
          </span>
          {weather && WeatherIcon ? (
            <span className="inline-flex items-center gap-1.5">
              <WeatherIcon size={16} className="text-brand" aria-hidden="true" />
              <span className="tabular-nums">{weather.tempC}°C</span>
              <span className="hidden text-muted/80 sm:inline">{weather.label} in Agra</span>
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" aria-label="Current time and weather in Agra">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="sr-only">{open ? "Open now." : "Currently closed."}</span>
      <span className="tabular-nums">{istTimeFormat.format(now)} IST</span>
      {weather && WeatherIcon ? (
        <>
          <WeatherIcon size={15} aria-hidden="true" className="text-cyan-200" />
          <span className="tabular-nums">{weather.tempC}°C</span>
        </>
      ) : null}
    </span>
  );
}
