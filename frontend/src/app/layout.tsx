import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Printer | 3D Baskı Pazaryeri",
  description:
    "3D yazıcı sahiplerini müşterilerle buluşturan Türkiye'nin ilk 3D baskı pazaryeri. STL dosyanızı yükleyin, anında fiyat alın.",
  keywords: ["3D baskı", "3D printing", "STL", "3D yazıcı", "pazaryeri", "marketplace"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-surface-900 text-surface-100 antialiased">
        {children}
      </body>
    </html>
  );
}
