import type { BlogPost } from "@/features/blog/types";

/**
 * Yapay zeka / LLM / chatbotlarin e-ticaretteki onemi.
 * Yayin tarihi: son 30 gun icinde rastgele secilmistir.
 */
export const aiEcommercePost: BlogPost = {
    slug: "yapay-zeka-llm-ve-chatbotlarin-e-ticaretteki-onemi",
    title: "Yapay Zekâ, LLM ve Chatbotların E-Ticaretteki Önemi",
    excerpt:
        "LLM tabanlı chatbotlar ve yapay zekâ destekli öneriler e-ticareti nasıl dönüştürüyor? Satış, dönüşüm ve müşteri deneyimine etkisi verilerle bu yazıda.",
    category: "Yapay Zekâ",
    date: "2026-10-27",
    keywords: [
        "yapay zeka e-ticaret",
        "LLM",
        "chatbot",
        "yapay zeka chatbot",
        "e-ticaret otomasyonu",
        "kişiselleştirme",
        "öneri motoru",
        "agentic commerce",
        "müşteri deneyimi",
    ],
    readingMinutes: 8,
    takeaways: [
        "E-ticaret işletmecilerinin yaklaşık %75'i artık yapay zekâ araçları kullanıyor; kurumsal tarafta bu oran %88'e ulaştı.",
        "LLM tabanlı chatbotlar, kural tabanlı eski botların aksine doğal dili anlar, niyeti kavrar ve satışa dönüştürebilir.",
        "Yapay zekâ destekli akıllı ürün önerileri geliri üç katına, dönüşüm oranını iki katına çıkarabiliyor.",
        "Başlangıç için en düşük riskli adım: SSS destekli destek chatbotu + insan onaylı ürün metinleri.",
    ],
    blocks: [
        {
            type: "paragraph",
            text: "E-ticaretin en eski kuralı değişmedi: doğru ürünü, doğru kişiye, doğru anda göstermek. Değişen şey, bu eşleştirmeyi kimin yaptığıdır. Son üç yılda büyük dil modellerinin (LLM) ve chatbotların hızla olgunlaşması, artık bu eşleştirmenin önemli bir bölümünü makinelerin üstlendiği bir döneme geçtiğimizi gösteriyor.",
        },
        {
            type: "heading2",
            text: "Yapay zekâ artık 'güzel bir ekstra' değil, temel altyapı",
        },
        {
            type: "paragraph",
            text: "Shopify'ın güncel araştırmasına göre e-ticaret işletmecilerinin dörtte üçü yapay zekâ araçlarını iş akışlarına dahil etti. Kurumsal ölçekte tablo daha da net: McKinsey'nin derlemesine göre kuruluşların %88'i en az bir iş fonksiyonunda yapay zekâ kullanıyor — bir yıl önce bu oran %78'ydi. Kısacası tartışma 'yapay zekâ kullanmalı mıyız' aşamasını çoktan geçti; soru artık hangi kullanım senaryolarının önce devreye alınacağı.",
        },
        {
            type: "paragraph",
            text: "Finansal etki de soyut bir vaat değil. Shopify'ın derlediği veriler, yapay zekâ destekli akıllı ürün önerilerinin geliri üçe katlayabildiğini, dönüşüm oranlarını iki katından fazla artırabildiğini ve sepet tutarını yarıya yakın oranda büyütebildiğini gösteriyor. Küçük bir mağaza için bu, ilk yapay zekâ yatırımının kendi kendini ödemesi demek.",
        },
        {
            type: "heading2",
            text: "LLM ile klasik chatbot farkı nedir?",
        },
        {
            type: "paragraph",
            text: "Eski nesil chatbotlar, belirlediğiniz anahtar kelimelere ve akış şemalarına bağlıydı: müşteri soruyu birebir yazmazsa bot yolu kaybeder, müşteri de 'insanla görüşmek istiyorum' düğmesini arar dururdu. Büyük dil modelleri ise metni kelime kelime değil, anlam düzeyinde işler. Sonuç:",
        },
        {
            type: "bulletList",
            items: [
                "Doğal dil anlama: 'Bu telekon takılırsa iadem var mı?' sorusunu 'iade politikası' niyetiyle eşleştirir.",
                "Çok dillilik: Aynı model Türkçe, İngilizce ve diğer dillerde yanıt üretir; ayrı bir 'Türkçe bot' bakımı gerekmez.",
                "Bağlam koruma: Sohbet boyunca önceki mesajları, ürün seçimlerini ve sepetteki durumu dikkate alır.",
                "Yaratıcı görevler: Ürün açıklaması, kampanya metni ve e-posta taslakları gibi içerik işlerini de üstlenebilir.",
            ],
        },
        {
            type: "paragraph",
            text: "Kısacası LLM, chatbotu 'kumandalı araba' hissinden çıkarıp gerçek bir dijital mağaza çalışanına dönüştürüyor. Ancak bu çalışanin da talimatları, sınırları ve denetimi sizde kalır — yazının ilerleyen bölümlerindeki dikkat edilmesi gerekenler bölümünde bu noktayı açıyoruz.",
        },
        {
            type: "heading2",
            text: "E-ticarette yapay zekânın 7 kritik kullanım alanı",
        },
        {
            type: "heading3",
            text: "1. Müşteri desteği chatbotları",
        },
        {
            type: "paragraph",
            text: "Kargo nerede, iade nasıl yapılır, beden hangisi olmalı? Bu soruların büyük bölümü tekrar eden kalıplardır. LLM tabanlı bir destek botu bu soruları 7/24, bekleme süresi olmadan yanıtlayarak hem destek maliyetini düşürür hem de müşterinin satın almadan vazgeçmesini önler. Önemli bir bağlam: Baymard Institute'un 2026 verilerine göre ortalama e-ticaret sepet terk oranı %70,22 seviyesinde. İyi çalışan bir destek kanalı, 'cevap alamadığım için vazgeçtim' segmentini doğrudan bu orandan koparır.",
        },
        {
            type: "heading3",
            text: "2. Kişiselleştirme ve öneri motorları",
        },
        {
            type: "paragraph",
            text: "Gezinme geçmişi, sepet içeriği ve benzer müşterilerin davranışını yorumlayarak ürettiği öneriler, e-ticarete dönüşen yapay zekânın en olgun alanıdır. Yukarıda aktarılan veri seti, akıllı önerilerin geliri üçe katlayabildiğini söylüyor. LLM'in katkısı, bu önerilerin sadece 'benzer ürünler' değil 'bu kombinle uyumlu' düzeyinde açıklanabilir olmasında.",
        },
        {
            type: "heading3",
            text: "3. İçerik üretimi ve ürün metinleri",
        },
        {
            type: "paragraph",
            text: "Yüzlerce ürünün açıklamasını elle yazmak küçük işletmeler için imkânsızdır. LLM'ler ürün özellik tablosundan marka sesine uygun, SEO uyumlu açıklamalar üretebilir. Kritik nokta: üretilen metni yayına almadan önce insan gözünden geçirmek. Modelin fiziksel özellikleri yanlış aktarma riski (halüsinasyon) özellikle teknik ürünlerde gerçektir.",
        },
        {
            type: "heading3",
            text: "4. Semantik arama",
        },
        {
            type: "paragraph",
            text: "'Kahve kurutmak için toplu hediye' gibi bir arama, klasik anahtar kelime eşleştirmesiyle boş sonuç döndürür; anlama dayalı (semantik) arama ise 'hediye seti' ve 'kahve ekipmanları' kategorilerine yönlendirir. Site içi arama, e-ticarette dönüşümün en yüksek kanallarından biridir ve LLM tabanlı arama bu kanalın isabet oranını belirgin biçimde yükseltir.",
        },
        {
            type: "heading3",
            text: "5. Dinamik fiyatlandırma ve kampanya optimizasyonu",
        },
        {
            type: "paragraph",
            text: "Yapay zekâ; rekabet fiyatlarını, stok durumunu ve talep eğilimini birlikte değerlendirerek indirim bütçesinin nereye harcanacağını öngörür. Küçük pazar yerlerinde bile 'hangi üründe hangi kampanya' kararını veriye dayandırmak, marjı korumanın en pratik yollarından biridir.",
        },
        {
            type: "heading3",
            text: "6. Stok ve talep tahmini",
        },
        {
            type: "paragraph",
            text: "Sezonluk dalgalanma yaşayan ürünlerde talep tahmini, 'eskişen para' (eriyen stok) ile 'biten ürün' (kaybeden satış) ikilemini yumuşatır. Model; mevsimsellik, kampanya takvimi ve geçmiş satışları birlikte okuyarak sipariş noktalarını önerir.",
        },
        {
            type: "heading3",
            text: "7. Agentic commerce: alışverişi yapan ajanlar",
        },
        {
            type: "paragraph",
            text: "Shopify'ın 2026 değerlendirmesindeki en büyük kayma, 'agentic commerce' olarak adlandırılan alan: ürün keşfini, fiyat karşılaştırmasını ve hatta sipariş sürecini kullanıcı adına yürüten yapay zekâ ajanları. Satıcı tarafında bu, ürün verilerinin makinalar tarafından okunabilir (yapılandırılmış, API erişilebilir, doğru ve güncel) olmasının bir kez daha kritikleştiği anlamına gelir. Kimin katalog verisi temizse, ajanlar ürününü o öne çıkarır.",
        },
        {
            type: "heading2",
            text: "Sayılarla: yapay zekânın sepete etkisi",
        },
        {
            type: "bulletList",
            items: [
                "%75 — e-ticaret işletmecileri yapay zekâ araçları kullanıyor (Shopify Merchant Survey).",
                "%88 — kuruluşların en az bir fonksiyonda yapay zekâ benimseme oranı; bir yıl önce %78 (McKinsey, Shopify üzerinden).",
                "3 katı — yapay zekâ destekli akıllı önerilerin üretebildiği gelir artışı.",
                "2 katından fazla — dönüşüm oranı artışı; sepet tutarında yarıya yakın yükseliş.",
                "%70,22 — ortalama sepet terk oranı; destek ve kişiselleştirme bu oranla savaşın en önemli iki silahı.",
                "~260 milyar dolar — yalnızca daha iyi sepet/checkout tasarımıyla kurtarılabilecek büyüklük (Baymard).",
            ],
        },
        {
            type: "callout",
            text: "Yapay zekânın sepete etkisi tek bir kanaldan gelmez: destek botu terk eden müşteriyi geri çevirir, öneri motoru sepeti büyütür, semantik arama doğru ürünü buldurur. Üçünü birlikte çalıştırmak, tekil etkinin çarpımını verir.",
        },
        {
            type: "heading2",
            text: "Küçük bir e-ticaret işletmesi nasıl başlamalı?",
        },
        {
            type: "numberedList",
            items: [
                "Tekrar eden destek sorularını listeleyin ve bir LLM chatbot'a SSS havuzu olarak verin; ilk hafta sadece cevaplasın, satış önermesin.",
                "En çok görüntülenen 20 ürününüz için yapay zekâ taslağı + insan onayı ile açıklamaları yenileyin; A/B testiyle eski metinlerle karşılaştırın.",
                "Ürün detay sayfasına 'benzer ürünler' ve 'bunu alanlar şunları da aldı' öneri modülünü ekleyin.",
                "Veri hijyenine girin: doğru fiyat, doğru stok, doğru kategori. Yapay zekâ, dağınık veriye 'dağınık' yanıt verir.",
                "Ölçümleme kurun: Google Analytics 4'te chatbot etkileşimi ve öneri tıklamaları için özel eventler tanımlayın; etkiyi ciro ile ilişkilendirin.",
            ],
        },
        {
            type: "heading2",
            text: "Dikkat edilmesi gerekenler",
        },
        {
            type: "bulletList",
            items: [
                "Halüsinasyon: Model, olmayan bir özelliği 'kesin' dille verebilir. Fiyat, stok ve garanti bilgileri her zaman gerçek sistemden (API) doğrulanmalı.",
                "İnsan devri: Bot, ilk denemede çözemediği konuşmayı açık bir 'insanla devam et' seçeneğiyle teslim etmeli. Kapalı devre bot, müşteriyi rakibe taşır.",
                "Veri gizliliği: Chatbot'a aktarılan mesajlar kişisel veri sayılır. KVKK ve benzeri mevzuat uyarınca toplama amaçları şeffaf ilan edilmeli, gerekmedikçe veri toplanmamalı.",
                "Marka sesi: LLM çıktılarına marka dilinizi anlatan bir sistem talimatı eklemek, tek tip 'robot metni' hissini engeller.",
            ],
        },
        {
            type: "heading2",
            text: "Sıkça sorulan sorular",
        },
    ],
    faqs: [
        {
            question: "LLM chatbot kurmak küçük bir e-ticaret sitesi için pahalı mı?",
            answer:
                "Günümüzde hazır e-ticaret platformlarının çoğu, yapay zekâ destekli chatbotu eklenti olarak sunuyor. Aylık sabit ücretli modellerle başlamak, kendi altyapınızı kurmaktan çok daha düşük maliyetli bir başlangıçtır. Kritik olan maliyet değil, botun hangi soruları yanıtlayacağını net sınırlandırmaktır.",
        },
        {
            question: "Chatbot müşteri desteğinin tamamını devralmalı mı?",
            answer:
                "Hayır. Tekrar eden basit sorular (kargo, iade, beden) bot için idealdir; şikâyet, hukuki konular ve yüksek tutarlı siparişlerde insan devri kaçınılmazdır. Hedef, destek ekibini 'ilk yanıt' yükünden kurtarıp zor vakalara odaklamaktır.",
        },
        {
            question: "Yapay zekâ destekli öneri motoru satışları gerçekten artırır mı?",
            answer:
                "Sektör verileri bu yönde güçlü sinyal veriyor: Shopify'ın derlediği araştırmalar, akıllı önerilerin geliri üç katına çıkarabildiğini ve dönüşümü iki katından fazla artırabildiğini gösteriyor. Elbette etki, veri kalitesi ve doğru konumlandırmaya bağlıdır; boş bir öneri modülü değil, gerçek alışveriş davranışıyla beslenen bir sistem gerekir.",
        },
        {
            question: "Yapay zekâ kullanırken KVKK'ya uygunluğu nasıl sağlarım?",
            answer:
                "Önce veri envanteri çıkarın: chatbot hangi kişisel veriyi topluyor, nerede saklanıyor, ne kadar süre tutuluyor? Aydınlatma metninizi güncelleyin, gereksiz veri toplamayı kapatin ve üçüncü taraf modellerle veri paylaşımını sözleşmeyle sınırlayın. Şüphe olduğunda en güvenli yol, botu kişisel veri toplamayacak şekilde kurgulamaktır.",
        },
    ],
    sources: [
        {
            label: "AI in Ecommerce: 7 Key Use Cases for 2026",
            publisher: "Shopify",
            url: "https://www.shopify.com/blog/ai-in-ecommerce",
        },
        {
            label: "McKinsey State of AI (Shopify üzerinden aktarılan %88 benimseme verisi)",
            publisher: "McKinsey & Company",
            url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
        },
        {
            label: "Cart Abandonment Rate: 50 Statistics (2026)",
            publisher: "Baymard Institute",
            url: "https://baymard.com/lists/cart-abandonment-rate",
        },
        {
            label: "Gartner Predicts Search Engine Volume Will Drop 25 Percent by 2026",
            publisher: "Gartner",
            url: "https://www.gartner.com/en/newsroom/press-releases/pr-20250217-gartner-predicts-search-engine-traffic-will-drop-by-25-by-2026",
        },
    ],
};
