"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import api from "@/services/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = (await api.forgotPassword(email)) as any;

      if (result.reset_token) {
        // Dev modda: token'ı doğrudan kullanarak sıfırlama sayfasına yönlendir
        router.push(`/auth/reset-password?token=${result.reset_token}`);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-2xl shadow-sm border border-border">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-main">
              E-posta Gönderildi
            </h2>
            <p className="mt-3 text-text-muted">
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen
              gelen kutunuzu kontrol edin.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary-dark text-sm"
            >
              ← Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-main">
            Şifrenizi Sıfırlayın
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Hesabınıza kayıtlı e-posta adresinizi girin, size şifre sıfırlama
            bağlantısı gönderelim.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-border rounded-lg placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-text-main"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5"
              disabled={isLoading}
            >
              {isLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:text-primary-dark text-sm"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
