"use client";

import { Send, Phone, MessageCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { procedures, site } from "@/lib/site-data";

export function AppointmentForm() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("Preparing appointment request...");

    try {
      await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {
      // The WhatsApp and email handoff remains available even in static previews.
    }

    const text = encodeURIComponent(
      `Appointment request:\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nPreferred date: ${data.date || "Flexible"}\nMessage: ${data.message || "-"}`
    );
    setStatus(`Request prepared. Please send it on WhatsApp: https://wa.me/${site.whatsapp}?text=${text}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="mb-1 block font-extrabold">Name</span>
        <input name="name" required autoComplete="name" className="min-h-12 w-full rounded border border-line bg-white px-3 transition focus:border-brand" />
      </label>
      <label>
        <span className="mb-1 block font-extrabold">Phone</span>
        <input name="phone" required autoComplete="tel" className="min-h-12 w-full rounded border border-line bg-white px-3 transition focus:border-brand" />
      </label>
      <label>
        <span className="mb-1 block font-extrabold">Service</span>
        <select name="service" required className="min-h-12 w-full rounded border border-line bg-white px-3 transition focus:border-brand">
          <option value="">Select service</option>
          {procedures.slice(0, 10).map((procedure) => (
            <option key={procedure.slug}>{procedure.title}</option>
          ))}
          <option>Gastroenterology Consultation</option>
          <option>Liver Consultation</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block font-extrabold">Preferred Date</span>
        <input name="date" type="date" className="min-h-12 w-full rounded border border-line bg-white px-3 transition focus:border-brand" />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block font-extrabold">Message</span>
        <textarea name="message" className="min-h-28 w-full rounded border border-line bg-white px-3 py-2 transition focus:border-brand" placeholder="Symptoms, preferred time, or appointment notes" />
      </label>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded border border-brand bg-brand px-5 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark">
          <Send size={18} /> Submit Request
        </button>
        <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex min-h-11 items-center gap-2 rounded border border-teal bg-teal px-5 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-teal-dark">
          <MessageCircle size={18} /> WhatsApp Now
        </a>
        <a href={`tel:${site.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-5 font-extrabold text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand">
          <Phone size={18} /> Call Reception
        </a>
      </div>
      {status ? <p className="break-words font-extrabold text-teal-dark md:col-span-2">{status}</p> : null}
    </form>
  );
}
