import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoftScroll — Calm Book Discovery",
  description: "A peaceful, distraction-free experience for discovering and understanding books. Browse curated recommendations, read free books, and explore AI-powered summaries.",
  keywords: ["books", "reading", "book discovery", "calm reading", "AI book summary", "free books"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
