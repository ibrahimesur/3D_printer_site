import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Printer | 3D Baskı Pazaryeri",
  description:
    "3D yazıcı sahiplerini müşterilerle buluşturan Türkiye'nin ilk 3D baskı pazaryeri. STL dosyanızı yükleyin, anında fiyat alın.",
  keywords: ["3D baskı", "3D printing", "STL", "3D yazıcı", "pazaryeri", "marketplace"],
};

import Footer from "@/components/common/Footer";

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
      </body>
    </html>
  );
}
