import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const requiredTables = [
  "patients",
  "appointments",
  "opd_visits",
  "inventory_items",
  "staff_members",
  "audit_events",
  "cms_content_items",
  "cms_content_revisions"
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

try {
  const now = await pool.query("select now()::text as now");
  const tables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)",
    [requiredTables]
  );
  const present = new Set(tables.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !present.has(table));
  console.log(`Database connected at ${now.rows[0].now}.`);
  if (missing.length) {
    console.error(`Missing tables: ${missing.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Required HMS tables are present.");
  }
} finally {
  await pool.end();
}

