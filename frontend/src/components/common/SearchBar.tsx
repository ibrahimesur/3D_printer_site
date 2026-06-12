"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Product } from "@/components/common/ProductCard";
import { getPrimaryProductImage } from "@/lib/productImages";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search fetching
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await api.getProducts(query.trim()) as Product[];
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      // Optional: Redirect to a search results page if you have one.
      // For now, if the user presses enter, we could just select the first suggestion
      // or redirect to a category/search page.
      if (suggestions.length > 0) {
        router.push(`/product/${suggestions[0].id}`);
      }
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="3D model, ürün veya kategori ara..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          className="w-full bg-gray-100 border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-sm text-center text-gray-500">Aranıyor...</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-none"
                    onClick={() => {
                      setQuery("");
                      setIsOpen(false);
                      router.push(`/product/${product.id}`);
                    }}
                  >
                    {(() => {
                      const primaryImage = getPrimaryProductImage(product);
                      return primaryImage ? (
                        <img src={primaryImage} alt={product.title} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.title}</p>
                      <p className="text-xs text-orange-500 font-semibold">₺{product.price.toFixed(2)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-center text-gray-500">
              "{query}" için sonuç bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
