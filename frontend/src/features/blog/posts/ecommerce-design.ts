import type { BlogPost } from "@/features/blog/types";

/**
 * E-ticaret sitesi tasarimi: teknolojiler ve sektor standartlari.
 * Yayin tarihi: son 30 gun icinde rastgele secilmistir.
 */
export const ecommerceDesignPost: BlogPost = {
    slug: "e-ticaret-sitesi-tasarimi-rehberi",
    title: "E-Ticaret Sitesi Tasarımı Rehberi: Teknolojiler ve Standartlar",
    excerpt:
        "E-ticaret sitesi tasarlamak için bilmeniz gereken her şey: teknoloji yığını, Core Web Vitals, WCAG 2.2 erişilebilirlik, güvenlik ve SEO standartları.",
    category: "Tasarım & Teknoloji",
    date: "2026-11-05",
    keywords: [
        "e-ticaret sitesi tasarımı",
        "e-ticaret web tasarım",
        "Core Web Vitals",
        "WCAG 2.2",
        "erişilebilirlik",
        "Next.js e-ticaret",
        "headless commerce",
        "PCI DSS",
        "e-ticaret SEO",
        "checkout tasarımı",
    ],
    readingMinutes: 10,
    takeaways: [
        "Ortalama e-ticaret sepet terk oranı %70,22; yalnızca daha iyi sepet/checkout tasarımıyla ~260 milyar dolar kurtarılabilir.",
        "Core Web Vitals hedefleri: LCP 2,5 sn'nin altında, INP 200 ms'nin altında, CLS 0,1'in altında (kullanıcı ziyaretlerinin %75'i için).",
        "WCAG 2.2, erişilebilirliğin güncel uluslararası standardıdır; AB'de Avrupa Erişilebilirlik Yasası ile zorunlu hale geldi.",
        "Teknoloji seçiminde kural: satış kanalınızı ve büyüme planınızı belirleyin; her senaryoda en iyi site, en karmaşık site değil en net olanıdır.",
    ],
    blocks: [
        {
            type: "paragraph",
            text: "E-ticaret sitesi tasarımı, vitrin düzenleme sanatı değildir; dönüşüm mühendisliğidir. Aynı ürünü satan iki siteden fazlasını iyi 'hissettiren' değil, ölçülebilir biçimde daha az sürtünme üreten kazanır. Bu yazıda bir e-ticaret sitesi tasarlamadan önce bilmeniz gereken UX temellerini, teknoloji seçeneklerini ve sektörün bugün beklediği performans-erişilebilirlik-güvenlik standartlarını tek tek ele alıyoruz.",
        },
        {
            type: "heading2",
            text: "Neden tasarım doğrudan ciro?",
        },
        {
            type: "paragraph",
            text: "Baymard Institute, 344 önde gelen e-ticaret sitesini kapsayan benchmark'ını 200.000 saati aşan UX araştırmasına ve 700'ü aşkın kılavuza dayandırıyor. Bu araştırmanın en bilinen çıktısı çarpıcı: ortalama sepet terk oranı %70,22. Yani her on alışveriş niyetinden yedisi, sepete ekledikten sonra satın almadan terk ediyor. Baymard'ın tahminine göre yalnızca daha iyi sepet ve checkout tasarımıyla kurtarılabilecek işlem hacmi, ABD'de yaklaşık 260 milyar dolar. Tasarım, 'görsel tatmin' değil; bu kaybı geri kazanan bir gelir kanalıdır.",
        },
        {
            type: "heading2",
            text: "Kullanıcı deneyimi (UX) temelleri",
        },
        {
            type: "heading3",
            text: "Ürün sayfası: karar anının merkezi",
        },
        {
            type: "bulletList",
            items: [
                "Ürünü gerçek ölçekli, beyaz arka planlı ve kullanım içinde gösteren en az üç fotoğraf; mümkünse video.",
                "Fiyat, stok durumu ve teslim süresi ilk ekranda; fiyat gizlemesi veya 'sepete ekle sonrası gör' taktiği güven kaybettirir.",
                "Tek ve net birincil eylem (CTA): 'Sepete Ekle'. İkincil aksiyonlar görsel olarak zayıflatılmış olmalı.",
                "Beden/ölçü belirsizliği varsa beden tablosu ve 'hangi bedeni seçmeliyim' yardımı aynı alanda.",
            ],
        },
        {
            type: "heading3",
            text: "Arama ve kategori deneyimi",
        },
        {
            type: "paragraph",
            text: "Site içi arama, ziyaretçinin satın almaya en yakın olduğu andır. Öneriler yazım toleransı içermeli, boş sonuç yerine 'şunları mı demek istediniz?' demeli. Kategori sayfalarında filtreleme (fiyat, marka, özellik) sıralama kadar önemlidir; filtre sonucunda kalan ürün sayısını göstermek, kullanıcıyı boş sayfa sürprizinden korur.",
        },
        {
            type: "heading3",
            text: "Sepet ve checkout: sürtünmeyi azalt",
        },
        {
            type: "paragraph",
            text: "Checkout, e-ticaretteki en pahalı sayfadir: her ek alan, her ek adım bir kullanıcıyı daha kaybettirir. Misafir alışverişini zorunlu üyelikten önce sunmak, formda yalnızca sipariş için gerçekten gereken alanları tutmak, toplam tutarı her adımda göstermek ve ilerleme göstergesi eklemek, Baymard'ın kılavuzlarında en çok önerilen, ölçülmüş iyileştirmeler arasındadır.",
        },
        {
            type: "heading3",
            text: "Mobil öncelik",
        },
        {
            type: "paragraph",
            text: "E-ticaret trafiğinin büyük bölümü mobil cihazlardan gelir. Bu, masaüstü tasarımın küçültülmüş bir kopyası değil, el ile dokunmayı varsayılan alıp ekranı ona göre kurgulayan bir deneyim demektir: parmak boyutunda dokunma alanları, üst kısımda arama, tek kolonlu akış ve klavye dostu form alanları (e-posta için e-posta klavyesi, telefon için rakam klavyesi).",
        },
        {
            type: "heading2",
            text: "Teknoloji seçimi: hangi araç, ne zaman?",
        },
        {
            type: "heading3",
            text: "Frontend: Next.js (React) ve sunucu tarafı render",
        },
        {
            type: "paragraph",
            text: "Arama motorlarında görünürlüğün temeli, sayfalarınızın hızlı ve eksiksiz HTML ile sunulmasıdır. Next.js gibi React çerçeveleri üç render modu sunar: SSG (derlemede statik üretim — ürün ve içerik sayfaları için ideal), SSR (istek anında üretim — kişiselleştirilmiş sayfalar için) ve ISR/hibrit yaklaşımlar (belirli aralıklarla yenilenen statik sayfalar). Bir e-ticaret sitesinin blog, kategori ve ürün sayfalarını statik/hibrit üretmesi, hem Core Web Vitals hem SEO açısından bugünkü sektör standardıdır.",
        },
        {
            type: "heading3",
            text: "Headless commerce ve API-first yaklaşım",
        },
        {
            type: "paragraph",
            text: "Headless mimaride ürün verisi, sepet ve sipariş işlemleri arka planda bir API üzerinden servis edilir; arayüz ise tamamen bağımsız gelişir. Faydası: aynı katalog, web sitesi, mobil uygulama ve sosyal medya vitrinlerine tek kaynaktan servis edilebilir. Maliyeti ise iki katmanlı bakım sorumluluğudur. Gün başı sipariş sayısı düşükken hazır platform + tema yeterlidir; çok kanallı satışta headless değer üretmeye başlar.",
        },
        {
            type: "heading3",
            text: "Ödeme altyapısı ve güvenlik",
        },
        {
            type: "paragraph",
            text: "Kart verisi işleyen her sistem PCI DSS standartlarına uymak zorundadır; pratikte en güvenli yol, kart verisini kendi sunucunuzdan geçirmeden ödeme sağlayıcınızın güvenli sayfasına/arayüzüne yönlendirmektir. Türkiye'de 3D Secure, kart sahibi doğrulaması için fiilen standarttır. Tek tıkla ödeme ve kayıtlı adres, dönüşümü yükselten — doğru tokenizasyon ile güvenle sunulabilen — tamamlayıcılardır.",
        },
        {
            type: "heading3",
            text: "Veri ve ölçümleme",
        },
        {
            type: "paragraph",
            text: "Kararlar ölçümden doğmalı. Google Analytics 4, tüm sayfalarda tutarlı event yapısıyla kurulmalı; 'sepete ekle', 'checkout başlangıcı' ve 'satın alma' gibi dönüşüm adımları event olarak tanımlanmalı. Google Search Console ise arama görünümünüzü ve teknik SEO sorunlarını ücretsiz izlemenin standart yoludur.",
        },
        {
            type: "heading2",
            text: "Performans standartları: Core Web Vitals",
        },
        {
            type: "paragraph",
            text: "Google, kullanıcı deneyimini üç ölçülebilir metriğe indirgedi ve bu metrikleri arama sıralamasında kalite sinyali olarak kullanıyor. web.dev'deki güncel tanımlara göre hedef değerler, kullanıcı ziyaretlerinin %75'i için şunlar:",
        },
        {
            type: "bulletList",
            items: [
                "LCP (Largest Contentful Paint): sayfanın ana görselinin/blokunun yüklenmesi 2,5 saniyenin altında olmalı.",
                "INP (Interaction to Next Paint): tıklama ve dokunmalara verilen görsel yanıt 200 milisaniyenin altında olmalı. (INP, Mart 2024'te FID'nin yerine geçti.)",
                "CLS (Cumulative Layout Shift): sayfa yüklenirken içerik zıplaması 0,1 değerinin altında kalmalı.",
            ],
        },
        {
            type: "paragraph",
            text: "E-ticaret için pratik karşılığı: ürün fotoğraflarını modern formatlarda (WebP/AVIF) sunmak, reklam/kampanya bantları için sayfada yer ayırmak (CLS'yi önler), üçüncü taraf izleme betiklerini gecikmeli yüklemek ve sunucu yanıt süresini önbellekleme ile kısa tutmaktır.",
        },
        {
            type: "heading2",
            text: "Erişilebilirlik: WCAG 2.2 standardı",
        },
        {
            type: "paragraph",
            text: "Web İçeriği Erişilebilirlik Yönergeleri (WCAG) 2.2, W3C tarafından yayınlanan ve webi herkes için kullanılabilir kılan uluslararası standarttır. Dört temel ilke üzerine kuruludur (POUR): algılanabilir, kullanılabilir, anlaşılabilir ve sağlam (teknolojilerle uyumlu). 13 yönergesi ve A, AA, AAA olmak üzere üç uyum düzeyi vardır; sektör pratiğinde AA düzeyi hedeflenir. WCAG 2.2 ayrıca ISO/IEC 40500:2025 standardı olarak da yayımlandı.",
        },
        {
            type: "paragraph",
            text: "Avrupa pazarına satanlar için süreç artık mevzuat konusu: Avrupa Erişilebilirlik Yasası (EAA), e-ticaret dahil birçok dijital hizmette erişilebilirlik gereksinimlerini zorunlu hale getirdi ve Avrupa standardı EN 301 549'un 2026 sürümü WCAG 2.2'yi referans alıyor. Erişilebilirlik ayrıca SEO ile örtüşür: doğru başlık hiyerarşisi, açık bağlantı metinleri ve alternatif metinler hem ekran okuyuculara hem arama motorlarına aynı faydayı sağlar.",
        },
        {
            type: "callout",
            text: "Pratik erişilebilirlik kısa listesi: her görsel için anlamlı alt metin, klavye ile gezilebilir sepet/checkout, form hatalarının metinle bildirilmesi, yalnızca renkle bilgi vermeme ve odak halinin görünür olması.",
        },
        {
            type: "heading2",
            text: "Güven ve mevzuat",
        },
        {
            type: "bulletList",
            items: [
                "HTTPS/TLS her sayfada zorunludur; karışık içerik (http kaynak) tarayıcı uyarılarına ve SEO kaybına yol açar.",
                "KVKK (6698 sayılı kanun): kişisel veri işleme amaçları şeffaf olmalı, çerez/anlık izleme için açık rıza akışı kurulmalı.",
                "İade, değişim ve teslim koşulları satın almadan önce erişilebilir olmalı; belirsizlik, terk oranının en sessiz sebeplerinden biridir.",
                "Fiyat ve stok bilgisi gerçek zamanlı tek kaynaktan servis edilmeli; 'sepette fiyat değişti' sürprizi güveni zedeler.",
            ],
        },
        {
            type: "heading2",
            text: "Teknik SEO temeli",
        },
        {
            type: "numberedList",
            items: [
                "Anlamsal HTML: her sayfada tek H1, alt başlıkların hiyerarşik düzeni, liste ve tablolarda doğru etiketler.",
                "Yapılandırılmış veri (schema.org): ürün, fiyat, stok ve yorum bilgileri için Product JSON-LD; arama motorlarına zengin sonuç şansı verir.",
                "Canonical URL: filtre/sıralama parametrelerinin ürettiği kopya sayfaları tek adrese indirger.",
                "Sitemap.xml ve robots.txt: ürün ve içerik sayfalarının keşfini hızlandırır.",
                "Sayfa başlığı + meta açıklama: her ürün ve kategori için benzersiz, anahtar kelimeyi başta içeren metinler.",
                "Hız: Core Web Vitals hedefleri, hem kullanıcı hem arama motoru açısından SEO'nun teknik omurgasıdır.",
            ],
        },
        {
            type: "heading2",
            text: "Yayına almadan önce kontrol listesi",
        },
        {
            type: "bulletList",
            items: [
                "Checkout'u misafir alışverişiyle, mümkün olan en az form alanıyla test edin (mobilde de).",
                "Core Web Vitals'ı gerçek kullanıcı verisiyle (CrUX/PageSpeed Insights) doğrulayın.",
                "Erişilebilirlik denetimi: klavye ile baştan sona sipariş vermeyi deneyin; otomatik araçlarla kontrast ve alt metin taraması yapın.",
                "Yapılandırılmış veriyi Google'ın Zengin Sonuç Testi ile doğrulayın.",
                "GA4 eventlerinin (sepete ekle, satın alma) test ortamında doğru tetiklendiğini doğrulayın.",
                "Yedekleme ve geri yükleme senaryosunu en az bir kez prova edin.",
            ],
        },
        {
            type: "heading2",
            text: "Sıkça sorulan sorular",
        },
    ],
    faqs: [
        {
            question: "Hazır e-ticaret platformu mu, özel geliştirme mi seçmeliyim?",
            answer:
                "Erken aşamada, hazır platform + özelleştirilmiş tema zaman ve maliyeti ciddi biçimde düşürür; satış modeliniz çok kanallı büyüdüğünde headless mimariye geçmek mantıklı hale gelir. Karar kriteri ürün sayısı, entegrasyon ihtiyacı ve ekip kapasitesidir; 'en yeni teknoloji' değil 'işinize uyan en sade teknoloji' doğrudur.",
        },
        {
            question: "Core Web Vitals hedeflerine ulaşamazsam SEO'm düşer mi?",
            answer:
                "Core Web Vitals, Google'ın kullanıcı deneyimi sinyallerinden biridir; içerik kalitesi ve arama niyetiyle eşleşme hâlâ sıralamanın temelidir. Ancak iki benzer sayfadan hızlı ve sorunsuz olanı önce gösterilir. Üstelik vitallerin en büyük etkisi SEO'dan önce dönüşümdedir: yavaş sayfa, reklam bütçenizi de israf ettirir.",
        },
        {
            question: "WCAG 2.2 uyumu zorunlu mu, hangi düzeyi hedeflemeliyim?",
            answer:
                "WCAG 2.2 bir uluslararası standarttır (ISO/IEC 40500:2025) ve uygulanması ülkenize göre farklı mevzuatla zorunlu hale gelebilir; AB'de Avrupa Erişilebilirlik Yasası bu alandaki en belirleyici düzenlemedir. Pratikte hedef AA uyum düzeyidir ve çoğu iyileştirme (alt metin, kontrast, klavye erişimi) küçük ama planlı adımlarla yapılabilir.",
        },
        {
            question: "Ödemeleri kendi sunucumda tutabilir miyim?",
            answer:
                "Teknik olarak mümkündür ancak PCI DSS uyumluluğunun tüm yükünü alırsınız; kart verisi saklama, denetim ve güvenlik sorumluluğu ciddi bir yatırım gerektirir. Sektör pratiği, kart verisini kendi sunucunuzdan geçirmeyen bir ödeme sağlayıcısı/3D Secure akışı kullanmaktır.",
        },
    ],
    sources: [
        {
            label: "Cart Abandonment Rate: 50 Statistics (2026)",
            publisher: "Baymard Institute",
            url: "https://baymard.com/lists/cart-abandonment-rate",
        },
        {
            label: "Web Vitals (Core Web Vitals metrikleri ve eşikleri)",
            publisher: "web.dev / Google",
            url: "https://web.dev/articles/vitals",
        },
        {
            label: "WCAG 2 Overview (WCAG 2.2, POUR, A/AA/AAA, ISO/IEC 40500)",
            publisher: "W3C Web Accessibility Initiative",
            url: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        },
        {
            label: "EN 301 549 - Accessibility requirements for ICT (2026 sürümü WCAG 2.2 referanslı)",
            publisher: "ETSI / European Commission",
            url: "https://www.etsi.org/deliver/etsi_en/301500_301599/301549/",
        },
    ],
};
