"use client";

import { Check, Plus } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { WristbandQrButton } from "@/components/hospital-os/WristbandQrButton";
import { metricIcons, type DashboardMetric, type HospitalTrendPoint, type RealtimeMessage } from "@/lib/hospital-os-data";

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
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)] shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Hospital command center</p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight md:text-[32px]">
                Clean operating telemetry for clinical, financial, and capacity decisions.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--hos-muted-text)]">
                Live KPIs update in real time. Color is reserved for status, action, and alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="gap-2 bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"
                onClick={() => window.location.assign("/mudgalgastromedics-os/appointments")}
              >
                <Plus size={16} /> Create Appointment
              </Button>
              <WristbandQrButton />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-busy={isLoading} aria-label={isLoading ? "Loading metrics" : undefined}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[94px] rounded-lg border border-[var(--hos-border)]" aria-hidden="true" />)
              : metrics.map((metric) => {
                  const Icon = metricIcons[metric.label];
                  return <MetricCard key={metric.label} {...metric} icon={Icon} />;
                })}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {isLoading ? (
              <>
                <Skeleton className="h-[260px] rounded-lg border border-[var(--hos-border)]" role="status" aria-label="Loading revenue trend" />
                <Skeleton className="h-[260px] rounded-lg border border-[var(--hos-border)]" role="status" aria-label="Loading OPD trend" />
              </>
            ) : (
              <>
                <div className="h-[260px] rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--hos-border)" vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revenueFill)" strokeWidth={2} name="Revenue in lakh" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[260px] rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid stroke="var(--hos-border)" vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="opd" fill="#16A34A" radius={[6, 6, 0, 0]} name="OPD patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card id="realtime-feed" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Realtime feed</p>
              <CardTitle className="mt-1 text-lg">Recent Activity</CardTitle>
            </div>
            <Badge variant="outline" className="border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {realtimeMessages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--hos-border)] p-3 text-sm text-[var(--hos-muted-text)]">
              {isLoading ? "Connecting to live activity…" : "No recent activity yet. New actions across the hospital appear here as they happen."}
            </p>
          ) : (
            realtimeMessages.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--hos-border)] p-3">
                <Check size={17} className="mt-0.5 text-[var(--hos-success)]" />
                <p className="text-sm leading-5 text-[var(--hos-text)]">{item.text}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
