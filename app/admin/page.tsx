import { redirect } from "next/navigation";

/**
 * Retired (Track 4.13, docs/build-roadmap.md): every module that used to
 * render inline here now has its own dedicated /mudgalgastromedics-os/*
 * route with the real persistent shell. /mudgalgastromedics-os enforces the
 * same auth gate this page used to (canOpenAdminShell), so no auth check is
 * needed here — this is a pure redirect.
 *
 * A server redirect can't see the URL's #hash (browsers never send it), but
 * browsers do preserve an existing hash across a redirect whose Location
 * header doesn't specify its own — so an old /admin#module-hr bookmark
 * arrives at /mudgalgastromedics-os#module-hr, where HospitalOsShell's
 * legacy-hash effect finishes the redirect onto the real page.
 */
export default function AdminPage() {
  redirect("/mudgalgastromedics-os");
}
