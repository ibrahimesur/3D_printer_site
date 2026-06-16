import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hakkımızda | Filamengo',
  description: 'Türkiye’nin tamamen 3D baskı odaklı ilk ve lider pazaryeri platformu Filamengo hakkında daha fazla bilgi edinin.',
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
              Biz Kimiz?
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              <Link href="/" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">Filamengo</Link>, geleceğin üretim teknolojisi olan 3D baskıyı herkes için ulaşılabilir, dinamik ve kazançlı hale getiren, Türkiye’nin tamamen 3D baskı odaklı ilk ve lider pazaryeri platformudur.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Main Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Geleneksel Üretime Karşı Yeni Bir Vizyon</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Teknolojinin hızla dönüştüğü günümüzde, geleneksel fabrikasyon üretimin tek düzeliğine karşı çıkıyor; hayalleri, tasarımları ve üretimi tek bir çatı altında buluşturuyoruz.
              </p>
              <p>
                Filamengo olarak hem kendi özgün tasarımlarımızı ve inovatif ürünlerimizi sizlerle buluşturuyor hem de Türkiye’nin dört bir yanındaki bağımsız 3D yazıcı üreticilerinin üretim güçlerini doğrudan bizim marketplace'imiz üzerinden dünyaya açmalarını sağlıyoruz.
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Ne Yapıyoruz?</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Pazaryerimizde sıradan e-ticaret sitelerinden farklı olarak sadece ve sadece 3D yazıcı teknolojileriyle hayat bulmuş ürünler yer alır. Koleksiyonluk figürlerden endüstriyel yedek parçalara, estetik dekoratif objelerden hobi dünyasına ve en kaliteli filamentlere kadar uzanan geniş ürün yelpazemizle, dijital modellerin fiziksel dünyaya kusursuzca aktarıldığı bir köprü görevi görüyoruz.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Sipariş üzerine üretime dayalı esnek yapımız sayesinde, seri üretimin sınırlarına takılmadan, tamamen kişiye özel ve ihtiyaca yönelik çözümler üretebiliyoruz.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Ekosistemimiz ve Değerlerimiz</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Filamengo sadece bir alışveriş sitesi değil, kendi kendini besleyen ve büyüten sürdürülebilir bir üretim topluluğudur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Yaratıcılığı Destekliyoruz</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tasarımcıların ve üreticilerin emeklerini koruyor, fikri mülkiyete değer veriyor ve özgün işlerin hak ettiği kitleye ulaşmasını sağlıyoruz.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Üreticiye Güç Veriyoruz</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Geliştirdiğimiz yenilikçi "Sipariş Havuzu" sistemi sayesinde, 3D yazıcı sahiplerinin müşteri bulma veya reklam yapma maliyetleriyle uğraşmadan, cihazlarını kolayca düzenli birer gelir kapısına dönüştürmelerine imkan tanıyoruz.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Geleceği İnşa Ediyoruz</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                İhtiyaç anında, yerinden ve lojistik israfı minimuma indiren "on-demand" (talep üzerine) üretim modelini destekleyerek daha çevreci ve sürdürülebilir bir e-ticaret modeline öncülük ediyoruz.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-orange-500 rounded-3xl p-8 md:p-12 text-center text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
             <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
               <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L5.46 7.82l6.54 3.67 6.54-3.67L12 4.15zM4.5 15.65l6.5 3.65v-7.31L4.5 8.34v7.31zm15 0v-7.31l-6.5 3.65v7.31l6.5-3.65z"/>
             </svg>
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black mb-6">Filamengo ile hayal edin, biz basalım!</h2>
            <p className="text-orange-100 text-lg mb-8 leading-relaxed">
              3D baskı dünyasının sınırsız potansiyelini keşfetmek, benzersiz tasarımlara sahip olmak veya yazıcınızla topluluğumuzun bir parçası olarak üretmeye başlamak için doğru yerdesiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="px-8 py-3 bg-white text-orange-500 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Ürünleri Keşfet
              </Link>
              <Link href="/apply-producer" className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-sm">
                Üretici Havuzuna Katılın
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
