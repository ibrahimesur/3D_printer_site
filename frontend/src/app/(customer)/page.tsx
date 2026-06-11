"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useCartStore } from "@/store/useCartStore";

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
  const addItem = useCartStore((state) => state.addItem);
  const [addedItemIds, setAddedItemIds] = useState<Set<number>>(new Set());

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); // Prevent navigating to the product detail page
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image_url || '',
      quantity: 1,
      filament: product.filament_type || 'Standart',
    });
    
    // Show temporary feedback
    setAddedItemIds(prev => {
      const newSet = new Set(prev);
      newSet.add(product.id);
      return newSet;
    });
    
    setTimeout(() => {
      setAddedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

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
    <div className="min-h-screen bg-gray-50 pt-32 pb-10">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Popüler Ürünler</h2>
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-500 hidden sm:block">
                {loading ? "Yükleniyor..." : `${products.length} ürün listeleniyor`}
              </p>
              <select className="border border-gray-300 rounded-md py-1.5 px-3 text-[13px] bg-white text-gray-700 outline-none focus:border-orange-500">
                <option>Önerilen</option>
                <option>En Düşük Fiyat</option>
                <option>En Yüksek Fiyat</option>
                <option>En Çok Satanlar</option>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-500 hover:shadow-md transition-all group block flex flex-col h-full"
                  >
                    {/* Product Image */}
                    <div className="relative w-full aspect-[3/4] bg-white flex items-center justify-center overflow-hidden border-b border-gray-100">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : (
                        <span className="text-gray-300 text-xs">Görsel Yok</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-[13px] leading-tight line-clamp-2 mb-1 group-hover:text-orange-500 transition-colors">
                          {product.title}
                        </h3>
                        <div className="text-[11px] text-gray-500 mb-2 truncate">
                          {product.category || "3D Baskı"}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-orange-500">
                          {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                        <button 
                          onClick={(e) => handleAddToCart(e, product)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            addedItemIds.has(product.id) 
                              ? 'bg-green-500 text-white' 
                              : 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white'
                          }`}
                          title="Sepete Ekle"
                        >
                          {addedItemIds.has(product.id) ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                        </button>
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
