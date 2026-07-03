import { NextResponse } from "next/server";

/**
 * Current weather for Agra, shown in the site header and Hospital OS toolbar.
 *
 * Provider: Open-Meteo (keyless). The fetch runs server-side only — no visitor
 * data ever reaches the provider — and Next's data cache keeps it to roughly
 * one upstream request per half hour regardless of traffic. Swap the provider
 * by changing this one route; clients only know the shape below.
 */
const AGRA_LATITUDE = 27.1767;
const AGRA_LONGITUDE = 78.0081;

/** WMO weather interpretation codes → short labels + icon groups. */
function describeWeatherCode(code: number): { label: string; icon: "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "storm" } {
  if (code === 0) return { label: "Clear", icon: "sun" };
  if (code <= 2) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Cloudy", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 67) return { label: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "rain" };
  if (code >= 80 && code <= 82) return { label: "Showers", icon: "rain" };
  if (code >= 95) return { label: "Thunderstorm", icon: "storm" };
  return { label: "Weather", icon: "cloud" };
}

export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${AGRA_LATITUDE}&longitude=${AGRA_LONGITUDE}` +
      `&current=temperature_2m,weather_code&timezone=Asia%2FKolkata`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temperature = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof temperature !== "number" || typeof code !== "number") {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    const described = describeWeatherCode(code);
    return NextResponse.json({
      ok: true,
      tempC: Math.round(temperature),
      label: described.label,
      icon: described.icon
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
