import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public/images/blog/generated");
fs.mkdirSync(outDir, { recursive: true });
const logoDataUri = `data:image/png;base64,${fs.readFileSync(path.join(root, "public/mgm-logo.png")).toString("base64")}`;

const sources = [
  fs.readFileSync(path.join(root, "lib/blog-posts.ts"), "utf8"),
  fs.readFileSync(path.join(root, "lib/additional-blog-posts.ts"), "utf8")
].join("\n");

const posts = [];
const seen = new Set();
const pattern =
  /slug:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"[\s\S]*?relatedLabel:\s*"([^"]+)"/g;

for (const match of sources.matchAll(pattern)) {
  const [, slug, category, title, description, relatedLabel] = match;
  if (seen.has(slug)) continue;
  seen.add(slug);
  posts.push({ slug, category, title, description, relatedLabel });
}

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function topicType(post) {
  const text = `${post.slug} ${post.category} ${post.title} ${post.description} ${post.relatedLabel}`.toLowerCase();
  if (/liver|fibroscan|jaundice|sgpt|sgot|hepatitis|cirrhosis|ascites|variceal|portal/.test(text)) return "liver";
  if (/colon|stool|ibd|ibs|constipation|diarrhea|polyp|colitis|crohn|bowel|mucus/.test(text)) return "bowel";
  if (/ercp|bile|biliary|cbd|pancrea|gall|duct/.test(text)) return "biliary";
  if (/endoscopy|swallow|ulcer|gastritis|gerd|reflux|acidity|vomit|food-pipe|biopsy/.test(text)) return "endoscopy";
  return "digestive";
}

const configs = {
  liver: {
    chip: "Liver Care",
    primary: "#f2b35c",
    secondary: "#67e8f9",
    feature: "Liver Health",
    device: "Liver Elastography",
    score: "6.2 kPa",
    icon: liverIcon
  },
  bowel: {
    chip: "Bowel Care",
    primary: "#f2b35c",
    secondary: "#67e8f9",
    feature: "Colonoscopy",
    device: "Colon Evaluation",
    score: "Screening",
    icon: bowelIcon
  },
  biliary: {
    chip: "Biliary Care",
    primary: "#f2b35c",
    secondary: "#67e8f9",
    feature: "ERCP Care",
    device: "Biliary Imaging",
    score: "CBD Care",
    icon: biliaryIcon
  },
  endoscopy: {
    chip: "Endoscopy Care",
    primary: "#f2b35c",
    secondary: "#67e8f9",
    feature: "Endoscopy",
    device: "Upper GI Scope",
    score: "HD View",
    icon: endoscopyIcon
  },
  digestive: {
    chip: "Digestive Care",
    primary: "#f2b35c",
    secondary: "#67e8f9",
    feature: "Expert Care",
    device: "GI Evaluation",
    score: "Care Plan",
    icon: stomachIcon
  }
};

function wrapText(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), `${lines.slice(maxLines - 1).join(" ").slice(0, maxChars - 1).trim()}...`];
}

function titleFontSize(lines) {
  if (lines.length >= 4) return 58;
  if (lines.some((line) => line.length > 32)) return 64;
  return 76;
}

