import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CronLens",
  description: "Paste a cron expression and see exactly when it runs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
