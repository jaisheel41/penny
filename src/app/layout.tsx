import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Penny",
    template: "%s · Penny",
  },
  description:
    "Log spending in one line, see plain-English summaries, and a month-end forecast before it’s too late.",
  openGraph: {
    title: "Penny",
    description:
      "Fast expense logging, a monthly pulse, and a forecast that shows where you’re heading.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Penny",
    description:
      "Your money, spoken plainly — forecast, categories, and magic-link auth.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
