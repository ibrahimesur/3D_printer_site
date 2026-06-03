import Link from "next/link";
import Button from "@/components/common/Button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
            Türkiye&apos;nin İlk 3D Baskı Pazaryeri
          </div>

          {/* Main Heading */}
          <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight tracking-tight">
            <span className="text-surface-100">3D Yazıcın Evde</span>
            <br />
            <span className="text-surface-100">Boş Durmasın,</span>
            <br />
            <span className="text-gradient">Hemen Üretmeye ve</span>
            <br />
            <span className="text-gradient">Kazanmaya Başla!</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto mt-6 text-lg sm:text-xl text-surface-400 leading-relaxed">
            STL dosyanızı yükleyin, anında fiyat teklifi alın. 
            3D yazıcı sahipleri ve müşterileri bir araya getiren platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/upload">
              <Button variant="primary" size="lg">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Dosya Yükle &amp; Fiyat Al
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Üretici Olarak Katıl
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 mt-20 animate-slide-up">
          {[
            { value: "500+", label: "Aktif Üretici" },
            { value: "10K+", label: "Tamamlanan Baskı" },
            { value: "81 İl", label: "Ülke Geneli" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-display font-bold text-gradient">{stat.value}</div>
              <div className="mt-1 text-sm text-surface-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">
            Nasıl <span className="text-gradient">Çalışır?</span>
          </h2>
          <p className="text-center text-surface-400 mb-16 max-w-xl mx-auto">
            Sadece 3 adımda 3D baskınızı teslim alın.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Dosyanızı Yükleyin",
                description: "STL veya 3MF dosyanızı sürükleyip bırakın. Sistem otomatik analiz eder.",
                icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
              },
              {
                step: "02",
                title: "Teklif Alın",
                description: "Yapay zeka destekli fiyatlandırma motoru anında maliyet hesaplar.",
                icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
              },
              {
                step: "03",
                title: "Üretim & Teslimat",
                description: "En yakın üretici siparişinizi basar ve kargoya verir.",
                icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.143-.504 1.095-1.122a38.001 38.001 0 00-3.22-12.078A2.25 2.25 0 0016.5 3.75H14.25",
              },
            ].map((item) => (
              <div key={item.step} className="glass-card-hover p-8 group">
                <div className="w-12 h-12 mb-6 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="text-xs font-mono text-primary-500 mb-2">ADIM {item.step}</div>
                <h3 className="text-xl font-display font-semibold mb-3 text-surface-100">{item.title}</h3>
                <p className="text-surface-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
