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

## Public Website vs CMS

The public website is the patient-facing frontend. It should stay optimized for visitors: services, appointments, directions, doctor profile, facilities, patient education and contact flow.

The internal CMS is a separate admin workflow for staff-approved edits to procedure pages, gallery media, SEO metadata and publish status. Do not treat the visible frontend as the CMS itself.

Published CMS records can override procedure page copy, gallery media metadata, sitemap procedure URLs and mobile procedure catalog content. Static `lib/site-data.ts` remains the fallback source.

CMS edits and status changes create revision records for preview/history review before future staff-facing publishing permissions are added.

Admin login uses named staff credentials and signed staff session cookies. Staff records carry role-derived permissions such as `cms:read`, `cms:write`, and `cms:publish`; CMS publishing and archiving require publish permission.

For production, configure `ADMIN_AUTH_SECRET` and either `STAFF_USERS_JSON` or explicit staff credential env vars such as `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Local fallback credentials are only for development.

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
npm run test
npm run test:all
npm run build
npm run lint
npm run prod:check
npm run db:export
node scripts/create-placeholders.mjs
```

## Runtime Checks

```txt
GET /api/health
GET /api/production/readiness
GET /api/audit
```

`/api/health` is public for uptime checks. `/api/production/readiness` and `/api/audit` are admin-protected. The audit log records sensitive action metadata for sessions, appointments, HMS records, AI reviews, automation and readiness checks without storing passcodes or uploaded report contents.

## Database Migration

Production HMS data should move from local `.data/*.json` files to managed PostgreSQL before real patient use.

```sh
psql "$DATABASE_URL" -f database/schema.sql
npm run db:export
psql "$DATABASE_URL" -f database/local-data-export.sql
npm run db:check
```

See `database/README.md` for migration order and safety notes.

## Production Release Gate

Run this in the deployment environment before promoting a live HMS release:

```sh
NODE_ENV=production npm run prod:check
```

The command fails until security secrets, database storage, backup policy and privacy review gates are configured. CI runs `npm run prod:check -- --report-only` so pull requests show the readiness status without blocking normal staging work.

## Production Checklist

- Replace dummy doctor, gallery, facility, and equipment images.
- Confirm hospital timings, emergency policy, insurance/TPA text, testimonials, privacy policy, terms, and accreditation details.
- Set strong `ADMIN_AUTH_SECRET`, named staff credentials through `STAFF_USERS_JSON` or `ADMIN_PASSWORD`, `DOCTOR_PASSCODE`, and `MOBILE_API_TOKEN` production secrets.
- Move local JSON HMS stores to managed database storage, for example PostgreSQL.
- Configure automated backups, restore testing, monitoring, and alert routing.
- Connect `app/api/appointment/route.ts` and communication workflows to SMTP, CRM, database storage, or another approved workflow.
- Complete privacy, consent, retention, access control, and audit-log review before storing real patient records.
- Verify Google Search Console, Analytics, and final canonical domain.
- Run `NODE_ENV=production npm run prod:check` and resolve every failing release gate before live use.
