import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { hospitalSchema, site } from "@/lib/site-data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Mudgal Gastromedics Hospital | Gastroenterologist in Agra",
    template: "%s | Mudgal Gastromedics Hospital"
  },
  description:
    "Mudgal Gastromedics Hospital in Agra offers gastroenterology, liver care, endoscopy, colonoscopy, ERCP, Fibroscan and advanced GI procedures.",
  openGraph: {
    title: "Mudgal Gastromedics Hospital",
    description: site.tagline,
    url: site.url,
    siteName: site.name,
    images: ["/mgm-logo.png"],
    locale: "en_IN",
    type: "website"
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${GeistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema()) }}
        />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
