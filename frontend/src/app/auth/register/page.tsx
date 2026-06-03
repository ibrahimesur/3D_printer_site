"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/common/Button";

export default function RegisterPage() {
  const router = useRouter();
  
  const [role, setRole] = useState<"customer" | "producer">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8001/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Kayıt başarısız");
      }

      // Automatically redirect to login after successful registration
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-main">
            Yeni Hesap Oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary-dark">
              Giriş yapın
            </Link>
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex p-1 space-x-1 bg-background rounded-xl">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              role === "customer"
                ? "bg-surface shadow-sm text-primary border border-border"
                : "text-text-muted hover:text-text-main"
            }`}
            onClick={() => setRole("customer")}
          >
            Müşteri
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              role === "producer"
                ? "bg-surface shadow-sm text-primary border border-border"
                : "text-text-muted hover:text-text-main"
            }`}
            onClick={() => setRole("producer")}
          >
            Üretici
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">E-posta Adresi</label>
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
              <label className="block text-sm font-medium text-text-main mb-1">Şifre</label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-border rounded-lg placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-text-main"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5"
              disabled={isLoading}
            >
              {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
