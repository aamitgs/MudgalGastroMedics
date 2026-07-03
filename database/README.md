# Database Migration Notes

This directory contains the production database baseline for moving the HMS prototype away from local `.data/*.json` files.

## Target

- PostgreSQL 15+
- Managed backups enabled
- Restore test documented
- Separate production secrets for admin, doctor, and mobile access

## Apply Baseline

```sh
npm run db:apply
```

This uses the Node PostgreSQL client. Set `DATABASE_SSL=true` if your managed database requires SSL without local certificate verification.

## Export Local Prototype Data

If local prototype data exists in `.data/*.json`, export it to SQL:

```sh
npm run db:export
```

This writes:

```txt
database/local-data-export.sql
```

Apply it after the baseline schema:

```sh
psql "$DATABASE_URL" -f database/local-data-export.sql
```

## Verify Database

```sh
npm run db:check
```

When the schema and migration are verified, configure:

```txt
DATA_SOURCE=database
```

The local JSON stores remain available for development previews when `DATA_SOURCE` is not `database`.

## Migration Order

1. Apply `database/schema.sql` to an empty managed database.
2. Run `npm run db:export` if local prototype records need migration.
3. Apply `database/local-data-export.sql` to the managed database.
4. Set `DATA_SOURCE=database` after runtime stores are switched to the PostgreSQL adapters.
5. Add audit writes for every create/update action.
6. Run `npm run test` and `npm run build`.
7. Verify `/api/production/readiness` has no failing checks.

## Data Safety

Do not store real patient records in the local JSON prototype. The current app is suitable for UI/workflow preview until database storage, backups, audit logs, access control, and privacy review are complete.
