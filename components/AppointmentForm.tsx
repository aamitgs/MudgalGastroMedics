"use client";

import { CalendarClock, HeartPulse, MessageCircle, Paperclip, Phone, Send, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { procedures, site } from "@/lib/site-data";

const commonSymptoms = [
  "Acidity / reflux",
  "Abdominal pain",
  "Vomiting",
  "Loose motion",
  "Constipation",
  "Jaundice",
  "Blood in stool",
  "Black stool",
  "Weight loss",
  "Bloating / gas",
  "Loss of appetite",
  "Difficulty swallowing",
  "Nausea",
  "Fatty liver concern",
  "Pancreatitis pain",
  "Liver swelling / ascites"
];

export function AppointmentForm() {
  const [status, setStatus] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const fieldClass = "min-h-14 w-full rounded-lg border border-line bg-white px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition placeholder:text-muted/65 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
  const optionClass = "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm transition hover:border-brand hover:bg-soft/45";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const report = formData.get("report");
    const reportFileName = report instanceof File && report.name ? report.name : "";
    const symptoms = formData.getAll("symptoms").map(String).filter(Boolean);
    const data = Object.fromEntries(formData.entries());
    const payload = { ...data, symptoms, report: reportFileName };
    setStatus("Preparing appointment request...");

    try {
      await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      // The WhatsApp and email handoff remains available even in static previews.
    }

    const text = encodeURIComponent(
      `Appointment request:\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || "-"}\nAge: ${data.age || "-"}\nGender: ${data.gender || "-"}\nPatient type: ${data.patientType || "-"}\nPreferred contact: ${data.contactMethod || "Phone / WhatsApp"}\nService: ${data.service}\nPreferred date: ${data.date || "Flexible"}\nPreferred time: ${data.timeSlot || "Flexible"}\nPriority: ${data.priority || "Routine"}\nSymptoms: ${symptoms.length ? symptoms.join(", ") : "-"}\nDuration: ${data.duration || "-"}\nCurrent medicines/allergies: ${data.medicines || "-"}\nNeeds assistance: ${data.assistance ? "Yes" : "No"}\nReport attached: ${reportFileName || "No"}\nMessage: ${data.message || "-"}`
    );
    setStatus(`Request prepared. Please send it on WhatsApp: https://wa.me/${site.whatsapp}?text=${text}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="overflow-hidden rounded-xl border border-line/80 bg-[linear-gradient(135deg,#ffffff,#f7fbfb)] shadow-[0_20px_55px_rgba(8,64,84,0.08)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-brand">
              <UserRound size={18} />
            </span>
            <div>
              <p className="font-bold text-ink">Patient details</p>
              <p className="text-sm text-muted">Basic details help reception prepare your appointment.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-12">
          <label className="lg:col-span-4">
            <span className="mb-2 block text-sm font-semibold text-ink">Patient Name</span>
            <input name="name" required autoComplete="name" className={fieldClass} placeholder="Full name" />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Phone</span>
            <input name="phone" required autoComplete="tel" inputMode="tel" className={fieldClass} placeholder="Mobile number" />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-ink">Age</span>
            <input name="age" type="number" min="0" max="120" inputMode="numeric" className={fieldClass} placeholder="Years" />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Gender</span>
            <select name="gender" className={fieldClass}>
              <option value="">Select gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </label>
          <label className="lg:col-span-5">
            <span className="mb-2 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" autoComplete="email" className={fieldClass} placeholder="Optional email" />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Preferred Contact</span>
            <select name="contactMethod" className={fieldClass}>
              <option>Phone / WhatsApp</option>
              <option>Call only</option>
              <option>WhatsApp only</option>
              <option>Email</option>
            </select>
          </label>
          <div className="lg:col-span-4">
            <p className="mb-2 text-sm font-semibold text-ink">Patient Type</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["New Patient", "Follow-up Visit"].map((option) => (
                <label key={option} className={optionClass}>
                  <input type="radio" name="patientType" value={option} className="h-4 w-4 accent-brand" />
                  <span className="text-sm font-semibold text-ink">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_20px_55px_rgba(8,64,84,0.07)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-brand">
              <CalendarClock size={18} />
            </span>
            <div>
              <p className="font-bold text-ink">Appointment preference</p>
              <p className="text-sm text-muted">Choose the care type and a convenient visit window.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-12">
          <label className="lg:col-span-6">
            <span className="mb-2 block text-sm font-semibold text-ink">Service</span>
            <select name="service" required className={fieldClass}>
              <option value="">Select service</option>
              {procedures.slice(0, 10).map((procedure) => (
                <option key={procedure.slug}>{procedure.title}</option>
              ))}
              <option>Gastroenterology Consultation</option>
              <option>Liver Consultation</option>
            </select>
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Preferred Date</span>
            <input name="date" type="date" className={fieldClass} />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Preferred Time</span>
            <select name="timeSlot" className={fieldClass}>
              <option>Flexible</option>
              <option>10 AM-1 PM</option>
              <option>1 PM-4 PM</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line/80 bg-[linear-gradient(135deg,#ffffff,#f7fbfb)] shadow-[0_20px_55px_rgba(8,64,84,0.08)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-brand">
              <HeartPulse size={18} />
            </span>
            <div>
              <p className="font-bold text-ink">Symptoms and support</p>
              <p className="text-sm text-muted">Optional details help the team guide the right next step.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-12">
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Priority</span>
            <select name="priority" className={fieldClass}>
              <option>Routine</option>
              <option>Soon</option>
              <option>Urgent symptoms</option>
            </select>
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink">Symptom Duration</span>
            <select name="duration" className={fieldClass}>
              <option value="">Select duration</option>
              <option>Less than 24 hours</option>
              <option>1-3 days</option>
              <option>1 week</option>
              <option>More than 1 week</option>
              <option>Long-term / recurring</option>
            </select>
          </label>
          <label className="lg:col-span-6">
            <span className="mb-2 block text-sm font-semibold text-ink">Current Medicines / Allergies</span>
            <input name="medicines" className={fieldClass} placeholder="Medicine names, allergies, or leave blank" />
          </label>
          <div className="lg:col-span-12">
            <p className="mb-2 text-sm font-semibold text-ink">Common symptoms</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {commonSymptoms.map((option) => (
                <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-sm transition hover:border-brand hover:bg-soft/45">
                  <input type="checkbox" name="symptoms" value={option} className="h-4 w-4 accent-brand" />
                  <span className="font-semibold text-ink">{option}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="lg:col-span-12">
            <span className="mb-2 block text-sm font-semibold text-ink">Message</span>
            <textarea name="message" className="min-h-32 w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition placeholder:text-muted/65 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" placeholder="Main concern, preferred time, prior diagnosis, or appointment notes" />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm transition hover:border-brand hover:bg-soft/45 lg:col-span-6">
            <input type="checkbox" name="assistance" value="Wheelchair / attendant assistance requested" className="mt-1 h-4 w-4 accent-brand" />
            <span>
              <span className="block font-semibold text-ink">Need wheelchair or attendant assistance</span>
              <span className="text-sm text-muted">Select this if the patient needs movement support during the visit.</span>
            </span>
          </label>
          <label className="block lg:col-span-6">
            <span className="mb-2 block text-sm font-semibold text-ink">Attach Report</span>
            <span className="flex min-h-[76px] cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-soft/45 px-4 py-3 text-muted shadow-sm transition hover:border-brand hover:bg-soft">
              <Paperclip className="shrink-0 text-brand" size={19} />
              <span className="grid gap-0.5">
                <span className="font-semibold text-ink">Upload report, prescription, or test file</span>
                <span className="text-xs">{selectedReport || "PDF, JPG, PNG, or image files. Optional."}</span>
              </span>
              <input
                name="report"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                className="sr-only"
                onChange={(event) => setSelectedReport(event.currentTarget.files?.[0]?.name ?? "")}
              />
            </span>
          </label>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-5 font-bold tracking-[0.01em] text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(8,145,178,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <Send size={18} /> Submit Request
        </button>
        <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-5 font-bold tracking-[0.01em] text-white shadow-[0_18px_42px_rgba(5,150,105,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(5,150,105,0.38),inset_0_1px_0_rgba(255,255,255,0.26)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <MessageCircle size={18} /> WhatsApp Now
        </a>
        <a href={`tel:${site.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] px-5 font-bold tracking-[0.01em] text-ink shadow-[0_18px_42px_rgba(8,64,84,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:text-brand active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <Phone size={18} /> Call Reception
        </a>
      </div>
      {status ? <p className="break-words rounded border border-teal/20 bg-soft/80 p-3 text-sm font-semibold text-teal-dark md:col-span-2">{status}</p> : null}
    </form>
  );
}
