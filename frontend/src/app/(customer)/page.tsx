"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import ProductCard, { Product } from "@/components/common/ProductCard";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("recommended");

  const sortedProducts = useMemo(() => {
    switch (sort) {
      case "price-asc":
        return [...products].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...products].sort((a, b) => b.price - a.price);
      case "best-sellers":
        return [...products].sort((a, b) => b.id - a.id);
      default:
        return products;
    }
  }, [products, sort]);

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
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 pb-10">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Popüler Ürünler</h2>
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-500 hidden sm:block">
                {loading ? "Yükleniyor..." : `${products.length} ürün listeleniyor`}
              </p>
              <select 
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-300 rounded-md py-1.5 px-3 text-[13px] bg-white text-gray-700 outline-none focus:border-orange-500"
              >
                <option value="recommended">Önerilen</option>
                <option value="price-asc">En Düşük Fiyat</option>
                <option value="price-desc">En Yüksek Fiyat</option>
                <option value="best-sellers">En Çok Satanlar</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-muted">Ürünler yükleniyor...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border text-text-muted">
                Henüz satılacak ürün bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
