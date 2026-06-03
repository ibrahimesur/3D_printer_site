"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Login request
      const res = await fetch("http://localhost:8001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Giriş başarısız");
      }

      const { access_token } = await res.json();

      // Get user profile
      const userRes = await fetch("http://localhost:8001/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) {
        throw new Error("Kullanıcı bilgileri alınamadı");
      }

      const userData = await userRes.json();
      
      // Save to store
      setAuth(access_token, userData);

      // Redirect
      if (userData.role === "admin") {
        router.push("/admin");
      } else if (userData.role === "producer") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
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
            Hesabınıza Giriş Yapın
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            veya{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:text-primary-dark">
              yeni hesap oluşturun
            </Link>
          </p>
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
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
