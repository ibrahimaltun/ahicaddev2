"""Vitrin/demo verisi: kategoriler + sahte (ornek) urunler.

Bos veritabanini gercekci Turkce urunlerle doldurur:
- Kategoriler slug'a gore idempotent eklenir (mevcutlari korur).
- Urunler slug'a gore idempotent eklenir (varsa atlanir, uzerine yazmaz).
- Butun demo urunler: is_sample=True (vitrinde "Ornek Urun" rozeti),
  stock=0 (kullanici talebi: "Tukendi" olarak isaretli, satin alinamaz),
  status='approved', is_active=True.
- Gorseller frontend/public/demo/*.svg (offline, yerel).

Calistirma (kok dizinden veya backend dizininden):
    backend/.venv/bin/python backend/scripts/seed_demo.py
"""

from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal  # noqa: E402
from app.models.category import Category  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.product_image import ProductImage  # noqa: E402
from app.services.search_text import build_search_text  # noqa: E402

# ---------------------------------------------------------------------------
# Ornek kategoriler (urun girisi formu bu listeyi /categories uzerinden alir)
# ---------------------------------------------------------------------------
CATEGORIES: list[tuple[str, str]] = [
    ("El Sanatları", "el-sanatlari"),
    ("Yöresel Gıda", "yoresel-gida"),
    ("Tekstil & Dokuma", "tekstil-dokuma"),
    ("Doğal Kozmetik", "dogal-kozmetik"),
    ("Takı & Aksesuar", "taki-aksesuar"),
    ("Ev & Yaşam", "ev-yasam"),
]

