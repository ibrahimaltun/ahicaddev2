"""Ürün arama metni (``products.search_text``) üretimi.

Türkçe karakterleri ASCII eşlerine çevirip küçük harfe indirerek aksan
duyarsız arama sağlar: kullanıcının "suzme" yazdığı arama "Süzme" adlı
ürünü bulur; "ŞEKER" yazdığı arama "seker" içeren ürünü bulur.

Ürün adı + açıklama + kategori adı tek düz metin olarak saklanır ve
arama bu kolon üzerinde LIKE ile yapılır (SQLite + Postgres uyumlu;
Postgres'te migrasyon ek olarak pg_trgm GIN indeksi oluşturur).

Kolonda `NULL` kalan eski kayıtlar için liste araması isim üzerinde
`ilike` yedeğiyle birlikte çalışır (bkz. ``api/v1/products.py``).
"""
import unicodedata

_TR_CHAR_MAP = str.maketrans({
    "ı": "i", "İ": "i", "ş": "s", "Ş": "s",
    "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
    "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
    "â": "a", "Â": "a", "î": "i", "Î": "i",
    "û": "u", "Û": "u",
})


def normalize_search_text(value: str | None) -> str:
    """Serbest metni arama normuna indirger (TR transliterasyon + lower).

    Boşluklar tek boşluğa indirgenir; LIKE joker karakterleri bu seviyede
    ESCAP EDİLMEZ (arama desenini kuran taraf escape yapar).
    """
    if value is None:
        return ""

    normalized = unicodedata.normalize("NFKD", value.translate(_TR_CHAR_MAP))
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")

    return " ".join(ascii_text.lower().split())


def escape_like(value: str) -> str:
    """LIKE joker karakterlerini literal aramak için escape eder."""
    return (
        value
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )


def build_search_text(
    name: str | None,
    description: str | None,
    category_name: str | None = None,
) -> str:
    """Ürünün aranabilir düz metnini üretir: ad + açıklama + kategori."""
    return normalize_search_text(
        " ".join(
            part
            for part in (name, description, category_name)
            if part
        )
    )