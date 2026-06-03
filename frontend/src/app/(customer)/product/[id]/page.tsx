"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import { useCartStore } from "@/store/useCartStore";

// Mock data fetching function based on ID
const getProductById = (id: string) => {
  const products = [
    { id: "1", name: "Telefon Standı", price: 35, seller: "Ahmet Y.", city: "İstanbul", material: "PLA", rating: 4.8, reviews: 24, image: "📱", desc: "Masanızda telefonunuzu şık bir şekilde tutacak, farklı açılarda kullanım sunan ergonomik 3D baskı telefon standı." },
    { id: "2", name: "Masa Üstü Organizer", price: 55, seller: "Elif K.", city: "Ankara", material: "PETG", rating: 4.9, reviews: 18, image: "🗂️", desc: "Kalemlerinizi, notlarınızı ve masanızdaki ufak tefek eşyaları düzenli tutmanızı sağlayacak dayanıklı organizer." },
    { id: "3", name: "Kulaklık Askısı", price: 28, seller: "Mehmet D.", city: "İzmir", material: "PLA", rating: 4.7, reviews: 31, image: "🎧", desc: "Masanın altına veya yanına monte edilebilen, yer tasarrufu sağlayan kullanışlı kulaklık askısı." },
  ];
  return products.find((p) => p.id === id) || products[0];
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: parseInt(product.id),
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      filament: product.material,
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
          
          {/* Product Image Gallery (Left Side) */}
          <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-20 border-r border-border min-h-[400px]">
            <span className="text-9xl transform hover:scale-110 transition-transform duration-300">
              {product.image}
            </span>
          </div>

          {/* Product Info (Right Side) */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
              <span>{product.category || "Aksesuar"}</span>
              <span>•</span>
              <span className="flex items-center text-primary">
                ★ {product.rating} <span className="text-text-muted ml-1">({product.reviews} Değerlendirme)</span>
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-text-main mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-text-main mb-6">₺{product.price}</p>
            
            <p className="text-text-muted leading-relaxed mb-8">
              {product.desc}
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-main mb-2">Filament Türü</h3>
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-background border border-border text-sm font-medium text-text-main">
                {product.material}
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
                Satıcı: <span className="font-medium text-text-main">{product.seller}</span> ({product.city})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
