import type { Metadata } from "next";
import { AccessLogin } from "@/components/AccessLogin";

export const metadata: Metadata = {
  title: { absolute: "Staff Login • MudgalGastromedics OS" },
  description: "Staff sign-in for the Mudgal Gastromedics Hospital operating system.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[linear-gradient(160deg,var(--site-soft),var(--site-surface)_45%,var(--site-mist))] px-4 py-16">
      <AccessLogin />
    </main>
  );
}
