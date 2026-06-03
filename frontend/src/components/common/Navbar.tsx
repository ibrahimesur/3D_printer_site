"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "./Button";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-main">Printer</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
              Ana Sayfa
            </Link>
            <Link href="/dashboard" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
              Üretici Paneli
            </Link>
          </div>

          {/* Auth & Cart Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button className="relative text-text-main hover:text-primary transition-colors p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <Button variant="ghost" size="sm">Giriş Yap</Button>
            <Button variant="primary" size="sm">Kayıt Ol</Button>
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
              <Link href="/" className="text-text-muted hover:text-primary transition-colors py-2 text-sm font-medium">Ana Sayfa</Link>
              <Link href="/dashboard" className="text-text-muted hover:text-primary transition-colors py-2 text-sm font-medium">Üretici Paneli</Link>
              <div className="flex items-center justify-between py-2 text-sm font-medium text-text-muted hover:text-primary">
                <span>Sepetim</span>
                {totalItems > 0 && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">{totalItems}</span>}
              </div>
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1">Giriş Yap</Button>
                <Button variant="primary" size="sm" className="flex-1">Kayıt Ol</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
