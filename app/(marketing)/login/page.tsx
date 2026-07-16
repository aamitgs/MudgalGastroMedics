import { redirect } from "next/navigation";

/**
 * Retired: /mudgalgastromedics-os already renders the exact same
 * WorkspaceLauncher when unauthenticated, and nothing on the public site
 * ever linked here (checked before removing) — /doctor has its own separate
 * DoctorLogin, unrelated to this page. Kept as a redirect, not deleted, so
 * old bookmarks/sign-out links still land somewhere real.
 */
export default function LoginPage() {
  redirect("/mudgalgastromedics-os");
}
