"use client";

import { Check, Plus } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionButton } from "@/components/design-system/ActionButton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { WristbandQrButton } from "@/components/hospital-os/WristbandQrButton";
import { metricIcons, type DashboardMetric, type HospitalTrendPoint, type RealtimeMessage } from "@/lib/hospital-os-data";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg border border-line bg-soft/70 ${className}`} aria-hidden="true" />;
}

export function DashboardOverview({
  realtimeMessages,
  metrics,
  series,
  isLoading
}: {
  realtimeMessages: RealtimeMessage[];
  metrics: DashboardMetric[];
  series: HospitalTrendPoint[];
  isLoading: boolean;
}) {
  return (
    <>
      <div className="rounded-lg border border-line bg-surface shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
        <div className="p-5 pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-brand">Hospital command center</p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight md:text-[32px]">
                Clean operating telemetry for clinical, financial, and capacity decisions.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                Live KPIs update in real time. Color is reserved for status, action, and alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                variant="primary"
                onClick={() => window.location.assign("/mudgalgastromedics-os/appointments")}
              >
                <Plus size={16} /> Create Appointment
              </ActionButton>
              <WristbandQrButton />
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 pt-0">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-busy={isLoading} aria-label={isLoading ? "Loading metrics" : undefined}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-[94px]" />)
              : metrics.map((metric) => {
                  const Icon = metricIcons[metric.label];
                  return <MetricCard key={metric.label} {...metric} icon={Icon} />;
                })}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {isLoading ? (
              <>
                <SkeletonBlock className="h-[260px]" />
                <SkeletonBlock className="h-[260px]" />
              </>
            ) : (
              <>
                {/*
                  Both charts plot the last 7 days. The revenue series arrives
                  pre-divided by 100000 (lib/analytics.ts), so the unit has to
                  be stated on the axis — a bare "1.2" against a rupee figure
                  is unreadable otherwise.
                */}
                <figure className="m-0 h-[260px] rounded-lg border border-line bg-mist p-4">
                  <figcaption className="mb-1 text-xs font-bold text-ink">
                    Revenue, last 7 days <span className="font-semibold text-muted">(Rs lakh per day)</span>
                  </figcaption>
                  <ResponsiveContainer width="100%" height="88%">
                    <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--site-line)" vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        width={52}
                        label={{ value: "Rs lakh", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--site-muted)" } }}
                      />
                      <Tooltip formatter={(value: unknown): [string, string] => [`Rs ${Number(value ?? 0)} lakh`, "Revenue"]} />
                      <Legend verticalAlign="bottom" height={18} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revenueFill)" strokeWidth={2} name="Revenue (Rs lakh)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </figure>
                <figure className="m-0 h-[260px] rounded-lg border border-line bg-mist p-4">
                  <figcaption className="mb-1 text-xs font-bold text-ink">
                    OPD footfall, last 7 days <span className="font-semibold text-muted">(patients per day)</span>
                  </figcaption>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart data={series} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke="var(--site-line)" vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        width={52}
                        allowDecimals={false}
                        label={{ value: "Patients", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--site-muted)" } }}
                      />
                      <Tooltip formatter={(value: unknown): [string, string] => [`${Number(value ?? 0)} patients`, "OPD"]} />
                      <Legend verticalAlign="bottom" height={18} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="opd" fill="#16A34A" radius={[6, 6, 0, 0]} name="OPD patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </figure>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-brand">Realtime feed</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Recent Activity</h2>
            </div>
            <StatusBadge tone="success" className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.06em]">Live</StatusBadge>
          </div>
        </div>
        <div className="grid gap-3 p-5 pt-0">
          {realtimeMessages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">
              {isLoading ? "Connecting to live activity…" : "No recent activity yet. New actions across the hospital appear here as they happen."}
            </p>
          ) : (
            realtimeMessages.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-line p-3">
                <Check size={17} className="mt-0.5 text-teal" />
                <p className="text-sm leading-5 text-ink">{item.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
