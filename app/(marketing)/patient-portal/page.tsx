import { redirect } from "next/navigation";

/**
 * Retired: next.config.mjs already permanently redirects /patient-portal to
 * /portal (found while adding breadcrumb schema here — the page below could
 * never actually render, since the redirect wins before this route is ever
 * reached). Kept as a redirect, not deleted, matching the /admin and /login
 * pattern, so old bookmarks/links still land somewhere real.
 */
export default function PatientPortalPage() {
  redirect("/portal");
}
