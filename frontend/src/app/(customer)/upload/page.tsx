import Link from "next/link";
import Button from "@/components/common/Button";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        {/* Yakında Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Yakında
        </div>

        <h1 className="text-3xl font-bold text-text-main mb-4">
          Kendi Tasarımını Yükle
        </h1>
        <p className="text-text-muted mb-10 max-w-md mx-auto">
          STL dosyanızı yükleyip anında fiyat teklifi alma özelliği çok yakında hizmetinizde olacak.
        </p>

        {/* Disabled Upload Area */}
        <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 mb-8 opacity-60 cursor-not-allowed">
          <div className="w-16 h-16 mx-auto mb-4 bg-background rounded-xl flex items-center justify-center border border-border">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-text-main font-medium mb-1">STL dosyanızı sürükleyip bırakın</p>
          <p className="text-sm text-text-muted">Bu özellik henüz aktif değil</p>
        </div>

        <Link href="/">
          <Button variant="secondary">← Pazaryeri&apos;ne Dön</Button>
        </Link>
      </div>
    </div>
  );
}
