import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Kategori bulunamadı</h1>
          <p className="text-sm text-gray-500 mb-6">
            Aradığınız kategori mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Tüm Ürünlere Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
