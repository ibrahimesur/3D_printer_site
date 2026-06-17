"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Footer() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hide footer on admin, producer dashboard, designs and auth pages
  const isHidden = 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/designs') || 
    pathname?.startsWith('/auth');

  if (isHidden) return null;

  return (
    <footer className="bg-[#F9FAFB] text-gray-600 py-6 border-t border-gray-100 mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Block */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link 
              href="/" 
              className="flex items-center gap-2"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
            >
              <span className="text-2xl font-black tracking-tighter text-orange-500 lowercase">filamengo</span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              Türkiye'nin lider 3D baskı pazaryeri. Kendi tasarımınızı yükleyerek anında fiyat teklifi alın.
            </p>
            {/* Social Links */}
            <div className="flex space-x-3 pt-1">
              <a href="https://www.facebook.com/Filamengo?mibextid=wwXIfr&rdid=hIEVCrasKvG0G2XT&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1BHq79JstP%2F%3Fmibextid%3DwwXIfr" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="https://www.instagram.com/filamengo3d?igsh=MWN1ZHZidDR6NW8zcA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.youtube.com/@Filamengo" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@filamengo3d?_r=1&_t=ZS-97GPJQ3dkxM" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
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
              <li><a href="/" className="hover:text-orange-500 transition-colors">Anasayfa</a></li>
              <li><Link href="/iletisim" className="hover:text-orange-500 transition-colors">İletişim</Link></li>
              <li><Link href="/sss" className="hover:text-orange-500 transition-colors">Sıkça Sorulan Sorular</Link></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Kurumsal</h3>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><Link href="/apply-producer" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">Üretici Havuzuna Katılın</Link></li>
              <li><Link href="/hakkimizda" className="hover:text-orange-500 transition-colors">Hakkımızda</Link></li>
              <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-orange-500 transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="/kvkk-politikasi" className="hover:text-orange-500 transition-colors">KVKK Politikası</Link></li>
              <li><Link href="/teslimat-ve-siparis-kosullari" className="hover:text-orange-500 transition-colors">Teslimat ve Sipariş Koşulları</Link></li>
            </ul>
          </div>

          {/* Üyelik */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Üyelik</h3>
            <ul className="space-y-2.5 text-xs text-gray-500">
              {isMounted && isAuthenticated() ? (
                <>
                  <li><Link href="/orders" className="hover:text-orange-500 transition-colors">Siparişlerim</Link></li>
                  <li><button onClick={() => logout()} className="hover:text-orange-500 transition-colors text-left w-full">Çıkış Yap</button></li>
                </>
              ) : (
                <>
                  <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Yeni Üyelik</Link></li>
                  <li><Link href="/auth/login" className="hover:text-orange-500 transition-colors">Üye Girişi</Link></li>
                </>
              )}
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
              <img src="/visa.png" alt="Visa" className="h-6 w-auto object-contain select-none mix-blend-darken" />
              
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
        </div>
      </div>
    </footer>
  );
}
