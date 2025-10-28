import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/Auth.context";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KSK Colle",
  description: "Officiële website van KSK Colle schaakclub",
  keywords: "schaken, schaakclub, KSK Colle, toernooi, competitie, Sint-Niklaas, Waasland, België, Waasland Schaakvereniging Colle",
  authors: [{ name: "KSK Colle" }],
  robots: "index, follow",
  openGraph: {
    title: "Schaakclub KSK Colle in Sint-Niklaas",
    description: "Officiële website van KSK Colle schaakclub",
    type: "website",
    locale: "nl_BE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//kskcolle-production.up.railway.app" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster />
          <PerformanceMonitor />
        </AuthProvider>
      </body>
    </html>
  );
}