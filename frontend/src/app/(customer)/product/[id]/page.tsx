"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/common/Button";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
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

interface Review {
  id: number;
  user_email: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
}

interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  reviews: Review[];
  can_review: boolean;
  has_reviewed: boolean;
  purchase_required: boolean;
}

function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${sizeClass} transition-transform ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${filled ? "text-amber-400" : "text-gray-300"}`}
            aria-label={`${star} yıldız`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="flex h-40 items-center justify-center overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-text-main">
          {product.title}
        </h3>
        <p className="mb-3 line-clamp-2 min-h-[32px] text-xs text-text-muted">
          {product.description || "Açıklama bulunmuyor"}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-text-main">
            ₺{product.price.toFixed(2)}
          </span>
          <span className="text-xs text-text-muted">
            {product.category || "Genel"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [reviewData, setReviewData] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const loadReviews = async (id: number) => {
    try {
      const data = (await api.getProductReviews(id)) as ReviewSummary;
      setReviewData(data);
    } catch (error) {
      console.error("Yorumlar yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      const id = parseInt(productId);
      if (Number.isNaN(id)) {
        setLoading(false);
        return;
      }

      try {
        const data = (await api.getProduct(id)) as Product;
        setProduct(data);
      } catch (error) {
        console.error("Ürün yüklenirken hata oluştu:", error);
        setLoading(false);
        return;
      }

      setLoading(false);

      try {
        const similar = (await api.getSimilarProducts(id)) as Product[];
        setSimilarProducts(similar);
      } catch (error) {
        console.error("Benzer ürünler yüklenirken hata:", error);
      }

      await loadReviews(id);
    };

    loadProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image_url || "🏆",
      quantity: quantity,
      filament: product.filament_type || "Bilinmiyor",
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleSubmitReview = async () => {
    if (!product || newRating === 0) return;

    setSubmittingReview(true);
    setReviewError("");

    try {
      await api.createProductReview(product.id, {
        rating: newRating,
        comment: newComment.trim() || undefined,
      });
      setNewRating(0);
      setNewComment("");
      await loadReviews(product.id);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Değerlendirme gönderilemedi."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24 pb-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-muted">Ürün yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background pt-24 pb-16">
        <span className="text-5xl">🔍</span>
        <p className="text-text-muted">Ürün bulunamadı.</p>
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="transition-colors hover:text-primary">
            Ana Sayfa
          </Link>
          <span>/</span>
          <span className="text-text-main">{product.title}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4">
        {/* Hero */}
        <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-background p-10 lg:min-h-[520px]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />

              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="relative z-10 max-h-[440px] w-full max-w-md object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/70 shadow-xl ring-1 ring-amber-200/60 backdrop-blur-sm">
                    <span className="text-8xl drop-shadow-md">🏆</span>
                  </div>
                  <p className="text-sm font-medium text-amber-800/70">
                    3D Baskı Ürün Görseli
                  </p>
                </div>
              )}

              {product.is_active && (
                <span className="absolute left-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Stokta
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center p-8 lg:p-12">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  {product.category || "Genel Kategori"}
                </span>
                {reviewData && reviewData.total_reviews > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    ★ {reviewData.average_rating.toFixed(1)} (
                    {reviewData.total_reviews} yorum)
                  </span>
                )}
              </div>

              <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-text-main lg:text-5xl">
                {product.title}
              </h1>

              <div className="mb-6 inline-flex flex-col rounded-2xl bg-gradient-to-r from-primary/10 to-amber-100/60 p-5 ring-1 ring-primary/20">
                <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Satış Fiyatı
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-text-main lg:text-5xl">
                    ₺{product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-text-muted">/ adet</span>
                </div>
                {quantity > 1 && (
                  <p className="mt-2 text-sm font-medium text-primary">
                    {quantity} adet = ₺{totalPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold text-text-main">
                  Miktar
                </p>
                <div className="inline-flex items-center overflow-hidden rounded-xl ring-1 ring-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-12 w-12 items-center justify-center bg-background text-lg font-bold text-text-main transition-colors hover:bg-gray-100"
                  >
                    −
                  </button>
                  <div className="flex h-12 w-16 items-center justify-center border-x border-border bg-surface text-lg font-bold text-text-main">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-12 w-12 items-center justify-center bg-background text-lg font-bold text-text-main transition-colors hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/25"
                onClick={handleAddToCart}
                disabled={!product.is_active}
              >
                {isAdded
                  ? "Sepete Eklendi! ✓"
                  : product.is_active
                    ? "Sepete Ekle"
                    : "Stokta Yok"}
              </Button>

              <p className="mt-4 text-center text-xs text-text-muted">
                Satıcı:{" "}
                <span className="font-semibold text-text-main">
                  Printago Partner
                </span>{" "}
                · Türkiye
              </p>
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-background to-primary/5 px-8 py-5">
            <h2 className="text-xl font-bold text-text-main">Ürün Açıklaması</h2>
          </div>
          <div className="relative px-8 py-8">
            <div className="absolute left-0 top-8 h-[calc(100%-4rem)] w-1 rounded-r-full bg-gradient-to-b from-primary to-amber-400" />
            <p className="pl-6 text-lg leading-relaxed text-text-muted">
              {product.description ||
                "Bu ürün için henüz bir açıklama eklenmemiş."}
            </p>
          </div>
        </section>

        {/* Benzer Ürünler */}
        <section>
          <div className="mb-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
              Keşfet
            </p>
            <h2 className="text-2xl font-bold text-text-main">Benzer Ürünler</h2>
          </div>

          {similarProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-8 py-12 text-center">
              <span className="mb-3 block text-4xl">🛍️</span>
              <p className="font-medium text-text-main">
                Henüz benzer ürün bulunmuyor
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Yeni ürünler eklendiğinde burada görünecek.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Tüm ürünlere göz at
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </section>

        {/* Yorumlar */}
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-background to-amber-50/50 px-8 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Müşteri Deneyimi
                </p>
                <h2 className="text-2xl font-bold text-text-main">
                  Yorumlar & Puanlar
                </h2>
              </div>
              {reviewData && (
                <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 ring-1 ring-border">
                  <span className="text-3xl font-black text-text-main">
                    {reviewData.average_rating.toFixed(1)}
                  </span>
                  <div>
                    <StarRating
                      value={Math.round(reviewData.average_rating)}
                      readonly
                      size="sm"
                    />
                    <p className="text-xs text-text-muted">
                      {reviewData.total_reviews} değerlendirme
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 px-8 py-8">
            {/* Yorum formu */}
            {!isAuthenticated() ? (
              <div className="rounded-2xl bg-background p-6 text-center ring-1 ring-border">
                <p className="mb-3 text-sm text-text-muted">
                  Değerlendirme yapmak için giriş yapmalısınız.
                </p>
                <Link href="/auth/login">
                  <Button variant="primary" size="md">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            ) : reviewData?.has_reviewed ? (
              <div className="rounded-2xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                Bu ürün için değerlendirmenizi zaten yaptınız. Teşekkürler!
              </div>
            ) : reviewData?.purchase_required ? (
              <div className="rounded-2xl bg-amber-50 p-5 text-center text-sm text-amber-800 ring-1 ring-amber-200">
                Bu ürünü yalnızca satın alan kullanıcılar değerlendirebilir.
              </div>
            ) : reviewData?.can_review ? (
              <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
                <h3 className="mb-1 font-semibold text-text-main">
                  Değerlendirmenizi paylaşın
                </h3>
                <p className="mb-4 text-sm text-text-muted">
                  1 ile 5 yıldız arasında puan verin.
                </p>

                <div className="mb-4">
                  <StarRating value={newRating} onChange={setNewRating} />
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorumunuz (isteğe bağlı)..."
                  rows={3}
                  maxLength={500}
                  className="input-field mb-4 resize-none text-sm"
                />

                {reviewError && (
                  <p className="mb-3 text-sm text-red-500">{reviewError}</p>
                )}

                <Button
                  variant="primary"
                  onClick={handleSubmitReview}
                  disabled={newRating === 0 || submittingReview}
                  isLoading={submittingReview}
                >
                  Değerlendirmeyi Gönder
                </Button>
              </div>
            ) : null}

            {/* Yorum listesi */}
            {!reviewData || reviewData.reviews.length === 0 ? (
              <div className="py-8 text-center">
                <span className="mb-2 block text-4xl">💬</span>
                <p className="font-medium text-text-main">
                  Henüz yorum yapılmamış
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Bu ürünü satın alan ilk değerlendiren siz olun.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {reviewData.reviews.map((review) => (
                  <div key={review.id} className="py-6 first:pt-0 last:pb-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {review.user_email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-main">
                            {review.user_email}
                          </p>
                          {review.created_at && (
                            <p className="text-xs text-text-muted">
                              {new Date(review.created_at).toLocaleDateString(
                                "tr-TR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    {review.comment && (
                      <p className="pl-[52px] text-sm leading-relaxed text-text-muted">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobil sticky sepet */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 p-4 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-text-muted">Toplam</p>
            <p className="text-xl font-black text-text-main">
              ₺{totalPrice.toFixed(2)}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="flex-1 font-bold"
            onClick={handleAddToCart}
            disabled={!product.is_active}
          >
            {isAdded ? "Eklendi ✓" : "Sepete Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
