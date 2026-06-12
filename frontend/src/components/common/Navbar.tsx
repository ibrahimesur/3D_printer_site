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
            {/* Logo with Link to Dashboard */}
            <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
              <img src="/printago.svg" alt="PrintAgo Logo" className="h-12 w-12 object-contain transform group-hover:rotate-6 transition-transform duration-300" />
              <span className="hidden sm:block text-3xl font-black tracking-tighter text-orange-500 lowercase group-hover:text-orange-600 transition-colors">printago</span>
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
            <img src="/printago.svg" alt="PrintAgo Logo" className="h-12 w-12 object-contain transform group-hover:rotate-6 transition-transform duration-300" />
            <span className="hidden sm:block text-3xl font-black tracking-tighter text-orange-500 lowercase group-hover:text-orange-600 transition-colors">printago</span>
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
              {isMounted && isAuthenticated() && (
                <Link href="/favorites" className="text-text-muted hover:text-red-500 transition-colors py-2 text-sm font-medium">Favorilerim</Link>
              )}
              <div className="flex gap-3 pt-3 border-t border-border">
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

      {/* Categories Bar */}
      <div className="hidden md:block border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-10 text-[13px] font-medium text-gray-600 overflow-x-auto no-scrollbar">
            <Link
              href="/"
              className={`hover:text-orange-500 transition-colors whitespace-nowrap h-full flex items-center ${
                isMounted && pathname === "/" ? "text-orange-500 font-semibold border-b-2 border-orange-500" : ""
              }`}
            >
              Tümü
            </Link>
            {CATEGORIES.map((category) => {
              const isActive = isMounted && pathname === `/category/${category.slug}`;
              const isWorldCup = category.slug === "dunya-kupasi-2026";
              return (
                <Link
                  key={category.slug}
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
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
