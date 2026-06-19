# Mudgal Gastromedics Hospital Website

Next.js + Tailwind CSS website for Mudgal Gastro Medics / Mudgal Gastromedics Hospital.

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- lucide-react icons
- Vercel-ready API route for appointment requests

## Local Development

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main Content Source

Hospital details, procedures, gallery items, equipment, doctor profile and schema data live in:

```txt
lib/site-data.ts
```

## Replace Dummy Photos

Named placeholder images live in:

```txt
public/placeholders/
```

Replace the SVG files with final optimized hospital photos using the same filenames, or update the paths in `lib/site-data.ts`.

## Useful Commands

```sh
npm run build
npm run lint
node scripts/create-placeholders.mjs
```

## Production Checklist

- Replace dummy doctor, gallery, facility, and equipment images.
- Confirm hospital timings, emergency policy, insurance/TPA text, testimonials, privacy policy, terms, and accreditation details.
- Connect `app/api/appointment/route.ts` to SMTP, CRM, database storage, or another appointment workflow.
- Verify Google Search Console, Analytics, and final canonical domain.