# (slug, ad, kategori-slug, fiyat, kisa aciklama, gorsel)
PRODUCTS: list[tuple[str, str, str, str, str, str]] = [
    (
        "el-yapimi-cini-tabak",
        "El Yapımı İznik Desenli Çini Tabak",
        "el-sanatlari",
        "1850.00",
        "Kütahya'da geleneksel usulle şekillendirilen, el işçiliğiyle sır "
        "kaplanmış çini tabak. Duvar süslemesi ve özel gün hediyeleri için "
        "uygundur.",
        "/demo/el-yapimi-cini-tabak.svg",
    ),
    (
        "ahsap-oyma-sandik",
        "Ağaç Oyma El İşi Sandık",
        "el-sanatlari",
        "2750.00",
        "Kuru meyve ağacından elde oynarak işlenmiş, içi bezemeli küçük "
        "sandık. Kapak menteşeleri dövme pirinçtir, yüzeyi doğal vernikle "
        "korunmuştur.",
        "/demo/ahsap-oyma-sandik.svg",
    ),
    (
        "bakir-cezve-ince-isleme",
        "Dövme Bakır Cezve",
        "el-sanatlari",
        "940.00",
        "Gaziantep usulü dövme bakırdan, ince işçilikli cezve. İç yüzeyi "
        "kalaylanmıştır; kahve telvesini yakmadan yavaş pişirir.",
        "/demo/bakir-cezve-ince-isleme.svg",
    ),
    (
        "comlek-kil-testi",
        "Çömlek Kil Testi",
        "el-sanatlari",
        "620.00",
        "Çanakkale çamurundan çarkta şekillendirilip odun ateşinde pişirilen "
        "kil testi. Suyu serin tutar, yüzeyi kurşunsuz sırlıdır.",
        "/demo/comlek-kil-testi.svg",
    ),
    (
        "seramik-vazo",
        "Sırlı Seramik Vazo",
        "ev-yasam",
        "1180.00",
        "Elle boyanmış, mat sır kaplı seramik vazo. Kuru çiçek ve tek dal "
        "düzenlemeleri için dengeli boyutta tasarlandı.",
        "/demo/seramik-vazo.svg",
    ),
    (
        "hasir-sepet",
        "Hasır El Örgüsü Sepet",
        "ev-yasam",
        "430.00",
        "Doğal söğüt dallarından elde örülmüş hasır sepet. Mutfak "
        "düzünlemesinde meyve, ekmek ve çamaşır düzenlemesinde kullanılır.",
        "/demo/hasir-sepet.svg",
    ),
    (
        "organik-suzme-bal",
        "Organik Süzme Çiçek Balı",
        "yoresel-gida",
        "780.00",
        "Yayla çiçeklerinden toplanan, hiç ısıtılmadan süzülmüş organik "
        "çiçek balı. 850 gram cam kavanozda, damakta karamelize notalarla.",
        "/demo/organik-suzme-bal.svg",
    ),
    (
        "karadeniz-tereyagi",
        "Karadeniz Sadeyağ Tereyağı",
        "yoresel-gida",
        "690.00",
        "Yayla sütünden köy tereyağı üretimiyle elde edilen, taşımada "
        "hakkını veren sadeyağ. Kahvaltı sofralarının vazgeçilmezi.",
        "/demo/karadeniz-tereyagi.svg",
    ),
    (
        "gun-kurumu-domates",
        "Güneş Kurusu Domates (1 kg)",
        "yoresel-gida",
        "320.00",
        "Toros eteklerinde güneşte özenle kurutulmuş, kükürtsüz domates. "
        "Sıcak yemeklerde ve mezelerde yoğun aromasıyla fark yaratır.",
        "/demo/gun-kurumu-domates.svg",
    ),
    (
        "ceyizlik-ucet-sirca",
        "Çeyizlik Üzüm Sirkesi",
        "yoresel-gida",
        "260.00",
        "Katkısız üzüm mustundan, yıl boyunca dinlendirilerek üretilen "
        "hakiki üzüm sirkesi. Salata ve turşularda dengeli asiditesi ile.",
        "/demo/ceyizlik-ucet-sirca.svg",
    ),
    (
        "el-dokuma-usak-halisi",
        "El Dokuma Uşak Halısı",
        "tekstil-dokuma",
        "4200.00",
        "Uşak desenli, yün iplikten el dokuması halı. Bitkisel boyalı "
        "iplerle dokundu; 120x180 ölçüsünde, çeyizlik dayanıklılıkta.",
        "/demo/el-dokuma-usak-halisi.svg",
    ),
    (
        "anadolu-bufas-sali",
        "Anadolu Büfaş Şalı",
        "tekstil-dokuma",
        "860.00",
        "Geleneksel büfaş dokuma tekniğiyle üretilen, kenarları püsküllü "
        "şal. Yumuşak dokusuyla dört mevsim kullanılabilir.",
        "/demo/anadolu-bufas-sali.svg",
    ),
    (
        "kendine-ozgu-dokuma-sal",
        "El Dokuma Ketin Şal",
        "tekstil-dokuma",
        "540.00",
        "Tezgahta keten iplikle dokunmuş, doğal renkli şal. Yıkandıkça "
        "yumuşayan dokusuyla günlük kullanıma uygun.",
        "/demo/kendine-ozgu-dokuma-sal.svg",
    ),
    (
        "el-kecesi-duvar-panosu",
        "El Keçesi Duvar Panosu",
        "tekstil-dokuma",
        "670.00",
        "Yün yıkama-keçeleştirme tekniğiyle elde üretilen duvar panosu. "
        "Her pano tekil desenli, arkası askı halkalıdır.",
        "/demo/el-kecesi-duvar-panosu.svg",
    ),
    (
        "yoruk-el-dokuma-kilim",
        "Yörük El Dokuma Kilim",
        "tekstil-dokuma",
        "3150.00",
        "Yörük desenli, yüzyıllık motiflerle dokunmuş kilim. Doğal yün "
        "iplikle dokundu; zemin ve duvar kullanımına uygundur.",
        "/demo/dokuma-kilim.svg",
    ),
    (
        "defne-yagli-el-sabunu",
        "Defne Yağlı El Sabunu",
        "dogal-kozmetik",
        "95.00",
        "Zeytinyağı ve defne yağıyla soğuk yöntemde kaynatılmış geleneksel "
        "sabun. Hassas ciltlerde kreması gibi köpürür.",
        "/demo/defne-yagli-el-sabunu.svg",
    ),
    (
        "igde-cicegi-sabunu",
        "Iğde Çiçeği Sabunu",
        "dogal-kozmetik",
        "88.00",
        "Iğde çiçeği esansıyla parfümlendirilmiş, el yapımı sabun. "
        "Yaz aylarında ferahlık veren, kalıcı kokulu temizlik.",
        "/demo/igde-cicegi-sabunu.svg",
    ),
    (
        "lavanta-sabunu",
        "Isparta Lavanta Sabunu",
        "dogal-kozmetik",
        "92.00",
        "Isparta lavanta yağıyla üretilen, rahatlatıcı kokulu el yapımı "
        "sabun. Gardırop kokulandırmada da kullanılabilir.",
        "/demo/lavanta-sabunu.svg",
    ),
    (
        "gliserinli-yuz-sabunu",
        "Gliserinli Yüz Sabunu",
        "dogal-kozmetik",
        "110.00",
        "Yüksek gliserin içerikli, kuruluğu dengeleyen yüz sabunu. "
        "Sabun kalıplarında tek tek dökülüp ambalajlanır.",
        "/demo/gliserinli-sabun.svg",
    ),
    (
        "el-isi-gumus-kupe",
        "El İşi Gümüş Kupe",
        "taki-aksesuar",
        "1480.00",
        "925 ayar gümüşten filigran tekniğiyle işlenmiş kupe. Geleneksel "
        "motifleri günlük kullanımda taşıyabileceğiniz incelikte.",
        "/demo/el-isi-gumus-kupe.svg",
    ),
]


