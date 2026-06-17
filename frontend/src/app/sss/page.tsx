import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | Filamengo',
  description: 'Filamengo Sıkça Sorulan Sorular',
};

const FAQItem = ({ question, answer, isList = false, listItems = [] }: { question: string, answer: string, isList?: boolean, listItems?: string[] }) => (
  <details className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
    <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer font-medium text-gray-900 hover:text-orange-500 transition-colors">
      <span className="text-base md:text-lg">{question}</span>
      <span className="ml-6 flex-shrink-0 text-orange-400 group-open:rotate-180 transition-transform duration-300">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </summary>
    <div className="px-5 md:px-6 pb-5 md:pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
      <p>{answer}</p>
      {isList && listItems.length > 0 && (
        <ul className="mt-4 space-y-3 pl-2">
          {listItems.map((item, index) => {
            const [boldPart, restPart] = item.split(':');
            return (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 mr-3"></span>
                <span>
                  {restPart ? (
                    <>
                      <strong className="font-semibold text-gray-800">{boldPart}:</strong>
                      {restPart}
                    </>
                  ) : (
                    item
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </details>
);

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center mb-6">
            <Link href="/">
              <span className="text-4xl md:text-6xl font-black tracking-tighter text-orange-500 lowercase hover:text-orange-600 transition-colors cursor-pointer">filamengo</span>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-6">
            Sıkça Sorulan Sorular (SSS)
          </h1>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Platformumuzun işleyişi, sipariş süreçleri ve üretici katılımı hakkında merak edilen tüm detayları sizin için derledik.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-sm">1</span>
              Genel Sorular
            </h2>
            <div className="space-y-4">
              <FAQItem 
                question="Filamengo nedir?" 
                answer="Filamengo, sadece 3D yazıcı teknolojileriyle üretilen ürünlerin, özgün tasarımların ve hobi malzemelerinin yer aldığı tematik bir e-ticaret pazaryeridir. Platformumuzda hem Filamengo olarak kendi ürünlerimizi satıyor hem de 3D yazıcı sahibi bağımsız üreticilerin kendi ürünlerini ve tasarımlarını doğrudan bizim pazaryerimizde satabilmelerine imkan tanıyoruz."
              />
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-sm">2</span>
              Popüler Sorular
            </h2>
            <div className="space-y-4">
              <FAQItem 
                question="Sipariş ettiğim ürünün hazırlık ve kargo süresi nedir?" 
                answer="Sitemizdeki bazı ürünler hazır stokta bulunabilirken, bazı ürünler siparişiniz üzerine üreticilerimiz tarafından size özel olarak üretilir. Ürünün boyutuna, işçiliğine ve üretim yoğunluğuna göre değişen hazırlık süresi, ürün detay sayfasında genel olarak belirtilmektedir."
              />
              <FAQItem 
                question="3D baskı ürünlerin malzemesi kaliteli ve güvenli mi?" 
                answer="Platformumuzda satılan ürünlerde, 3D yazıcı teknolojilerine uygun, dayanıklı ve günlük kullanıma hazır kaliteli malzemeler kullanılır. Ürünlerin malzeme özellikleri ve kullanım önerileri ürün açıklamalarında yer almaktadır."
              />
              <FAQItem 
                question="3D baskı ürünlerin görünümü nasıldır?" 
                answer="3D yazıcı teknolojisiyle üretilen ürünler, fabrikasyon plastik ürünlerden farklı olarak kendilerine has, hafif dokulu ve estetik bir yüzey yapısına sahiptir. Bu doku, 3D baskı ürünlerin özgün tasarım ruhunu yansıtır."
              />
              <FAQItem 
                question="Kendi istediğim bir tasarımı bastırabilir miyim?" 
                answer="Çok yakında devreye alacağımız özel sipariş özellikleri sayesinde, hayata geçirmek istediğiniz modeller için platformumuzdaki üreticilerden kolayca destek alabileceksiniz."
              />
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-sm">3</span>
              Üreticiler İçin Sorular
            </h2>
            <div className="space-y-4">
              <FAQItem 
                question="Filamengo'da üretici olmanın avantajları nelerdir?" 
                answer="Filamengo, 3D yazıcılarınızı boşta bırakmayarak ek gelir kapısına dönüştürmenizi sağlar. Ayrı bir mağaza yönetimiyle, müşteri bulmakla veya reklam yapmakla bütçe ve zaman kaybetmezsiniz; ödemesi peşin yapılmış siparişler doğrudan havuzunuza düşer."
              />
              <FAQItem 
                question="Siparişleri nasıl alacağım? Müşteri bulmam gerekiyor mu?" 
                answer="Hayır, reklam ve pazarlama maliyetleriyle uğraşmanıza gerek yoktur. Filamengo'nun geniş müşteri ağından gelen ve ödemesi peşin olarak tahsil edilen işler ortak bir sipariş havuzuna aktarılır. Siz sadece havuzdaki uygun işleri kabul ederek bizim pazaryerimiz üzerinden satış yapar ve üretime başlarsınız."
              />
              <FAQItem 
                question="Sistem tam olarak nasıl çalışıyor?" 
                answer="Süreç oldukça basit ve 4 temel adımdan oluşmaktadır:"
                isList={true}
                listItems={[
                  "Başvuru: Üretici başvuru formunu doldurur ve onay bekler.",
                  "Kurulum: Profil ve fiyat bilgilerini sisteme girer.",
                  "Üret & Gönder: Havuzdan kendine uygun siparişi seçer, üretir ve kargolar.",
                  "Kazancı Al: Tamamlanan işlerin kazancı haftalık olarak hesabına yatar."
                ]}
              />
              <FAQItem 
                question="Ödemelerimi ne zaman ve nasıl alırım?" 
                answer="Filamengo güvenli ve düzenli bir ödeme sistemine sahiptir. Havuzdan alıp başarıyla ürettiğiniz ve kargoladığınız siparişlerin kazançları, her hafta düzenli olarak belirttiğiniz banka hesabınıza yatırılır."
              />
              <FAQItem 
                question="Hangi 3D yazıcılara sahip olanlar sisteme katılabilir?" 
                answer="Cihazını kazanca dönüştürmek, kendi ürünlerini marketplace'imizde satmak ve profesyonel kalitede üretim yapmak isteyen tüm 3D yazıcı sahipleri platformumuza başvurabilir. Başvuru esnasında profilinizi ve üretim kapasitenizi girmeniz yeterlidir."
              />
              <FAQItem 
                question="Kargo süreçleri nasıl yürütülüyor?" 
                answer="Sipariş aldığınızda sistemimiz size otomatik bir kargo kodu tanımlar. Ürününüzü güvenli bir şekilde paketleyip bu kodla birlikte ilgili kargo şubesine teslim etmeniz yeterlidir. Kargo ücretlendirme detayları satıcı panelinizde şeffaf bir şekilde yer alır."
              />
            </div>
          </section>
        </div>

        {/* Contact Banner */}
        <div className="mt-16 bg-orange-50 rounded-2xl p-8 text-center border border-orange-100">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Aradığınız cevabı bulamadınız mı?</h3>
          <p className="text-gray-600 mb-6">Müşteri hizmetleri ekibimiz size yardımcı olmaktan memnuniyet duyacaktır.</p>
          <a href="mailto:destek@filamengo.com" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm hover:shadow">
            Bizimle İletişime Geçin
          </a>
        </div>
      </div>
    </div>
  );
}
