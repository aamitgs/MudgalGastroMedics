import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const placeholders = [
  ["hospital-front-view", "Hospital Front View", "Hospital Exterior"],
  ["entrance", "Entrance", "Hospital Exterior"],
  ["reception-desk", "Reception Desk", "Reception"],
  ["reception-waiting-area", "Waiting Area", "Reception"],
  ["doctor-chamber", "Doctor Chamber", "Consultation Areas"],
  ["endoscopy-room", "Endoscopy Room", "Endoscopy Unit"],
  ["duty-doctor-chamber", "Duty Doctor Chamber", "Consultation Areas"],
  ["hdu-cabin", "HDU Cabin", "HDU"],
  ["hdu-ward", "HDU Ward", "HDU"],
  ["ipd-waiting-area", "IPD Waiting Area", "Patient Rooms"],
  ["private-room-1", "Private Room 1", "Patient Rooms"],
  ["private-room-2", "Private Room 2", "Patient Rooms"],
  ["private-room-lobby", "Private Room Lobby", "Patient Rooms"],
  ["lift", "Lift", "Facilities"],
  ["pharmacy", "Pharmacy", "Facilities"],
  ["colonoscope", "Colonoscope", "Medical Equipment"],
  ["endoscope", "Endoscope", "Medical Equipment"],
  ["ercp-scope", "ERCP Scope", "Medical Equipment"],
  ["c-arm-machine", "C-Arm Machine", "Medical Equipment"],
  ["cautery-machine", "Cautery Machine", "Medical Equipment"],
  ["doctor-deepak-kumar-sharma", "Dr. Deepak Kumar Sharma", "Doctor Photo Placeholder"]
];

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

for (const [slug, title, category] of placeholders) {
  const file = join(process.cwd(), "public", "placeholders", `${slug}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#e8f5f4"/>
      <stop offset="0.5" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f8e6e9"/>
    </linearGradient>
    <linearGradient id="band" x1="0" x2="1">
      <stop offset="0" stop-color="#0f7a78"/>
      <stop offset="1" stop-color="#d7142d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <rect x="84" y="90" width="1032" height="720" rx="28" fill="#ffffff" stroke="#d5e5e7" stroke-width="4"/>
  <rect x="126" y="138" width="948" height="410" rx="18" fill="#f4f8f8"/>
  <path d="M126 548h948v92H126z" fill="url(#band)" opacity="0.94"/>
  <circle cx="230" cy="310" r="82" fill="#0f7a78" opacity="0.16"/>
  <circle cx="970" cy="260" r="116" fill="#d7142d" opacity="0.12"/>
  <path d="M356 418h488" stroke="#0f7a78" stroke-width="18" stroke-linecap="round" opacity="0.25"/>
  <path d="M420 354h360" stroke="#d7142d" stroke-width="18" stroke-linecap="round" opacity="0.22"/>
  <text x="600" y="610" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="#ffffff">${escapeXml(category)}</text>
  <text x="600" y="705" text-anchor="middle" font-family="Arial, sans-serif" font-size="50" font-weight="800" fill="#14242b">${escapeXml(title)}</text>
  <text x="600" y="758" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#5d6c73">Dummy photo - replace with real MGM image</text>
</svg>`
  );
}
