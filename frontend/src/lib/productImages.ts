export interface ProductWithImages {
  image_url?: string | null;
  image_urls?: string[] | null;
}

/** Ürünün tüm görsellerini döner; image_urls yoksa image_url'den türetir. */
export function getProductImages(product: ProductWithImages): string[] {
  const urls = (product.image_urls || []).filter(Boolean);
  if (urls.length > 0) return urls;
  if (product.image_url) return [product.image_url];
  return [];
}

/** Liste kartları için birincil görsel. */
export function getPrimaryProductImage(product: ProductWithImages): string | null {
  return getProductImages(product)[0] ?? null;
}
