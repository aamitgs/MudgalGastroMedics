"use client";

import { CalendarCheck, CheckCircle2, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { site } from "@/lib/site-data";

const countryCodes = ["+91", "+1", "+44", "+971", "+966", "+974", "+965", "+968", "+61", "+65", "+977", "+880"];

const blogConsultationSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter patient name."),
    countryCode: z.string(),
    phone: z.string(),
    contactMethod: z.string(),
    concern: z.string()
  })
  .refine((data) => isValidPhoneNumber(normalizePhoneNumber(data.phone, data.countryCode)), {
    message: "Please enter a valid phone number with country code if outside India.",
    path: ["phone"]
  })
  .transform((data) => ({ ...data, phone: normalizePhoneNumber(data.phone, data.countryCode) }));

type BlogConsultationValues = z.infer<typeof blogConsultationSchema>;

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

  const {
    register,
    formState: { errors, isSubmitting },
    submit
  } = useAdvancedForm<BlogConsultationValues>({
    schema: blogConsultationSchema,
    defaultValues: {
      name: "",
      countryCode: "+91",
      phone: "",
      contactMethod: "Phone / WhatsApp",
      concern: ""
    },
    async onValid({ name, phone, contactMethod, concern }) {
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
  });

  return (
    <form onSubmit={submit} noValidate className={`rounded-xl border border-cyan-100/20 bg-[#082f36] p-4 text-white shadow-[0_24px_70px_rgba(8,64,84,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Need help?</p>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-black leading-tight`}>{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cyan-50/78">{description}</p>
        </div>
        <CalendarCheck className="shrink-0 text-cyan-200" size={28} />
      </div>
      <div className={`mt-5 grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <div>
          <input {...register("name")} autoComplete="name" className={fieldClass} placeholder="Patient name" />
          {errors.name ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{errors.name.message}</p> : null}
        </div>
        <div>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
            <select {...register("countryCode")} autoComplete="tel-country-code" className={`${fieldClass} px-2`} aria-label="Country code">
              {countryCodes.map((code) => <option key={code}>{code}</option>)}
            </select>
            <input {...register("phone")} type="tel" inputMode="tel" autoComplete="tel-national" className={fieldClass} placeholder="Mobile number" />
          </div>
          {errors.phone ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{errors.phone.message}</p> : null}
        </div>
        <select {...register("contactMethod")} className={fieldClass} aria-label="Preferred contact method">
          <option>Phone / WhatsApp</option>
          <option>Call only</option>
          <option>WhatsApp only</option>
        </select>
        <input {...register("concern")} className={fieldClass} placeholder="Main symptom or concern" />
      </div>
      <button type="submit" disabled={isSubmitting} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 font-black text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5 disabled:opacity-70">
        <Send size={17} /> {isSubmitting ? "Sending…" : buttonLabel}
      </button>
      {message ? (
        <div className="mt-4 rounded-lg border border-white/14 bg-white/8 p-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-cyan-50/88"><CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={17} /> {message}</p>
          {requestId ? <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">Request ID: {requestId}</p> : null}
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
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
