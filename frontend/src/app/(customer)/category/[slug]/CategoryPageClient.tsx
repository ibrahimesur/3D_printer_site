"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import type { Category } from "@/lib/categories";
import ProductCard, { Product } from "@/components/common/ProductCard";

type SortOption = "recommended" | "price-asc" | "price-desc";

interface CategoryPageClientProps {
  category: Category;
}

export default function CategoryPageClient({ category }: CategoryPageClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("recommended");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = (await api.getProducts()) as Product[];
        setProducts(data);
      } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categoryProducts = useMemo(() => {
    const filtered = products.filter((p) => p.category === category.name);

    switch (sort) {
      case "price-asc":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...filtered].sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  }, [products, category.name, sort]);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-orange-500 transition-colors">
            Anasayfa
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{category.name}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 flex-col sm:flex-row gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{category.name}</h1>
              <p className="text-xs text-gray-500 mt-1">{category.description}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <p className="text-xs text-gray-500 hidden sm:block" suppressHydrationWarning>
                {loading ? "Yükleniyor..." : `${categoryProducts.length} ürün listeleniyor`}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="border border-gray-300 rounded-md py-1.5 px-3 text-[13px] bg-white text-gray-700 outline-none focus:border-orange-500"
              >
                <option value="recommended">Önerilen</option>
                <option value="price-asc">En Düşük Fiyat</option>
                <option value="price-desc">En Yüksek Fiyat</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Ürünler yükleniyor...</div>
          ) : categoryProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-600 font-medium mb-1">Bu kategoride henüz ürün bulunmuyor.</p>
              <p className="text-xs text-gray-500 mb-4">Yakında yeni ürünler eklenecek, takipte kalın!</p>
              <Link
                href="/"
                className="inline-block text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                Tüm ürünlere göz at →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
