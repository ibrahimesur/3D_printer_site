"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "./Button";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className="text-xl font-display font-bold text-gradient">Printer</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-surface-300 hover:text-primary-400 transition-colors duration-200 text-sm font-medium">
              Ana Sayfa
            </Link>
            <Link href="/upload" className="text-surface-300 hover:text-primary-400 transition-colors duration-200 text-sm font-medium">
              Dosya Yükle
            </Link>
            <Link href="/dashboard" className="text-surface-300 hover:text-primary-400 transition-colors duration-200 text-sm font-medium">
              Üretici Paneli
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">Giriş Yap</Button>
            <Button variant="primary" size="sm">Kayıt Ol</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-surface-300 hover:text-primary-400 transition-colors"
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
          <div className="md:hidden py-4 border-t border-surface-700/50 animate-slide-up">
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-surface-300 hover:text-primary-400 transition-colors py-2 text-sm font-medium">Ana Sayfa</Link>
              <Link href="/upload" className="text-surface-300 hover:text-primary-400 transition-colors py-2 text-sm font-medium">Dosya Yükle</Link>
              <Link href="/dashboard" className="text-surface-300 hover:text-primary-400 transition-colors py-2 text-sm font-medium">Üretici Paneli</Link>
              <div className="flex gap-3 pt-3 border-t border-surface-700/50">
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
