import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#F3F4F6] text-gray-700 py-10 border-t border-gray-200 mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-orange-500">PrintAgo</span>
            </Link>
            <p className="text-sm text-gray-500">
              Türkiye'nin ilk 3D baskı pazaryeri. Kendi tasarımınızı yükleyin veya hazır ürünleri satın alın.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Ana Sayfa</Link></li>
              <li><Link href="/apply-producer" className="hover:text-orange-500 transition-colors">Üretici Ol</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Müşteri Hizmetleri</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-500 transition-colors">İletişim</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Sıkça Sorulan Sorular</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Kargo ve Teslimat</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">İade Koşulları</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Yasal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Kullanım Koşulları</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PrintAgo. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
