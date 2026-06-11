export interface Category {
  slug: string;
  name: string;
  /** Navbar'da gösterilen etiket (emoji vb. içerebilir) */
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "dunya-kupasi-2026",
    name: "Dünya Kupası 2026",
    label: "Dünya Kupası 2026 🏆",
    description: "Dünya Kupası 2026'ya özel figürler, kupalar ve taraftar ürünleri.",
  },
  {
    slug: "figur-karakter",
    name: "Figür & Karakter",
    label: "Figür & Karakter",
    description: "Oyun, film ve anime karakterleri ile koleksiyonluk figürler.",
  },
  {
    slug: "dekoratif-urunler",
    name: "Dekoratif Ürünler",
    label: "Dekoratif Ürünler",
    description: "Eviniz ve ofisiniz için şık 3D baskı dekorasyon ürünleri.",
  },
  {
    slug: "yedek-parca",
    name: "Yedek Parça",
    label: "Yedek Parça",
    description: "Kırılan ya da kaybolan parçalar için dayanıklı 3D baskı yedek parçalar.",
  },
  {
    slug: "maket-hobi",
    name: "Maket & Hobi",
    label: "Maket & Hobi",
    description: "Maket tutkunları ve hobi projeleri için parçalar ve setler.",
  },
  {
    slug: "aksesuar",
    name: "Aksesuar",
    label: "Aksesuar",
    description: "Günlük kullanım için pratik ve eğlenceli 3D baskı aksesuarlar.",
  },
  {
    slug: "filamentler",
    name: "Filamentler",
    label: "Filamentler",
    description: "PLA, ABS, PETG ve daha fazlası — yüksek kaliteli filamentler.",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
