import { readFileSync } from "node:fs";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const schema = readFileSync("database/schema.sql", "utf8");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

try {
  await pool.query(schema);
  console.log("Applied database/schema.sql successfully.");
} finally {
  await pool.end();
}

