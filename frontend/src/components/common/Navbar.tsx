"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "./Button";
import SearchBar from "./SearchBar";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const totalItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const finishHydration = () => setIsMounted(true);

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(finishHydration);
    useAuthStore.persist.rehydrate();

    return unsubscribe;
  }, []);

  // Restrict producer navigation
  useEffect(() => {
    if (isMounted && isAuthenticated() && user?.role === "producer") {
      if (
        pathname !== "/dashboard" && 
        !pathname.startsWith("/designs") && 
        !pathname.startsWith("/auth") &&
        !pathname.startsWith("/admin") // Admin checking just in case
      ) {
        router.push("/dashboard");
      }
    }
  }, [isMounted, isAuthenticated, user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isMounted && isAuthenticated() && user?.role === "producer") {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
              <img src="/filamengo.png" alt="Filamengo Logo" className="h-12 w-12 object-contain transform group-hover:rotate-6 transition-transform duration-300" />
              <span className="hidden sm:block text-3xl font-black tracking-tighter text-orange-500 lowercase group-hover:text-orange-600 transition-colors">filamengo</span>
            </Link>

            {/* Actions */}
            <div>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-100">
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <img src="/filamengo.png" alt="Filamengo Logo" className="h-12 w-12 object-contain transform group-hover:rotate-6 transition-transform duration-300" />
            <span className="hidden sm:block text-3xl font-black tracking-tighter text-orange-500 lowercase group-hover:text-orange-600 transition-colors">filamengo</span>
          </Link>

          {/* Central Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl px-4">
            <SearchBar />
          </div>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">

            {isMounted && isAuthenticated() && user?.role === "admin" && (
              <Link href="/admin" className="text-primary hover:text-primary-dark transition-colors text-sm font-semibold">
                Yönetici Paneli
              </Link>
            )}
            {isMounted && isAuthenticated() && user?.role === "producer" && (
              <Link href="/dashboard" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
                Üretici Paneline Git
              </Link>
            )}
          </div>

          {/* Admin & Auth Status */}
          <div className="hidden md:flex items-center gap-3">
            {isMounted && isAuthenticated() && (
              <Link href="/favorites" className="flex flex-col items-center justify-center text-gray-600 hover:text-orange-500 transition-colors p-1" title="Favorilerim">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span className="text-[11px] font-medium mt-0.5">Favorilerim</span>
              </Link>
            )}
            <Link href="/cart" className="relative flex flex-col items-center justify-center text-gray-600 hover:text-orange-500 transition-colors p-1 group">
              <div className="relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {isMounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-orange-500 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-0.5">Sepetim</span>
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            {isMounted ? (
              isAuthenticated() ? (
                <div className="relative group py-2">
                  <div className="flex flex-col items-center justify-center cursor-pointer">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-[11px] font-medium mt-0.5 text-gray-600 group-hover:text-orange-500 transition-colors">Hesabım</span>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full -mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Giriş yapıldı</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1 flex flex-col">
                      <Link href="/orders" className="px-4 py-2.5 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                        Siparişlerim
                      </Link>
                      <Link href="/settings" className="px-4 py-2.5 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                        Ayarlar
                      </Link>
                      {user?.role === "admin" && (
                        <Link href="/admin" className="px-4 py-2.5 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors font-medium">
                          Yönetici Paneli
                        </Link>
                      )}
                      {user?.role === "producer" && (
                        <Link href="/dashboard" className="px-4 py-2.5 text-[13px] text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors font-medium">
                          Üretici Paneli
                        </Link>
                      )}
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">Giriş Yap</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="primary" size="sm">Kayıt Ol</Button>
                  </Link>
                </>
              )
            ) : (
              <div className="w-32 h-8"></div> // Placeholder to prevent layout shift
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-muted hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">

              {isMounted && isAuthenticated() && user?.role === "admin" && (
                <Link href="/admin" className="text-primary hover:text-primary-dark transition-colors py-2 text-sm font-semibold">Yönetici Paneli</Link>
              )}
              {isMounted && isAuthenticated() && user?.role === "producer" && (
                <Link href="/dashboard" className="text-text-muted hover:text-primary transition-colors py-2 text-sm font-medium">Üretici Paneline Git</Link>
              )}
              <div className="flex items-center justify-between py-2 text-sm font-medium text-text-muted hover:text-primary">
                <Link href="/cart">Sepetim</Link>
                {isMounted && totalItems > 0 && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">{totalItems}</span>}
              </div>


              {/* Mobile Categories - Horizontal Scroll */}
              <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-2 pb-2">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isMounted && pathname === "/"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                    }`}
                  >
                    Ana Sayfa
                  </Link>
                  {CATEGORIES.map((category) => {
                    const isActive = isMounted && pathname === `/category/${category.slug}`;
                    return (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? "bg-orange-500 text-white"
                            : category.slug === "dunya-kupasi-2026"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                        }`}
                      >
                        {category.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Nav Links */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                {isMounted && isAuthenticated() && user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Yönetici Paneli
                  </Link>
                )}
                {isMounted && isAuthenticated() && user?.role === "producer" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Üretici Paneline Git
                  </Link>
                )}

                {isMounted && isAuthenticated() && (
                  <>
                    <Link
                      href="/favorites"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      Favorilerim
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      Siparişlerim
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ayarlar
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Auth */}
              <div className="pt-3 border-t border-gray-100">

                {!isMounted ? (
                  <div className="h-9 flex-1" />
                ) : isAuthenticated() ? (
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleLogout}>
                    Çıkış Yap
                  </Button>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Giriş Yap
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        Kayıt Ol
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


        {/* Categories Bar - Desktop */}
        <div className="hidden md:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 h-10 text-[13px] font-medium text-gray-600 flex-wrap">
              <Link
                href="/"
                className={`hover:text-orange-500 transition-colors whitespace-nowrap h-full flex items-center ${
                  isMounted && pathname === "/" ? "text-orange-500 font-semibold border-b-2 border-orange-500" : ""
                }`}
              >
                Ana Sayfa
              </Link>
              {CATEGORIES.map((category) => {
                const isActive = isMounted && pathname === `/category/${category.slug}`;
                const isWorldCup = category.slug === "dunya-kupasi-2026";
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;

              return (
                <div key={category.slug} className="relative group h-full flex items-center">
                  <Link
                    href={`/category/${category.slug}`}
                    className={`hover:text-orange-500 transition-colors whitespace-nowrap h-full flex items-center ${
                      isActive
                        ? "text-orange-500 font-semibold border-b-2 border-orange-500"
                        : isWorldCup
                        ? "text-red-600 font-semibold"
                        : ""
                    }`}
                  >
                    {category.label}
                    {hasSubcategories && (
                      <svg className="w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {hasSubcategories && (
                    <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-lg rounded-b-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                      {category.subcategories!.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/category/${category.slug}?sub=${sub.slug}`}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors font-medium"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