function textLines(lines, x, y, size, lineHeight, weight = 900, color = "#ffffff", extra = "") {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" ${extra}>${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

function brandMark() {
  return `
    <g transform="translate(66 48)">
      <rect x="-16" y="-12" width="530" height="156" rx="18" fill="#031f27" opacity=".46"/>
      <image href="${logoDataUri}" x="0" y="0" width="490" height="200" preserveAspectRatio="xMinYMin meet"/>
    </g>
  `;
}

function medicalDesk(config) {
  return `
    <g transform="translate(910 75)">
      <rect x="236" y="20" width="286" height="236" rx="32" fill="#d8e2e4" opacity=".95"/>
      <rect x="262" y="48" width="234" height="150" rx="12" fill="#0a2730" stroke="#4cc9d7" stroke-width="5"/>
      <rect x="282" y="72" width="194" height="102" rx="7" fill="#0e3b48"/>
      <path d="M296 139C327 105 358 113 379 141C398 166 426 156 462 116" fill="none" stroke="#6ee7f4" stroke-width="5"/>
      <text x="286" y="93" fill="#67e8f9" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" letter-spacing="1">${escapeXml(config.device.toUpperCase())}</text>
      <text x="417" y="186" fill="#67e8f9" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${escapeXml(config.score)}</text>
      <rect x="306" y="204" width="172" height="70" rx="10" fill="#143f48" stroke="#98edf6" stroke-opacity=".45" stroke-width="3"/>
      <text x="334" y="234" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">${escapeXml(config.feature)}</text>
      <path d="M329 252L344 266L374 234" fill="none" stroke="#19d3cf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M450 252L465 266L495 234" fill="none" stroke="#19d3cf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(802 420) rotate(-7)">
      <rect width="370" height="235" rx="14" fill="#e9f0f1"/>
      <rect x="24" y="28" width="322" height="20" rx="10" fill="#b8d9df"/>
      <rect x="24" y="72" width="220" height="12" rx="6" fill="#9fc5cc"/>
      <rect x="24" y="100" width="265" height="12" rx="6" fill="#b9cfd4"/>
      <rect x="24" y="128" width="176" height="12" rx="6" fill="#b9cfd4"/>
      <circle cx="291" cy="136" r="48" fill="#d7edf0"/>
      <path d="M291 88A48 48 0 0 1 339 136H291Z" fill="#42d7e8"/>
      <path d="M291 136L251 164A48 48 0 0 1 291 88Z" fill="#1fb6c9"/>
      <rect x="26" y="174" width="318" height="12" rx="6" fill="#b8d9df"/>
      <rect x="26" y="200" width="210" height="12" rx="6" fill="#c4d9dd"/>
    </g>`;
}

function renderSvg(post) {
  const type = topicType(post);
  const config = configs[type];
  const title = post.title
    .replace("Symptoms, Causes and Treatment", "Symptoms, Causes & Treatment")
    .replace("Difference, Preparation and Uses", "Difference, Prep & Uses");
  const titleLines = wrapText(title, 25, 4);
  const descriptionLines = wrapText(post.description, 55, 3);
  const fontSize = titleFontSize(titleLines);
  const titleLineHeight = Math.round(fontSize * 1.02);
  const underlineY = Math.min(528, 321 + (titleLines.length - 1) * titleLineHeight + Math.round(fontSize * 0.5));
  const descriptionY = underlineY + 54;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="757" viewBox="0 0 1600 757" role="img" aria-label="${escapeXml(post.title)} cover image">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#021d25"/>
      <stop offset=".48" stop-color="#062d38"/>
      <stop offset="1" stop-color="#0b3f48"/>
    </linearGradient>
    <linearGradient id="brandWarm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d91f26"/>
      <stop offset=".58" stop-color="#f28a1d"/>
      <stop offset="1" stop-color="#ffd36f"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="34%" r="48%">
      <stop offset="0" stop-color="${config.secondary}" stop-opacity=".28"/>
      <stop offset=".48" stop-color="#0f766e" stop-opacity=".18"/>
      <stop offset="1" stop-color="#021d25" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity=".28"/>
    </filter>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.4" fill="#67e8f9" opacity=".16"/>
    </pattern>
  </defs>
  <rect width="1600" height="757" rx="18" fill="url(#bg)"/>
  <rect width="1600" height="757" fill="url(#glow)"/>
  <rect x="0" y="0" width="610" height="757" fill="url(#dots)" opacity=".7"/>
  <path d="M594 0H1600V757H822C926 646 960 525 901 394C839 257 653 215 594 0Z" fill="#ffffff" opacity=".05"/>
  <circle cx="1158" cy="306" r="238" fill="#0f766e" opacity=".18"/>
  <circle cx="1158" cy="306" r="308" fill="none" stroke="#d8fbff" stroke-opacity=".12" stroke-width="3"/>
  ${brandMark()}
  <g transform="translate(72 194)">
    <rect width="${Math.max(190, config.chip.length * 17 + 95)}" height="58" rx="29" fill="#11353d" stroke="#67e8f9" stroke-opacity=".46" stroke-width="3"/>
    <path d="M36 30h19M45 20v20M62 25h15v18H31V25h13" fill="none" stroke="#67e8f9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="96" y="38" fill="#dffaff" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="900" letter-spacing="2">BLOG</text>
  </g>
  ${textLines(titleLines, 72, 321, fontSize, titleLineHeight, 900, "#ffffff")}
  <rect x="73" y="${underlineY}" width="105" height="5" rx="3" fill="${config.secondary}"/>
  <rect x="198" y="${underlineY}" width="105" height="5" rx="3" fill="${config.primary}"/>
  ${textLines(descriptionLines, 72, descriptionY, 34, 44, 700, "#d9edf0")}
  <text x="72" y="687" fill="#cdeff4" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="800">Agra</text>
  <circle cx="153" cy="679" r="4" fill="#9bcdd5"/>
  <text x="178" y="687" fill="#cdeff4" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="800">${escapeXml(post.relatedLabel)}</text>
  <circle cx="575" cy="679" r="4" fill="#9bcdd5"/>
  <text x="600" y="687" fill="#cdeff4" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="800">Call +91 9828912257</text>
  <g transform="translate(855 145)" filter="url(#softShadow)">
    <circle cx="320" cy="178" r="168" fill="#092e37" opacity=".42"/>
    ${config.icon(config)}
  </g>
  ${medicalDesk(config)}
  <g transform="translate(82 708)">
    <rect width="745" height="62" rx="18" fill="#e8fbff" opacity=".14" stroke="#d9fbff" stroke-opacity=".28"/>
    <text x="54" y="39" fill="#dffaff" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">Experienced Gastroenterology Team</text>
    <line x1="334" y1="14" x2="334" y2="48" stroke="#dffaff" stroke-opacity=".34" stroke-width="2"/>
    <text x="374" y="39" fill="#dffaff" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">Advanced Endoscopy &amp; FibroScan</text>
  </g>
</svg>`;
}

function liverIcon() {
  return `
    <g transform="translate(0 0)">
      <path d="M60 172C60 105 118 56 201 55C285 54 406 101 418 174C431 249 352 283 268 263C223 252 196 222 149 232C98 243 60 218 60 172Z" fill="#d99545"/>
      <path d="M80 164C101 103 157 83 227 91C297 99 379 125 390 176C400 225 344 243 283 229C234 218 207 189 159 201C112 213 73 196 80 164Z" fill="#f8c77c"/>
      <path d="M247 71C267 126 260 197 237 259" stroke="#fff7dc" stroke-width="10" stroke-linecap="round" opacity=".75"/>
      <circle cx="146" cy="145" r="11" fill="#fff7dc" opacity=".45"/>
      <circle cx="322" cy="160" r="9" fill="#fff7dc" opacity=".38"/>
    </g>`;
}

function bowelIcon() {
  return `
    <g transform="translate(36 20)">
      <path d="M92 55H336C363 55 384 76 384 103V208C384 264 339 309 283 309H145C89 309 44 264 44 208V103C44 76 65 55 92 55Z" stroke="#67e8f9" stroke-width="20" stroke-linecap="round"/>
      <path d="M116 108H309C326 108 340 122 340 139C340 156 326 170 309 170H134C117 170 103 184 103 201C103 218 117 232 134 232H305C322 232 336 246 336 263C336 280 322 294 305 294H149" stroke="#f3bd73" stroke-width="20" stroke-linecap="round"/>
      <path d="M157 33V73M271 33V73" stroke="#67e8f9" stroke-width="16" stroke-linecap="round"/>
    </g>`;
}

function biliaryIcon() {
  return `
    <g transform="translate(18 12)">
      <path d="M60 172C60 108 116 61 195 60C273 58 381 101 392 170C404 239 333 270 257 253C216 243 190 216 147 225C99 234 60 216 60 172Z" fill="#d99545"/>
      <path d="M241 77C258 126 252 190 230 250" stroke="#fff7dc" stroke-width="10" stroke-linecap="round" opacity=".75"/>
      <path d="M247 252C247 293 278 326 317 326C356 326 387 293 387 252C387 218 338 162 323 145C318 139 310 139 305 145C288 165 247 217 247 252Z" fill="#20c997"/>
      <path d="M316 125V56M316 56H371M316 56H267" stroke="#67e8f9" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="317" cy="253" r="38" fill="#08333b" opacity=".24"/>
    </g>`;
}

function endoscopyIcon() {
  return `
    <g transform="translate(24 18)">
      <rect x="52" y="46" width="260" height="154" rx="28" fill="#0d3d49" stroke="#67e8f9" stroke-width="12"/>
      <rect x="88" y="82" width="190" height="82" rx="14" fill="#123f4a"/>
      <path d="M108 143C142 104 176 110 202 140C226 169 250 158 274 127" stroke="#67e8f9" stroke-width="8" stroke-linecap="round"/>
      <path d="M312 127C368 127 405 162 405 210C405 270 357 302 297 302H142C90 302 52 272 52 226" stroke="#f3bd73" stroke-width="17" stroke-linecap="round"/>
      <circle cx="52" cy="226" r="22" fill="#24c58e"/>
    </g>`;
}

function stomachIcon() {
  return `
    <g transform="translate(42 10)">
      <path d="M204 56C181 90 184 123 214 153C242 181 250 217 228 251C200 294 137 291 101 253C62 211 76 147 119 128C142 118 156 105 154 77C153 56 180 40 204 56Z" fill="#f2b35c"/>
      <path d="M208 153C257 138 302 151 328 188C354 225 345 275 308 299C266 326 210 306 197 257" fill="none" stroke="#67e8f9" stroke-width="18" stroke-linecap="round"/>
      <path d="M149 130C132 154 130 190 150 217" stroke="#fff7dc" stroke-width="10" stroke-linecap="round" opacity=".75"/>
      <circle cx="188" cy="91" r="9" fill="#fff7dc" opacity=".45"/>
    </g>`;
}

for (const post of posts) {
  fs.writeFileSync(path.join(outDir, `${post.slug}-cover.svg`), renderSvg(post));
}

console.log(`Generated ${posts.length} blog cover SVGs in ${path.relative(root, outDir)}`);
