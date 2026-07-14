"use client";

import { FormEvent, useState } from "react";
import { CalendarCheck, CheckCircle2, MessageCircle, Phone, Send } from "lucide-react";
import { site } from "@/lib/site-data";

const countryCodes = ["+91", "+1", "+44", "+971", "+966", "+974", "+965", "+968", "+61", "+65", "+977", "+880"];

function normalizePhone(value: FormDataEntryValue | null | undefined, countryCode = "+91") {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (countryCode === "+91" && digits.length === 10 && /^[6-9]/.test(digits)) return `+91 ${digits}`;
  if (countryCode === "+91" && digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) return `+91 ${digits.slice(1)}`;
  return `${countryCode} ${digits}`;
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

type BlogConsultationFormProps = {
  articleTitle: string;
  relatedLabel: string;
  category: string;
  className?: string;
  compact?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
};

export function BlogConsultationForm({
  articleTitle,
  relatedLabel,
  category,
  className = "",
  compact = false,
  title = "Ask reception about this article",
  description = "Share your details and the team will guide the right next step.",
  buttonLabel = "Request Guidance"
}: BlogConsultationFormProps) {
  const [message, setMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [requestId, setRequestId] = useState("");
  const fieldClass = "min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const countryCode = String(formData.get("countryCode") || "+91");
    const phone = normalizePhone(formData.get("phone"), countryCode);
    const name = String(formData.get("name") || "").trim();
    const concern = String(formData.get("concern") || "").trim();
    const contactMethod = String(formData.get("contactMethod") || "Phone / WhatsApp");

    if (!name) {
      setMessage("Please enter patient name.");
      setWhatsappLink("");
      return;
    }
    if (!isValidPhone(phone)) {
      setMessage("Please enter a valid phone number with country code if outside India.");
      setWhatsappLink("");
      return;
    }

    const payload = {
      name,
      phone,
      service: "OPD",
      contactMethod,
      priority: category.toLowerCase().includes("bleeding") || articleTitle.toLowerCase().includes("blood") ? "Urgent symptoms" : "Routine",
      symptoms: [category, relatedLabel].filter(Boolean),
      message: `Blog consultation request\nArticle: ${articleTitle}\nConcern: ${concern || "-"}`
    };

    setMessage("Preparing request for reception...");
    setWhatsappLink("");
    setRequestId("");

    let savedId = "";
    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok) savedId = result.appointment?.id ?? "";
    } catch {
      // WhatsApp handoff remains available for static previews.
    }

    const text = encodeURIComponent(
      `Blog consultation request\nArticle: ${articleTitle}\nName: ${name}\nPhone: ${phone}\nPreferred contact: ${contactMethod}\nRelated care: ${relatedLabel}\nConcern: ${concern || "-"}${savedId ? `\nRequest ID: ${savedId}` : ""}`
    );
    setRequestId(savedId);
    setWhatsappLink(`https://wa.me/${site.whatsapp}?text=${text}`);
    setMessage(savedId ? `Request saved as ${savedId}. Send it on WhatsApp for faster reception follow-up.` : "Request prepared. Send it on WhatsApp so reception can guide you.");
  }

  return (
    <form onSubmit={onSubmit} className={`rounded-xl border border-cyan-100/20 bg-[#082f36] p-4 text-white shadow-[0_24px_70px_rgba(8,64,84,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Need help?</p>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-black leading-tight`}>{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cyan-50/78">{description}</p>
        </div>
        <CalendarCheck className="shrink-0 text-cyan-200" size={28} />
      </div>
      <div className={`mt-5 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <input name="name" required autoComplete="name" className={fieldClass} placeholder="Patient name" />
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <select name="countryCode" defaultValue="+91" autoComplete="tel-country-code" className={`${fieldClass} px-2`} aria-label="Country code">
            {countryCodes.map((code) => <option key={code}>{code}</option>)}
          </select>
          <input name="phone" required type="tel" inputMode="tel" autoComplete="tel-national" className={fieldClass} placeholder="Mobile number" />
        </div>
        <select name="contactMethod" className={fieldClass}>
          <option>Phone / WhatsApp</option>
          <option>Call only</option>
          <option>WhatsApp only</option>
        </select>
        <input name="concern" className={fieldClass} placeholder="Main symptom or concern" />
      </div>
      <button type="submit" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 font-black text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5">
        <Send size={17} /> {buttonLabel}
      </button>
      {message ? (
        <div className="mt-4 rounded-lg border border-white/14 bg-white/8 p-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-cyan-50/88"><CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={17} /> {message}</p>
          {requestId ? <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">Request ID: {requestId}</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a href={whatsappLink || `https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] px-3 text-sm font-black text-white">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-black text-ink">
              <Phone size={16} /> Call
            </a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
