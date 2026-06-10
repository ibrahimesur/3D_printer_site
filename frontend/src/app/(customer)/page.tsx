"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/services/api";

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

const categories = [
  { name: "Tümü", count: 0, active: true },
  { name: "Ev & Yaşam", count: 0 },
  { name: "Teknoloji", count: 0 },
  { name: "Ofis", count: 0 },
  { name: "Dekorasyon", count: 0 },
  { name: "Aksesuar", count: 0 },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts() as Product[];
        setProducts(data);
      } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - Compact */}
      <section className="bg-surface text-text-main border-b border-border py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            3D Baskı Ürünleri Pazaryeri
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Yüzlerce üreticiden hazır 3D baskı ürünlerini keşfedin ve hemen satın alın.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex bg-background border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
              <input
                type="text"
                placeholder="Ürün veya kategori ara..."
                className="flex-1 px-4 py-3 bg-transparent text-text-main text-sm focus:outline-none placeholder:text-text-muted"
              />
              <button className="px-6 bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
                Ara
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10">
          {/* Sidebar - Categories */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-main mb-4">Kategoriler</h3>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      cat.active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-muted hover:bg-surface hover:text-text-main"
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-text-muted">
                {loading ? "Yükleniyor..." : `${products.length} ürün bulundu`}
              </p>
              <select className="input-field max-w-[220px] py-2 px-3 text-sm bg-surface">
                <option>Önerilen</option>
                <option>Fiyat: Düşükten Yükseğe</option>
                <option>Fiyat: Yüksekten Düşüğe</option>
                <option>En Çok Değerlendirilen</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-muted">Ürünler yükleniyor...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border text-text-muted">
                Henüz satılacak ürün bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group block flex flex-col h-full"
                  >
                    {/* Product Image Placeholder */}
                    <div className="bg-white aspect-square w-full flex items-center justify-center text-5xl overflow-hidden border-b border-border/30">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-gray-400 text-sm group-hover:scale-105 transition-transform duration-300">Görsel Yok</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 bg-surface z-10 relative border-t border-border/50 flex-1 flex flex-col">
                      <h3 className="font-medium text-text-main text-sm mb-1 line-clamp-1">{product.title}</h3>
                      <div className="text-xs text-text-muted mb-2 line-clamp-2 min-h-[32px]">
                        {product.description || "Açıklama bulunmuyor"}
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-text-main">₺{product.price.toFixed(2)}</span>
                          <span className="text-xs text-text-muted">{product.filament_type || "-"}</span>
                        </div>
                        <div className="text-xs text-text-muted/70 truncate">
                          {product.category || "Genel Kategori"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
