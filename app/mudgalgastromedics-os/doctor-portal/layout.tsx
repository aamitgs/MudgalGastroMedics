import { StaffChrome } from "@/components/chrome/StaffChrome";

// Deliberately its own StaffChrome (the lean, no-sidebar shell) instead of
// HospitalOsPageShell/HospitalOsShell — this workspace is used dozens of
// times a day mid-consultation, so it keeps the focused, single-purpose
// layout every other role's ~35-module sidebar would only slow down. Living
// under /mudgalgastromedics-os/* is a URL-namespace change, not a UX one.
// A layout (not inline in page.tsx) so StaffChrome sits above the route
// segment and survives a page-level render error, same as the old
// app/doctor/layout.tsx this replaces.
export default function DoctorPortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StaffChrome>{children}</StaffChrome>;
}
