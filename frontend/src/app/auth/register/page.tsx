"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/common/Button";
import api from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();
  
  const [role, setRole] = useState<"customer" | "producer">("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.register(fullName, email, password, role);

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

        {/* Role Toggle Kaldırıldı, artık sadece müşteri kaydı yapılıyor */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">İsim Soyisim</label>
              <input
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-border rounded-lg placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-text-main"
                placeholder="Ör: Ali Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
              className="w-full justify-center py-2.5 shadow-orange-500/20 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-sm text-text-muted mb-2">3D yazıcınız mı var?</p>
          <Link 
            href="/apply-producer" 
            className="inline-flex items-center justify-center px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            Bizim İçin Üretim Yapmak İster Misiniz?
          </Link>
        </div>
      </div>
    </div>
  );
}
