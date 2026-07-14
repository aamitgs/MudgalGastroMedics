"use client";

import { AlertTriangle, CalendarCheck, CheckCircle2, FileText, MapPin, MessageCircle, Paperclip, Phone, Send, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import type { AppointmentRecord } from "@/lib/appointment-types";
import { site } from "@/lib/site-data";

/** Display-only Hindi labels; the submitted symptom value stays English so records remain consistent. */
const symptomHindi: Record<string, string> = {
  "Acidity / reflux": "एसिडिटी / रिफ्लक्स",
  "Abdominal pain": "पेट दर्द",
  "Vomiting": "उल्टी",
  "Loose motion": "दस्त",
  "Constipation": "कब्ज़",
  "Jaundice": "पीलिया",
  "Blood in stool": "मल में खून",
  "Black stool": "काला मल",
  "Weight loss": "वज़न घटना",
  "Bloating / gas": "पेट फूलना / गैस",
  "Loss of appetite": "भूख न लगना",
  "Difficulty swallowing": "निगलने में कठिनाई",
  "Nausea": "जी मिचलाना",
  "Fatty liver concern": "फैटी लिवर की चिंता",
  "Pancreatitis pain": "पैंक्रियास (अग्न्याशय) दर्द",
  "Liver swelling / ascites": "लिवर सूजन / पेट में पानी"
};

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

const appointmentServices = ["OPD", "IPD"];

const countryCodes = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA / Canada" },
  { code: "+44", label: "UK" },
  { code: "+971", label: "UAE" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+974", label: "Qatar" },
  { code: "+965", label: "Kuwait" },
  { code: "+968", label: "Oman" },
  { code: "+61", label: "Australia" },
  { code: "+65", label: "Singapore" },
  { code: "+977", label: "Nepal" },
  { code: "+880", label: "Bangladesh" }
];

const urgentSymptoms = new Set([
  "Vomiting",
  "Jaundice",
  "Blood in stool",
  "Black stool",
  "Weight loss",
  "Pancreatitis pain",
  "Liver swelling / ascites"
]);

function normalizePhoneNumber(value: FormDataEntryValue | null | undefined, countryCode = "+91") {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (countryCode === "+91" && digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) return `+91 ${digits.slice(1)}`;
  if (countryCode === "+91" && digits.length === 10 && /^[6-9]/.test(digits)) return `+91 ${digits}`;
  return `${countryCode} ${digits}`;
}

function isValidPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function normalizePinCode(value: FormDataEntryValue | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

const indiaStates = [
  "Uttar Pradesh",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

export function AppointmentForm() {
  const [resultMessage, setResultMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [appointmentFor, setAppointmentFor] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [savedAppointmentId, setSavedAppointmentId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const fieldClass = "min-h-14 w-full rounded-lg border border-line bg-white px-4 text-base text-ink shadow-[0_12px_28px_rgba(8,64,84,0.08)] transition placeholder:text-muted/65 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
  const optionClass = "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm transition hover:border-brand hover:bg-soft/45";
  const urgentSelected = draft.priority === "Urgent symptoms" || selectedSymptoms.some((symptom) => urgentSymptoms.has(symptom));

  function syncDraft(form: HTMLFormElement) {
    const nextData = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const symptoms = new FormData(form).getAll("symptoms").map(String).filter(Boolean);
    setDraft(nextData);
    setAppointmentFor(nextData.service ?? "");
    setSelectedSymptoms(symptoms);
  }

  function applyAutofill(match: Record<string, string>) {
    const form = formRef.current;
    if (!form) return;
    Object.entries(match).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field || !value) return;
      if (field instanceof RadioNodeList) {
        Array.from(field).forEach((item) => {
          if (item instanceof HTMLInputElement) item.checked = item.value === value;
        });
        return;
      }
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.value = value;
      }
    });
    syncDraft(form);
  }

  async function lookupReturningPatient() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const countryCode = String(formData.get("countryCode") || "+91");
    const phone = normalizePhoneNumber(formData.get("phone"), countryCode);
    if (!isValidPhoneNumber(phone)) {
      setLookupMessage("Enter a valid phone number first.");
      return;
    }
    setIsLookingUp(true);
    setLookupMessage("");
    try {
      const response = await fetch(`/api/appointment/lookup?phone=${encodeURIComponent(phone)}`);
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.match) {
        applyAutofill(result.match);
        setLookupMessage(`Found previous request ${result.match.id}. Details filled for faster booking.`);
      } else {
        setLookupMessage("No previous request found for this number.");
      }
    } catch {
      setLookupMessage("Could not check previous requests right now.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    syncDraft(form);
    const formData = new FormData(form);
    const report = formData.get("report");
    const reportFileName = report instanceof File && report.name ? report.name : "";
    const symptoms = formData.getAll("symptoms").map(String).filter(Boolean);
    const data = Object.fromEntries(formData.entries());
    const countryCode = String(data.countryCode || "+91");
    const phone = normalizePhoneNumber(data.phone, countryCode);
    const postalCode = normalizePinCode(data.postalCode);

    if (!isValidPhoneNumber(phone)) {
      setResultMessage("Please enter a valid phone number with country code if outside India, for example +91 9828912257.");
      setWhatsappLink("");
      return;
    }

    if (postalCode && !/^\d{6}$/.test(postalCode)) {
      setResultMessage("Please enter a valid 6 digit PIN code or leave it blank.");
      setWhatsappLink("");
      return;
    }

    const payload = { ...data, phone, postalCode, symptoms, report: reportFileName };
    setResultMessage("Preparing appointment request...");
    setWhatsappLink("");
    setSavedAppointmentId("");
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
        setSavedAppointmentId(savedAppointment?.id ?? "");
      }
    } catch {
      // The WhatsApp and email handoff remains available even in static previews.
    }

    const text = encodeURIComponent(
      `Appointment request:\nName: ${data.name}\nPhone: ${phone}\nEmail: ${data.email || "-"}\nAge: ${data.age || "-"}\nGender: ${data.gender || "-"}\nAddress: ${data.addressLine || "-"}\nCity: ${data.city || "-"}\nState: ${data.state || "-"}\nPIN code: ${postalCode || "-"}\nPatient type: ${data.patientType || "-"}\nPreferred contact: ${data.contactMethod || "Phone / WhatsApp"}\nAppointment for: ${data.service}\nAdmission reason: ${data.admissionReason || "-"}\nInsurance / TPA: ${data.insuranceTpa || "-"}\nRoom preference: ${data.roomPreference || "-"}\nReferred by: ${data.hasReferral ? data.referredBy || "Yes, name not provided" : "No"}\nPreferred date: ${data.date || "Flexible"}\nPreferred time: ${data.timeSlot || "Flexible"}\nPriority: ${data.priority || "Routine"}\nSymptoms: ${symptoms.length ? symptoms.join(", ") : "-"}\nDuration: ${data.duration || "-"}\nCurrent medicines/allergies: ${data.medicines || "-"}\nNeeds assistance: ${data.assistance ? "Yes" : "No"}\nReport attached: ${reportFileName || "No"}\nMessage: ${data.message || "-"}`
    );
    setResultMessage(
      savedAppointment
        ? `Request saved as ${savedAppointment.id}. Our reception team will confirm shortly — you can also send it on WhatsApp for a faster response.`
        : "Request prepared. Please send it on WhatsApp so reception can act on it."
    );
    setWhatsappLink(`https://wa.me/${site.whatsapp}?text=${text}`);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={(event) => syncDraft(event.currentTarget)} className="grid gap-6">
      <div className="overflow-hidden rounded-xl border border-line/80 bg-[linear-gradient(135deg,#ffffff,#f7fbfb)] shadow-[0_20px_55px_rgba(8,64,84,0.08)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandIconTile className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-bold text-ink"><span data-en>Patient details</span><span data-hi lang="hi">रोगी की जानकारी</span></p>
              <p className="text-sm text-muted">Basic details help reception prepare your appointment.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-12">
          <label className="lg:col-span-4">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Patient Name</span><span data-hi lang="hi">रोगी का नाम</span></span>
            <input name="name" required autoComplete="name" className={fieldClass} placeholder="Full name" />
          </label>
          <div className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Phone</span><span data-hi lang="hi">फ़ोन नंबर</span></span>
            <div className="grid grid-cols-[5.5rem_1fr] gap-2">
              <select name="countryCode" autoComplete="tel-country-code" className={`${fieldClass} px-3`} defaultValue="+91" aria-label="Country code">
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>{country.code}</option>
                ))}
              </select>
              <input name="phone" required type="tel" autoComplete="tel-national" inputMode="tel" className={fieldClass} placeholder="Mobile number" />
            </div>
            <button
              type="button"
              onClick={lookupReturningPatient}
              className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand/15 bg-soft/55 px-3 text-[11px] font-black uppercase tracking-[0.1em] text-brand shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white"
            >
              <CheckCircle2 size={13} /> {isLookingUp ? "Checking" : "Autofill"}
            </button>
            {lookupMessage ? <p className="mt-2 text-xs font-semibold text-muted">{lookupMessage}</p> : null}
          </div>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Age</span><span data-hi lang="hi">आयु</span></span>
            <input name="age" type="number" min="0" max="120" inputMode="numeric" className={fieldClass} placeholder="Years" />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Gender</span><span data-hi lang="hi">लिंग</span></span>
            <select name="gender" className={fieldClass}>
              <option value="">Select gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </label>
          <label className="lg:col-span-5">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Email</span><span data-hi lang="hi">ईमेल</span></span>
            <input name="email" type="email" autoComplete="email" className={fieldClass} placeholder="Optional email" />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Preferred Contact</span><span data-hi lang="hi">संपर्क का माध्यम</span></span>
            <select name="contactMethod" className={fieldClass}>
              <option>Phone / WhatsApp</option>
              <option>Call only</option>
              <option>WhatsApp only</option>
              <option>Email</option>
            </select>
          </label>
          <div className="lg:col-span-4">
            <p className="mb-2 text-sm font-semibold text-ink"><span data-en>Patient Type</span><span data-hi lang="hi">रोगी का प्रकार</span></p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["New Patient", "Follow-up Visit"].map((option) => (
                <label key={option} className={optionClass}>
                  <input type="radio" name="patientType" value={option} className="h-4 w-4 accent-brand" />
                  <span className="text-sm font-semibold text-ink">
                    <span data-en>{option}</span>
                    <span data-hi lang="hi">{option === "New Patient" ? "नया रोगी" : "फ़ॉलो-अप विज़िट"}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="lg:col-span-6">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Address</span><span data-hi lang="hi">पता</span></span>
            <input name="addressLine" autoComplete="street-address" className={fieldClass} placeholder="House number, street, locality" />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>City</span><span data-hi lang="hi">शहर</span></span>
            <input name="city" autoComplete="address-level2" className={fieldClass} placeholder="City" />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>State</span><span data-hi lang="hi">राज्य</span></span>
            <select name="state" autoComplete="address-level1" className={fieldClass} defaultValue="Uttar Pradesh">
              {indiaStates.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>PIN Code</span><span data-hi lang="hi">पिन कोड</span></span>
            <input name="postalCode" autoComplete="postal-code" inputMode="numeric" maxLength={6} className={fieldClass} placeholder="6 digit PIN" />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_20px_55px_rgba(8,64,84,0.07)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandIconTile className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-bold text-ink"><span data-en>Appointment preference</span><span data-hi lang="hi">अपॉइंटमेंट की पसंद</span></p>
              <p className="text-sm text-muted">Choose the care type and a convenient visit window.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6 lg:grid-cols-12">
          <label className="lg:col-span-6">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Appointment for</span><span data-hi lang="hi">अपॉइंटमेंट किसके लिए</span></span>
            <select name="service" required className={fieldClass}>
              <option value="">Select appointment type</option>
              {appointmentServices.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Preferred Date</span><span data-hi lang="hi">पसंदीदा तारीख़</span></span>
            <input name="date" type="date" className={fieldClass} />
          </label>
          <label className="lg:col-span-3">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Preferred Time</span><span data-hi lang="hi">पसंदीदा समय</span></span>
            <select name="timeSlot" className={fieldClass}>
              <option>Flexible</option>
              <option>Morning 11 AM-2 PM</option>
              <option>Evening 5 PM-6 PM</option>
            </select>
          </label>
          {appointmentFor === "IPD" ? (
            <div className="grid gap-4 rounded-xl border border-brand/15 bg-soft/55 p-4 lg:col-span-12 lg:grid-cols-12">
              <div className="lg:col-span-12">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-brand">IPD admission details</p>
                <p className="mt-1 text-sm text-muted">These details help reception prepare admission support before calling you.</p>
              </div>
              <label className="lg:col-span-5">
                <span className="mb-2 block text-sm font-semibold text-ink">Admission reason</span>
                <input name="admissionReason" className={fieldClass} placeholder="Reason for admission or doctor advice" />
              </label>
              <label className="lg:col-span-4">
                <span className="mb-2 block text-sm font-semibold text-ink">Insurance / TPA</span>
                <input name="insuranceTpa" className={fieldClass} placeholder="Insurance or TPA name, if any" />
              </label>
              <label className="lg:col-span-3">
                <span className="mb-2 block text-sm font-semibold text-ink">Room preference</span>
                <select name="roomPreference" className={fieldClass}>
                  <option value="">Reception guidance</option>
                  <option>General / shared</option>
                  <option>Private room</option>
                  <option>HDU / monitored care</option>
                </select>
              </label>
            </div>
          ) : appointmentFor === "OPD" ? (
            <div className="rounded-xl border border-brand/15 bg-soft/55 p-4 lg:col-span-12">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-brand">OPD visit details</p>
              <p className="mt-1 text-sm text-muted">Select symptoms and preferred time below so reception can route the request faster.</p>
            </div>
          ) : null}
          <div className="lg:col-span-4">
            <p className="mb-2 text-sm font-semibold text-ink"><span data-en>Referred by</span><span data-hi lang="hi">किसने रेफर किया</span></p>
            <label className={optionClass}>
              <input type="checkbox" name="hasReferral" value="Yes" className="h-4 w-4 accent-brand" />
              <span className="text-sm font-semibold text-ink">
                <span data-en>Referred by someone, if any</span>
                <span data-hi lang="hi">यदि किसी ने रेफर किया है</span>
              </span>
            </label>
          </div>
          <label className="lg:col-span-8">
            <span className="mb-2 block text-sm font-semibold text-ink"><span data-en>Referrer name</span><span data-hi lang="hi">रेफर करने वाले का नाम</span></span>
            <input name="referredBy" className={fieldClass} placeholder="Doctor, hospital, patient, family member or organization name" />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line/80 bg-[linear-gradient(135deg,#ffffff,#f7fbfb)] shadow-[0_20px_55px_rgba(8,64,84,0.08)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandIconTile className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-bold text-ink"><span data-en>Symptoms and support</span><span data-hi lang="hi">लक्षण और सहायता</span></p>
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
          {urgentSelected ? (
            <div className="rounded-xl border border-coral/20 bg-[linear-gradient(135deg,#fff7f5,#ffffff)] p-4 shadow-[0_16px_36px_rgba(180,58,39,0.12)] lg:col-span-12">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-coral/10 text-coral">
                    <AlertTriangle size={22} />
                  </span>
                  <div>
                    <p className="font-black text-ink">Urgent symptom selected</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">For vomiting blood, black stools, severe pain, jaundice with fever, persistent vomiting, breathing difficulty or rapid worsening, call reception before visiting.</p>
                  </div>
                </div>
                <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/65 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] px-4 font-black text-ink shadow-[0_14px_32px_rgba(8,64,84,0.14)] transition hover:-translate-y-0.5 hover:text-brand">
                  <Phone size={17} /> Call now
                </a>
              </div>
            </div>
          ) : null}
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
            <p className="mb-2 text-sm font-semibold text-ink"><span data-en>Common symptoms</span><span data-hi lang="hi">सामान्य लक्षण</span></p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {commonSymptoms.map((option) => (
                <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-sm transition hover:border-brand hover:bg-soft/45">
                  <input type="checkbox" name="symptoms" value={option} className="h-4 w-4 accent-brand" />
                  <span className="font-semibold text-ink"><span data-en>{option}</span><span data-hi lang="hi">{symptomHindi[option] ?? option}</span></span>
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
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-sm">
                {selectedReport ? <FileText size={20} /> : <Paperclip size={20} />}
              </span>
              <span className="grid flex-1 gap-0.5">
                <span className="font-semibold text-ink">{selectedReport ? selectedReport : "Upload report, prescription, or test file"}</span>
                <span className="text-xs">{selectedReport ? "Reports help the doctor review faster. You can remove and choose another file." : "PDF, JPG, PNG, or image files. Optional."}</span>
              </span>
              {selectedReport ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelectedReport("");
                    if (reportInputRef.current) reportInputRef.current.value = "";
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-muted transition hover:border-brand hover:text-brand"
                  aria-label="Remove selected report"
                >
                  <X size={16} />
                </button>
              ) : null}
              <input
                ref={reportInputRef}
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
      <div className="overflow-hidden rounded-xl border border-line/80 bg-white shadow-[0_20px_55px_rgba(8,64,84,0.07)]">
        <div className="border-b border-line/70 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandIconTile className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-bold text-ink">Review appointment request</p>
              <p className="text-sm text-muted">Check the key details before submitting to reception.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5 text-sm md:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {[
            ["Patient", draft.name || "Not entered"],
            ["Phone", normalizePhoneNumber(draft.phone, draft.countryCode || "+91") || "Not entered"],
            ["Appointment for", draft.service || "Not selected"],
            ["Admission", draft.service === "IPD" ? draft.admissionReason || "Not entered" : "Not applicable"],
            ["Date / time", `${draft.date || "Flexible"} · ${draft.timeSlot || "Flexible"}`],
            ["Patient type", draft.patientType || "Not selected"],
            ["Preferred contact", draft.contactMethod || "Phone / WhatsApp"],
            ["Symptoms", selectedSymptoms.length ? selectedSymptoms.join(", ") : "Not selected"],
            ["Report", selectedReport || "No report attached"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-soft/35 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand">{label}</p>
              <p className="mt-1 font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid items-start gap-3 md:grid-cols-3">
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 font-bold tracking-[0.01em] text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(8,145,178,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <Send size={18} /> <span data-en>Submit Request</span><span data-hi lang="hi">अनुरोध भेजें</span>
        </button>
        <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-teal/25 bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] px-5 font-bold tracking-[0.01em] text-white shadow-[0_18px_42px_rgba(5,150,105,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(5,150,105,0.34),inset_0_1px_0_rgba(255,255,255,0.26)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <MessageCircle size={18} /> WhatsApp Now
        </a>
        <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] px-5 font-bold tracking-[0.01em] text-ink shadow-[0_18px_42px_rgba(8,64,84,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:text-brand active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60">
          <Phone size={18} /> <span data-en>Call Reception</span><span data-hi lang="hi">रिसेप्शन को कॉल करें</span>
        </a>
      </div>
      {resultMessage ? (
        <div className="overflow-hidden rounded-xl border border-cyan-100/20 bg-[#082f36] p-5 text-white shadow-[0_24px_70px_rgba(8,64,84,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Appointment request</p>
              <p className="mt-2 text-xl font-black">Reception handoff ready</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cyan-50/80">{resultMessage}</p>
              {savedAppointmentId ? (
                <p className="mt-3 inline-flex rounded-full border border-cyan-100/25 bg-white/8 px-3 py-1 text-sm font-black text-cyan-50">Request ID: {savedAppointmentId}</p>
              ) : null}
            </div>
            <CheckCircle2 className="text-teal" size={34} />
          </div>
          <div className="mt-5 grid gap-3 rounded-xl border border-white/14 bg-white/8 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/portal#appointment" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-4 font-black text-white shadow-[0_18px_42px_rgba(8,145,178,0.28),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5">
              <CalendarCheck size={17} /> Book Appointment
            </a>
            <a href={whatsappLink || `https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-teal/25 bg-[linear-gradient(135deg,var(--site-teal),var(--site-teal-dark))] px-4 font-black text-white shadow-[0_18px_42px_rgba(5,150,105,0.26),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5">
              <MessageCircle size={17} /> WhatsApp
            </a>
            <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/65 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] px-4 font-black text-ink shadow-[0_18px_42px_rgba(8,64,84,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 hover:text-brand">
              <Phone size={17} /> Call Reception
            </a>
            <a href={site.directionsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/65 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] px-4 font-black text-ink shadow-[0_18px_42px_rgba(8,64,84,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 hover:text-brand">
              <MapPin size={17} /> Get Directions
            </a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
