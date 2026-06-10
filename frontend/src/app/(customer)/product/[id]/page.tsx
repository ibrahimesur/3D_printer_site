"use client";

import { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import { useCartStore } from "@/store/useCartStore";
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

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await api.getProduct(parseInt(params.id)) as Product;
        setProduct(data);
      } catch (error) {
        console.error("Ürün yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image_url || "📱",
      quantity: quantity,
      filament: product.filament_type || "Bilinmiyor",
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-text-muted">Ürün yükleniyor...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="text-text-muted">Ürün bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
          
          {/* Product Image Gallery (Left Side) */}
          <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-8 border-r border-border min-h-[400px]">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="max-w-full max-h-[500px] object-contain transform hover:scale-105 transition-transform duration-300 rounded-lg shadow-sm"
              />
            ) : (
              <span className="text-9xl transform hover:scale-110 transition-transform duration-300">
                📦
              </span>
            )}
          </div>

          {/* Product Info (Right Side) */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
              <span>{product.category || "Genel Kategori"}</span>
              <span>•</span>
              <span className="flex items-center text-primary">
                ★ 4.8 <span className="text-text-muted ml-1">(0 Değerlendirme)</span>
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-text-main mb-4">{product.title}</h1>
            <p className="text-2xl font-bold text-text-main mb-6">₺{product.price.toFixed(2)}</p>
            
            <p className="text-text-muted leading-relaxed mb-8">
              {product.description || "Bu ürün için bir açıklama bulunmuyor."}
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-main mb-2">Filament Türü</h3>
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-background border border-border text-sm font-medium text-text-main">
                {product.filament_type || "-"}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-text-main mb-2">Miktar</h3>
              <div className="flex items-center">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-l-lg border border-border bg-background hover:bg-gray-100 text-text-main"
                >
                  -
                </button>
                <div className="w-16 h-10 flex items-center justify-center border-t border-b border-border bg-surface text-text-main font-medium">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-r-lg border border-border bg-background hover:bg-gray-100 text-text-main"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full h-14 text-lg font-semibold"
                onClick={handleAddToCart}
              >
                {isAdded ? "Sepete Eklendi! ✓" : "Sepete Ekle"}
              </Button>
              <div className="text-center text-xs text-text-muted mt-2">
                Satıcı: <span className="font-medium text-text-main">Printago Partner</span> (Türkiye)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
