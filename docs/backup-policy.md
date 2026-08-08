# Backup and Restore Policy

Operational backup policy for MudgalGastromedics OS. Satisfies the `backups`
production-readiness check (`lib/production-readiness.ts`), which is scored as a
**release blocker**, not a warning.

Owner: Hospital IT / Administrator (named in the on-call sheet below).
Review cadence: every 6 months, or after any schema or hosting change.

## 1. What is backed up

| Data | Where it lives | Contains patient data |
| --- | --- | --- |
| `store_documents` (all domain stores: OPD queue, patients, appointments, IPD beds, notifications, access users/sessions) | Postgres | **Yes** |
| Audit events (`lib/audit-store.ts`, fully relational) | Postgres | Yes — actor, IP, before/after diffs |
| Patient documents / uploads (`lib/patient-file-store.ts`) | Postgres / object storage | **Yes** |
| Application code and schema (`database/schema.sql`) | Git | No |
| Secrets (`ADMIN_AUTH_SECRET`, `DOCTOR_PASSCODE`, provider keys) | Host secret store | No, but loss locks everyone out |

Everything patient-identifying lives in Postgres. A Postgres backup plus the
Git repository plus the secret store is a complete recovery set.

## 2. Schedule and retention

The database is hosted on Neon, which provides continuous WAL archiving and
point-in-time restore. The policy is:

- **Point-in-time restore window: 7 days minimum.** Configure on the Neon
  project (Settings → Backups → History retention). This covers the realistic
  detection window for accidental deletion or a bad bulk edit.
- **Daily logical dump, retained 30 days.** `pg_dump` to encrypted off-platform
  storage, so a full account/provider loss is still recoverable.
- **Monthly dump retained 12 months**, for the retention obligations described
  in `docs/privacy-review.md` §5.

Retention deliberately exceeds nothing: medical records carry statutory
retention (see the privacy review), and backups are not the record of truth for
that — they exist to recover the live system, not to serve as the archive.

### Daily dump command

```sh
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges \
  | gpg --encrypt --recipient "$BACKUP_GPG_RECIPIENT" \
  > "mgm-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"
```

Backups are encrypted at rest **before** leaving the host. An unencrypted dump
of this database is a full patient-record disclosure.

## 3. Restore testing

A backup that has never been restored is a hypothesis, not a backup.

- **Quarterly restore drill**, performed against a scratch database — never
  against production. Restore the most recent daily dump, run
  `npm run db:check`, and confirm row counts for `store_documents` and the
  audit tables are within one day of production.
- Record each drill (date, dump restored, duration, who ran it, outcome) in the
  drill log kept alongside the on-call sheet.
- **The drill must include the secret store.** A database restored without
  `ADMIN_AUTH_SECRET` invalidates every existing session and no one can log in.

Recovery objectives:

- **RPO (max acceptable data loss): 24 hours** from the logical dump, or
  minutes via Neon point-in-time restore.
- **RTO (max acceptable downtime): 4 hours.**

## 4. Restore procedure

1. Declare the incident and stop writes — put the OS into maintenance so staff
   do not enter data that the restore will overwrite.
2. Choose the restore target: Neon PITR for accidental data loss inside the
   history window; the encrypted dump for provider-level loss.
3. Restore into a **new** database, never over the live one. The bad state is
   evidence until the cause is understood.
4. Run `npm run db:check`, then `npm run prod:check`.
5. Repoint `DATABASE_URL` and restart.
6. Verify by driving one real flow end to end (patient lookup → OPD visit →
   billing), then re-open to staff.
7. Write the incident up, including what the audit log shows about the cause.

## 5. What this policy does not cover

- **Deliberate deletion of a clinical record is not a backup problem.** Every
  mutation is audited with before/after (`lib/audit-diff.ts`); recovering a
  single wrongly-edited field should come from the audit trail, not a restore.
- Backups do not substitute for the retention rules in
  `docs/privacy-review.md` §5. Deleting a patient record on request must also
  age out of backups within the retention window above.

## 6. On-call

| Role | Name | Contact |
| --- | --- | --- |
| Primary (backup/restore owner) | _to be filled by hospital IT_ | |
| Escalation (clinical sign-off to restore) | _to be filled_ | |

> The two rows above are the only part of this policy that cannot be set from
> the repository. Fill them before go-live — a restore procedure with no named
> owner is not an operational policy.
