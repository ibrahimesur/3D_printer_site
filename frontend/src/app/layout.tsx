import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "PrintAgo | 3D Baskı Pazaryeri",
  description:
    "3D yazıcı sahiplerini müşterilerle buluşturan Türkiye'nin ilk 3D baskı pazaryeri. STL dosyanızı yükleyin, anında fiyat alın.",
  keywords: ["3D baskı", "3D printing", "STL", "3D yazıcı", "pazaryeri", "marketplace"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PrintAgo",
  },
};

import Footer from "@/components/common/Footer";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background text-text-main antialiased flex flex-col" suppressHydrationWarning>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
