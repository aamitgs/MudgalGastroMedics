"use client";

import { MessageCircle, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import type { AppointmentRecord } from "@/lib/appointment-types";
import { site } from "@/lib/site-data";

const fieldClass =
  "min-h-14 w-full rounded-lg border border-line bg-white px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition placeholder:text-muted/65 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function ContactForm() {
  const [resultMessage, setResultMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const payload = { ...data, service: "General Inquiry" };
    setResultMessage("Sending your message...");
    setWhatsappLink("");
    let savedAppointment: AppointmentRecord | null = null;

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok) {
        savedAppointment = result.appointment;
      }
    } catch {
      // The WhatsApp handoff remains available even if the save fails.
    }

    const text = encodeURIComponent(
      `Contact form message:\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || "-"}\nMessage: ${data.message || "-"}`
    );
    setResultMessage(
      savedAppointment
        ? `Message sent (reference ${savedAppointment.id}). Our team will get back to you shortly.`
        : "Message prepared. Please send it on WhatsApp so the team receives it."
    );
    setWhatsappLink(`https://wa.me/${site.whatsapp}?text=${text}`);
    if (savedAppointment) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Your Name</span><span data-hi lang="hi">आपका नाम</span></span>
          <input name="name" required autoComplete="name" className={fieldClass} placeholder="Full name" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Phone</span><span data-hi lang="hi">फ़ोन नंबर</span></span>
          <input name="phone" required autoComplete="tel" inputMode="tel" className={fieldClass} placeholder="Mobile number" />
        </label>
      </div>
      <label>
        <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Email</span><span data-hi lang="hi">ईमेल</span></span>
        <input name="email" type="email" autoComplete="email" className={fieldClass} placeholder="Optional email" />
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Message</span><span data-hi lang="hi">संदेश</span></span>
        <textarea
          name="message"
          required
          className="min-h-32 w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition placeholder:text-muted/65 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          placeholder="How can we help?"
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 font-bold tracking-[0.01em] text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(8,145,178,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60"
      >
        <Send size={18} /> <span data-en>Send Message</span><span data-hi lang="hi">संदेश भेजें</span>
      </button>
      {resultMessage ? (
        <div className="rounded border border-teal/20 bg-soft/80 p-3">
          <p className="text-sm font-semibold text-teal-dark">{resultMessage}</p>
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal/25 bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              <MessageCircle size={16} /> Send on WhatsApp instead
            </a>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
