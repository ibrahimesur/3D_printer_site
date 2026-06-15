"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import api from "@/services/api";

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      await api.checkout(items);
      setSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || "Sipariş tamamlanırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Siparişiniz Alındı!</h2>
          <p className="text-gray-500 mb-8 text-lg">Siparişiniz başarıyla oluşturuldu ve üretici havuzuna eklendi.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-1"
          >
            Alışverişe Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ödeme Sayfası</h1>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col lg:flex-row border border-gray-100">
        {/* Cart Summary */}
        <div className="p-8 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sipariş Özeti</h2>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Sepetiniz boş.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
              >
                Alışverişe Başla
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={`${item.id}-${item.filament}`} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-6">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center shadow-inner">
                        <span className="text-xs text-gray-400">Görsel Yok</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Filament: <span className="font-medium text-gray-700">{item.filament}</span> | Adet: <span className="font-medium text-gray-700">{item.quantity}</span></p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} ₺</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Panel */}
        <div className="p-8 lg:w-1/3 bg-gray-50 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Toplam Tutar</h3>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {totalPrice.toFixed(2)} <span className="text-3xl text-gray-500 font-medium">₺</span>
            </div>
            <p className="text-sm text-gray-500 mb-8">KDV ve Kargo dahildir.</p>

            {error && (
              <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-xl border border-red-200">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className={`w-full py-4 px-4 rounded-xl shadow-md text-lg font-bold text-white transition-all transform hover:-translate-y-1 flex items-center justify-center ${loading || items.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </>
            ) : "Siparişi Tamamla"}
          </button>
        </div>
      </div>
    </div>
  );
}
