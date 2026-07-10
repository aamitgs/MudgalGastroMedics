import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";
import { hospitalSchema, site } from "@/lib/site-data";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
      <body id="top" className={`${GeistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema()) }}
        />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-Y70R4VQ7NJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y70R4VQ7NJ');
          `}
        </Script>
        <AppChrome>{children}</AppChrome>
        <Analytics />
      </body>
    </html>
  );
}
