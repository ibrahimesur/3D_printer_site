"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/common/Button";
import api from "@/services/api";

export default function ApplyProducerPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    printer_info: "",
    experience: "",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      // POST request to our new application endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/v1/applications/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Başvuru sırasında bir hata oluştu.");
      }

      setStatus("success");
      // Optional: automatically login user with the created customer credentials, 
      // but simpler to just tell them to login.
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-8">
            Üretici başvurunuz başarıyla sistemimize ulaştı. Ekibimiz bilgilerinizi inceledikten sonra onay verecektir. 
            Bu süreçte oluşturduğumuz hesabınızla giriş yaparak sitemizi müşteri olarak kullanmaya başlayabilirsiniz.
          </p>
          <Link href="/auth/login">
            <Button variant="primary" className="w-full justify-center">Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* About Us / Why Produce for Us Section */}
        <div className="md:w-1/2 bg-orange-50 p-8 md:p-12 flex flex-col justify-center border-r border-orange-100">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <img src="/printago.svg" alt="PrintAgo" className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter text-orange-500 lowercase">printago</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Bizim İçin Üretim Yapın</h1>
          
          <div className="space-y-6 text-gray-600">
            <p>
              PrintAgo, 3D baskı teknolojisini herkes için erişilebilir kılan Türkiye'nin öncü pazaryeridir. Büyük bir müşteri ağına ulaşıyoruz ve bizimle birlikte büyüyecek yetenekli 3D yazıcı üreticilerini arıyoruz.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-orange-500 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Yazıcılarınızı Kazanca Dönüştürün</h3>
                <p className="text-sm">Boşta duran 3D yazıcılarınızı üretime dahil edin; oturduğunuz yerden siparişleri kabul ederek ek gelir sağlamaya başlayın.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-orange-500 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hazır Müşteri ve Sipariş Ağı</h3>
                <p className="text-sm">Pazarlama, reklam veya müşteri bulma süreçleriyle vakit kaybetmeyin. PrintAgo ile doğrudan baskı ihtiyacı olan binlerce müşteriye anında ulaşın.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-orange-500 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Zamanında ve Güvenli Ödeme</h3>
                <p className="text-sm">Tüm sipariş ve tahsilat süreçleri PrintAgo güvencesi altındadır. Tamamladığınız üretimlerin ödemelerini her hafta düzenli olarak banka hesabınızdan çekin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Üretici Başvuru Formu</h2>
          <p className="text-sm text-gray-500 mb-6">Formu doldurun, sizinle iletişime geçelim.</p>

          {status === "error" && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm mb-6 border border-red-100">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  placeholder="E-posta adresiniz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Şifresi</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  placeholder="En az 6 karakter"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sahip Olduğunuz Yazıcılar</label>
              <textarea
                name="printer_info"
                required
                rows={2}
                value={formData.printer_info}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
                placeholder="Örn: 2 adet Creality Ender 3 V2, 1 adet Anycubic Prusa i3 MK3S+"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3D Baskı Tecrübeniz</label>
              <textarea
                name="experience"
                required
                rows={3}
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
                placeholder="Ne zamandır baskı alıyorsunuz? Hangi materyallerle (PLA, ABS, PETG vb.) çalışıyorsunuz? Kısaca kendinizden bahsedin."
              ></textarea>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-3 text-base shadow-orange-500/20 shadow-lg mt-2"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Gönderiliyor..." : "Başvurumu Gönder"}
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Zaten bir üretici misiniz? <Link href="/auth/login" className="text-orange-500 hover:underline">Giriş Yapın</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
