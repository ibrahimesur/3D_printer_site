import Link from "next/link";

const products = [
  { id: 1, name: "Telefon Standı", price: 35, seller: "Ahmet Y.", city: "İstanbul", material: "PLA", rating: 4.8, reviews: 24, image: "📱" },
  { id: 2, name: "Masa Üstü Organizer", price: 55, seller: "Elif K.", city: "Ankara", material: "PETG", rating: 4.9, reviews: 18, image: "🗂️" },
  { id: 3, name: "Kulaklık Askısı", price: 28, seller: "Mehmet D.", city: "İzmir", material: "PLA", rating: 4.7, reviews: 31, image: "🎧" },
  { id: 4, name: "Saksı - Geometrik", price: 42, seller: "Zeynep A.", city: "Bursa", material: "PLA", rating: 4.6, reviews: 12, image: "🌱" },
  { id: 5, name: "Kablo Düzenleyici", price: 18, seller: "Can B.", city: "Antalya", material: "TPU", rating: 4.5, reviews: 45, image: "🔌" },
  { id: 6, name: "Bardak Altlığı Set", price: 30, seller: "Selin T.", city: "İstanbul", material: "PLA", rating: 4.9, reviews: 56, image: "☕" },
  { id: 7, name: "Anahtarlık Özel", price: 12, seller: "Burak M.", city: "Konya", material: "PLA", rating: 4.4, reviews: 89, image: "🔑" },
  { id: 8, name: "Laptop Standı", price: 75, seller: "Deniz S.", city: "İzmir", material: "PETG", rating: 4.8, reviews: 15, image: "💻" },
];

const categories = [
  { name: "Tümü", count: 128, active: true },
  { name: "Ev & Yaşam", count: 45 },
  { name: "Teknoloji", count: 32 },
  { name: "Ofis", count: 28 },
  { name: "Dekorasyon", count: 15 },
  { name: "Aksesuar", count: 8 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero - Compact */}
      <section className="bg-surface text-text-main border-b border-border py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            3D Baskı Ürünleri Pazaryeri
          </h1>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Yüzlerce üreticiden hazır 3D baskı ürünlerini keşfedin ve hemen satın alın.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex bg-background border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
              <input
                type="text"
                placeholder="Ürün veya kategori ara..."
                className="flex-1 px-4 py-3 bg-transparent text-text-main text-sm focus:outline-none placeholder:text-text-muted"
              />
              <button className="px-6 bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
                Ara
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10">
          {/* Sidebar - Categories */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-main mb-4">Kategoriler</h3>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      cat.active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-muted hover:bg-surface hover:text-text-main"
                    }`}
                  >
                    {cat.name}
                    <span className="text-text-muted/50 ml-1">({cat.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-text-muted">128 ürün bulundu</p>
              <select className="input-field max-w-[220px] py-2 px-3 text-sm bg-surface">
                <option>Önerilen</option>
                <option>Fiyat: Düşükten Yükseğe</option>
                <option>Fiyat: Yüksekten Düşüğe</option>
                <option>En Çok Değerlendirilen</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link
                  href={`/product/${product.id}`}
                  key={product.id}
                  className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group block"
                >
                  {/* Product Image Placeholder */}
                  <div className="bg-background h-40 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                    {product.image}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 bg-surface z-10 relative border-t border-border/50">
                    <h3 className="font-medium text-text-main text-sm mb-1">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-primary text-xs">★</span>
                      <span className="text-xs text-text-muted">{product.rating}</span>
                      <span className="text-xs text-text-muted/50">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main">₺{product.price}</span>
                      <span className="text-xs text-text-muted">{product.material}</span>
                    </div>
                    <div className="mt-2 text-xs text-text-muted/70">
                      {product.seller} · {product.city}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
