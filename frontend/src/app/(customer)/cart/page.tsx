"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/common/Button";

export default function CartPage() {
  const { items, removeItem, addItem, clearCart } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleUpdateQuantity = (item: any, delta: number) => {
    if (item.quantity + delta > 0) {
      // To update quantity, we can use addItem with the delta
      addItem({ ...item, quantity: delta });
    } else {
      removeItem(item.id, item.filament);
    }
  };

  const shippingCost = totalPrice > 500 ? 0 : 49.99;
  const finalTotal = totalPrice > 0 ? totalPrice + shippingCost : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sepetim ({totalItems} Ürün)</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sepetiniz şu an boş</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Sepetinizde ürün bulunmuyor. Hemen 3D baskı dünyasını keşfetmeye başlayın ve sepetinizi doldurun!</p>
            <Link href="/">
              <Button variant="primary" className="px-8">Alışverişe Başla</Button>
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flow-root">
                    <ul role="list" className="-my-6 divide-y divide-gray-200">
                      {items.map((item) => (
                        <li key={`${item.id}-${item.filament}`} className="py-6 flex">
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            <img
                              src={item.image || "/placeholder.png"}
                              alt={item.name}
                              className="h-full w-full object-contain object-center"
                            />
                          </div>

                          <div className="ml-4 flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <h3>
                                  <Link href={`/product/${item.id}`} className="hover:text-orange-500 transition-colors">
                                    {item.name}
                                  </Link>
                                </h3>
                                <p className="ml-4 text-orange-500 font-bold">{(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">Filament: {item.filament}</p>
                              <p className="mt-1 text-xs text-gray-400">Birim Fiyat: {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                            </div>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item, -1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-l-lg transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item, 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-r-lg transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id, item.filament)}
                                className="font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline">Kaldır</span>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Clear Cart Button */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <Link href="/" className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Alışverişe Dön
                  </Link>
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Sepeti Temizle
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Sipariş Özeti</h2>

                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <p>Ürünlerin Toplamı</p>
                    <p className="font-medium text-gray-900">{totalPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Kargo Ücreti</p>
                    <p className="font-medium text-gray-900">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">Bedava</span>
                      ) : (
                        shippingCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                      )}
                    </p>
                  </div>
                  {shippingCost > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
                      Sepetinize {(500 - totalPrice).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}'lik ürün daha ekleyin, kargo bedava olsun!
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <p className="text-base font-bold text-gray-900">Ödenecek Tutar</p>
                    <p className="text-xl font-bold text-orange-500">{finalTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/checkout" className="block w-full">
                    <Button variant="primary" className="w-full py-3 text-base shadow-orange-500/20 shadow-lg">
                      Sepeti Onayla
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  256-bit SSL sertifikası ile güvenli ödeme
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
