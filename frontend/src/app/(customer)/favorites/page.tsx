"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/services/api";
import { getPrimaryProductImage } from "@/lib/productImages";

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  filament_type: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface FavoriteItem {
  id: number;
  product_id: number;
  product: Product;
}

export default function FavoritesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    const loadFavorites = async () => {
      try {
        const data = (await api.getFavorites()) as FavoriteItem[];
        setFavorites(data);
      } catch (error) {
        console.error("Favoriler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated, router]);

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      await api.removeFavorite(productId);
      setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
    } catch (error) {
      console.error("Favoriden çıkarılırken hata:", error);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="mx-auto max-w-6xl px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main">Favorilerim</h1>
        <p className="mt-1 text-sm text-text-muted">
          Beğendiğin ürünleri buradan takip edebilirsin.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-8 py-16 text-center">
          <span className="mb-3 block text-5xl">🤍</span>
          <p className="font-medium text-text-main">Henüz favori ürünün yok</p>
          <p className="mt-1 text-sm text-text-muted">
            Ürün sayfasından kalp ikonuna basarak favorilere ekleyebilirsin.
          </p>
          <Link href="/" className="mt-6 inline-block">
            <Button variant="primary">Ürünlere Göz At</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {favorites.map((item) => {
            const primaryImage = getPrimaryProductImage(item.product);

            return (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
            >
              <Link
                href={`/product/${item.product.id}`}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-40 items-center justify-center overflow-hidden bg-gray-100">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={item.product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-text-main">
                    {item.product.title}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-xs text-text-muted">
                    {item.product.description || "Açıklama bulunmuyor"}
                  </p>
                  <span className="mt-auto font-bold text-text-main">
                    ₺{item.product.price.toFixed(2)}
                  </span>
                </div>
              </Link>
              <div className="border-t border-border p-3">
                <button
                  onClick={() => handleRemove(item.product_id)}
                  disabled={removingId === item.product_id}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Favoriden Çıkar
                </button>
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
