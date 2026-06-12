const BACKEND_URL =
  (typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')) ||
  'http://localhost:8001';

/** Relative upload paths → full absolute URLs */
function resolveUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  // Relative path like /uploads/design_images/xxx.jpg
  return `${BACKEND_URL}${url}`;
}

export interface ProductWithImages {
  image_url?: string | null;
  image_urls?: string[] | null;
}

/** Ürünün tüm görsellerini döner; image_urls yoksa image_url'den türetir. */
export function getProductImages(product: ProductWithImages): string[] {
  const urls = (product.image_urls || []).filter(Boolean).map(resolveUrl);
  if (urls.length > 0) return urls;
  if (product.image_url) return [resolveUrl(product.image_url)];
  return [];
}

/** Liste kartları için birincil görsel. */
export function getPrimaryProductImage(product: ProductWithImages): string | null {
  return getProductImages(product)[0] ?? null;
}
