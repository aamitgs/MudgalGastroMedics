import { rmSync } from "node:fs";
import { join } from "node:path";

/**
 * The patient-flow specs assert against the deterministic demo dataset, which
 * the snapshot API only serves when no real OPD/appointment data exists (and
 * never in production). Clearing these stores keeps the suite deterministic
 * instead of depending on whatever local usage left behind in .data/.
 * Note: a dev server reused via reuseExistingServer keeps stores in memory —
 * restart it if local runs see stale rows; CI always spawns fresh.
 */
export default function globalSetup() {
  for (const file of ["appointments.json", "opd-queue.json", "patients.json"]) {
    rmSync(join(process.cwd(), ".data", file), { force: true });
  }
}