def slugify(name: str) -> str:
    tr_map = str.maketrans("ıİşŞğĞüÜöÖçÇ", "iIsSgGuUoOcC")
    text = name.translate(tr_map).lower()
    cleaned: list[str] = []
    for char in text:
        if char.isalnum():
            cleaned.append(char)
        else:
            cleaned.append("-")
    slug = "".join(cleaned)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def upsert_categories(db) -> dict[str, Category]:
    by_slug: dict[str, Category] = {
        category.slug: category
        for category in db.query(Category).filter(
            Category.slug.in_([slug for _, slug in CATEGORIES])
        )
    }

    for name, slug in CATEGORIES:
        category = by_slug.get(slug)
        if category is None:
            category = Category(name=name, slug=slug)
            db.add(category)
            db.flush()
            by_slug[slug] = category
            print(f"kategori eklendi: {name}")
        else:
            print(f"kategori zaten var: {name}")

    return by_slug


def upsert_products(db, categories: dict[str, Category]) -> None:
    added = 0
    skipped = 0

    for slug, name, category_slug, price, description, image_url in PRODUCTS:
        exists = (
            db.query(Product.id).filter(Product.slug == slug).first()
        )

        if exists is not None:
            skipped += 1
            print(f"urun zaten var, atlandi: {slug}")
            continue

        category = categories[category_slug]
        product = Product(
            name=name,
            slug=slug,
            description=description,
            price=Decimal(price),
            # Kullanici talebi: demo urunler "Tukendi" olarak isaretli.
            stock=0,
            is_sample=True,
            is_active=True,
            status=Product.STATUS_APPROVED,
            owner_user_id=None,
            submitted_at=None,
            category_id=category.id,
            search_text=build_search_text(
                name=name,
                description=description,
                category_name=category.name,
            ),
        )
        product.images.append(
            ProductImage(
                image_url=image_url,
                sort_order=0,
                is_primary=True,
            )
        )
        db.add(product)
        added += 1
        print(f"urun eklendi: {name}")

    print(f"\n{added} urun eklendi, {skipped} urun zaten mevcuttu.")


def main() -> None:
    from app.db.session import SessionLocal as AppSessionLocal

    db = AppSessionLocal()
    try:
        categories = upsert_categories(db)
        upsert_products(db, categories)
        db.commit()
        print("\nDemo verisi hazir.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
