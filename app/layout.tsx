import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
});

const SITE_URL = "https://bhupendranegi.github.io/CronLens/";
const TITLE = "CronLens — Cron Expression Explainer & Next-Run Visualizer";
const DESCRIPTION =
  "Paste a cron expression and instantly see what it means in plain English, its next run times in any timezone (DST-aware), a field-by-field breakdown, and warnings. Free, no signup — runs 100% in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cron expression",
    "crontab",
    "cron parser",
    "cron explainer",
    "cron schedule",
    "cron next run time",
    "cron expression generator",
    "cron translator",
    "quartz cron",
    "cron timezone",
    "cron DST",
    "cron checker",
    "cron validator",
  ],
  authors: [{ name: "Bhupendra Negi", url: "https://bhupendranegi.github.io" }],
  creator: "Bhupendra Negi",
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "CronLens",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "og.png", width: 1200, height: 630, alt: "CronLens — cron expression explainer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@BhupendraNegi21",
    images: ["og.png"],
  },
};

// Structured data so search engines understand this is a free web tool.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CronLens",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: {
    "@type": "Person",
    name: "Bhupendra Negi",
    url: "https://bhupendranegi.github.io",
  },
  featureList: [
    "Plain-English cron expression translation",
    "Next N run times in any IANA timezone",
    "Daylight-saving (DST) aware scheduling",
    "Field-by-field breakdown",
    "5-field, 6-field (seconds), and Quartz dialects",
    "Shareable links, copy as text or Markdown",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        {children}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
