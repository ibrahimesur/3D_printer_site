"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/services/api";

interface OrderProduct {
  id: number;
  title: string;
  image_url: string | null;
  image_urls: string[];
}

interface Order {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  status: string;
  total_price: number | null;
  product: OrderProduct | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-100">Beklemede</span>;
    case "quoted":
      return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-100">Fiyat Verildi</span>;
    case "accepted":
      return <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800 border border-indigo-100">Onaylandı</span>;
    case "printing":
      return <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-800 border border-purple-100">Üretimde</span>;
    case "shipped":
      return <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 border border-orange-100">Kargoya Verildi</span>;
    case "delivered":
      return <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-100">Teslim Edildi</span>;
    case "cancelled":
      return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-100">İptal Edildi</span>;
    default:
      return <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-800 border border-gray-100">{status}</span>;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    const loadOrders = async () => {
      try {
        const data = (await api.listOrders()) as Order[];
        // Sort orders by ID descending (newest first)
        const sortedData = data.sort((a, b) => b.id - a.id);
        setOrders(sortedData);
      } catch (error) {
        console.error("Siparişler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="mx-auto max-w-5xl px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Siparişlerim</h1>
        <p className="mt-2 text-sm text-gray-500">
          Geçmiş siparişlerinizi ve üretim durumlarını buradan takip edebilirsiniz.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
            <svg className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Henüz siparişiniz bulunmuyor</h2>
          <p className="mb-8 text-gray-500 max-w-md mx-auto">
            3D baskı dünyasını keşfetmeye başlamak için birbirinden özel tasarımlarımıza göz atın ve hemen ilk siparişinizi verin.
          </p>
          <Link href="/" className="inline-block">
            <Button variant="primary" className="px-8 py-3 text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5">
              Ürünleri Keşfet
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const product = order.product;
            const primaryImage = product?.image_urls?.[0] || product?.image_url;

            return (
              <div
                key={order.id}
                className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="w-full sm:w-48 bg-gray-50 flex-shrink-0 flex items-center justify-center p-4">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product?.title || "Ürün Görseli"}
                      className="h-32 w-32 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-32 w-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-500">Sipariş No: #{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <Link href={product ? `/product/${product.id}` : "#"} className="hover:text-orange-500 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900">
                          {product?.title || "Özel Tasarım Ürün"}
                        </h3>
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Toplam Tutar</p>
                      <p className="text-xl font-black text-orange-500">
                        {order.total_price !== null ? `₺${order.total_price.toFixed(2)}` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-6 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Adet:</span>
                      <span className="text-sm font-semibold text-gray-900">{order.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
