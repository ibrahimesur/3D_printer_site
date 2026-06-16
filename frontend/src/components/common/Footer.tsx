import Link from 'next/link';
<<<<<<< Updated upstream
=======
import { usePathname } from 'next/navigation';
>>>>>>> Stashed changes

export default function Footer() {
  return (
    <footer className="bg-[#F3F4F6] text-gray-700 py-10 border-t border-gray-200 mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<<<<<<< Updated upstream
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-orange-500">PrintAgo</span>
=======
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Block */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-orange-500 lowercase">filamengo</span>
>>>>>>> Stashed changes
            </Link>
            <p className="text-sm text-gray-500">
              Türkiye'nin ilk 3D baskı pazaryeri. Kendi tasarımınızı yükleyin veya hazır ürünleri satın alın.
            </p>
<<<<<<< Updated upstream
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
=======
            {/* Social Links */}
            <div className="flex space-x-3 pt-1">
              <a href="https://www.instagram.com/filamengo3d?igsh=MWN1ZHZidDR6NW8zcA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">İletişim</h3>
            <div className="space-y-4 text-xs text-gray-500">
              <div>
                <p className="font-bold text-gray-900 mb-0.5">E-posta</p>
                <a href="mailto:info@filamengo.com" className="hover:text-orange-500 transition-colors">info@filamengo.com</a>
              </div>
            </div>
          </div>

          {/* Hızlı Erişim */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Hızlı Erişim</h3>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Anasayfa</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">İletişim</Link></li>
              <li><Link href="/sss" className="hover:text-orange-500 transition-colors">Sıkça Sorulan Sorular</Link></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Kurumsal</h3>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><Link href="/apply-producer" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">Üretici Havuzuna Katılın</Link></li>
              <li><Link href="/hakkimizda" className="hover:text-orange-500 transition-colors">Hakkımızda</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">KVKK Politikası</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Teslimat ve Sipariş Koşulları</Link></li>
            </ul>
          </div>

          {/* Üyelik */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Üyelik</h3>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Yeni Üyelik</Link></li>
              <li><Link href="/auth/login" className="hover:text-orange-500 transition-colors">Üye Girişi</Link></li>
              <li><Link href="/cart" className="hover:text-orange-500 transition-colors">Sepetim</Link></li>
              <li><Link href="/" className="hover:text-orange-500 transition-colors">İade İşlemleri</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-100 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Filamengo. Tüm hakları saklıdır.
          </p>
          {/* Payment Badges with Actual SVG Logos */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Güvenli Ödeme:</span>
            <div className="flex gap-3 items-center">
              {/* Visa Logo */}
              <img src="/visa.png" alt="Visa" className="h-4 w-auto object-contain select-none" />
              
              {/* Mastercard Logo */}
              <div className="h-4 w-[28px] bg-white border border-gray-200 rounded flex items-center justify-center p-[2px] shadow-sm select-none">
                <svg className="h-full w-auto" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" fill="#EB001B" />
                  <circle cx="22" cy="10" r="10" fill="#F79E1B" opacity="0.9" />
                  <path d="M16 3.125a9.966 9.966 0 013.844 6.875A9.966 9.966 0 0116 16.875a9.966 9.966 0 01-3.844-6.875A9.966 9.966 0 0116 3.125z" fill="#FF5F00" />
                </svg>
              </div>
              
              {/* Troy Logo */}
              <img src="/troy.png" alt="Troy" className="h-4 w-auto object-contain select-none" />
            </div>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </footer>
  );
}
