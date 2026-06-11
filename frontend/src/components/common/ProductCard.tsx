"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { getPrimaryProductImage } from "@/lib/productImages";

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  filament_type: string | null;
  image_url: string | null;
  image_urls?: string[];
  is_active: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const primaryImage = getPrimaryProductImage(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Ürün detay sayfasına gitmeyi engelle
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: primaryImage || "",
      quantity: 1,
      filament: product.filament_type || "Standart",
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-500 hover:shadow-md transition-all group block flex flex-col h-full"
    >
      {/* Product Image */}
      <div className="relative w-full aspect-[3/4] bg-white flex items-center justify-center overflow-hidden border-b border-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
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
            {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </span>
          <button
            onClick={handleAddToCart}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              added
                ? "bg-green-500 text-white"
                : "bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white"
            }`}
            title="Sepete Ekle"
          >
            {added ? (
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
  );
}
