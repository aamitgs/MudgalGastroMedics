import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { MotionConfig } from "framer-motion";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";
import "./globals.css";
import { hospitalSchema, site } from "@/lib/site-data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Gastroenterologist, Liver Specialist & Endoscopy Centre in Agra",
    template: "%s | Mudgal Gastromedics Hospital"
  },
  description:
    "Mudgal Gastromedics Hospital in Shaheed Nagar, Agra offers gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan and advanced digestive disease treatment.",
  keywords: [
    "Gastroenterologist in Agra",
    "Liver Specialist in Agra",
    "Endoscopy Centre in Agra",
    "Colonoscopy in Agra",
    "ERCP Specialist in Agra",
    "FibroScan in Agra",
    "Gastro Hospital in Shaheed Nagar Agra"
  ],
  openGraph: {
    title: "Gastroenterologist, Liver Specialist & Endoscopy Centre in Agra",
    description:
      "Mudgal Gastromedics Hospital in Shaheed Nagar, Agra offers gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan and advanced digestive disease treatment.",
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
    <html lang="en" data-scroll-behavior="smooth" className="font-sans">
      <body id="top" className={`${GeistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema()) }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-58TTM878"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-58TTM878');
          `}
        </Script>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-Y70R4VQ7NJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y70R4VQ7NJ');
          `}
        </Script>
        {/* Single root switch every route renders through, so wrapping here
            makes every motion.* component honor the OS reduced-motion
            setting automatically (Track 1.8) — individual components no
            longer each need their own useReducedMotion() check to be
            covered by this baseline; a few still call it explicitly to skip
            non-duration motion (e.g. initial slide-in offsets), which
            MotionConfig alone doesn't affect. Previously applied separately
            inside each of AppChrome.tsx's three pathname-branched chrome
            wrappers (Track 4.1 route-groups migration removed that
            duplication by hoisting it here, since it was identical in all
            three). */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Analytics />
      </body>
    </html>
  );
}
