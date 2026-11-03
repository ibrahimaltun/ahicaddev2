"""Harici (online) ürün kataloğu kaynakları.

Sitede henüz gerçek satıcı yokken vitrinin boş kalmaması için
DummyJSON gibi halka açık API'lerden örnek ürünler çekilir ve
veritabanına aktarılır. Bu modül, admin katalog içe aktarma
endpoint'inin veri kaynağıdır.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import quote

import httpx

DUMMYJSON_BASE_URL = "https://dummyjson.com/products"

# DummyJSON fiyatları USD cinsindendir. Site faturası TRY olduğundan
# aktarım sırasında sabit bir kur uygulanır (örnek katalog için yeterli).
USD_TO_TRY_RATE = Decimal("47.00")

REQUEST_TIMEOUT_SECONDS = 15.0


class ExternalCatalogError(Exception):
    """Harici katalog kaynağına ulaşılamadı."""


@dataclass(frozen=True)
class ExternalProduct:
    name: str
    slug: str
    description: str | None
    price: Decimal
    stock: int
    category_name: str
    image_url: str | None


def slugify(value: str) -> str:
    value = value.strip().lower()
    tr_map = str.maketrans({
        "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
        "â": "a", "é": "e",
    })
    value = value.translate(tr_map)

    result: list[str] = []
    for char in value:
        if char.isalnum():
            result.append(char)
        elif result and result[-1] != "-":
            result.append("-")

    slug = "".join(result).strip("-")
    return slug[:200] if slug else "urun"


def _convert_price(price_in_usd: float | int | str) -> Decimal:
    usd = Decimal(str(price_in_usd))
    return (usd * USD_TO_TRY_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def fetch_dummyjson_products(limit: int = 30) -> list[ExternalProduct]:
    """DummyJSON API'sinden ürünleri çeker ve içi temiz bir listeye indirger."""
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100

    url = f"{DUMMYJSON_BASE_URL}?limit={limit}&select=title,description,price,stock,category,thumbnail&skip=0"

    try:
        response = httpx.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise ExternalCatalogError(
            f"Harici katalog kaynağına ulaşılamadı: {error}"
        ) from error

    raw_products = payload.get("products") if isinstance(payload, dict) else None

    if not isinstance(raw_products, list):
        raise ExternalCatalogError("Harici katalog yanıtı beklenen biçimde değil.")

    products: list[ExternalProduct] = []

    for raw in raw_products:
        if not isinstance(raw, dict):
            continue

        title = str(raw.get("title") or "").strip()
        if not title:
            continue

        category_name = str(raw.get("category") or "genel").strip().title()

        stock_value = raw.get("stock")
        try:
            stock = int(stock_value)
        except (TypeError, ValueError):
            stock = 25

        products.append(
            ExternalProduct(
                name=title,
                slug=slugify(title),
                description=(
                    str(raw.get("description")).strip()
                    if raw.get("description")
                    else None
                ),
                price=_convert_price(raw.get("price") or 0),
                stock=max(stock, 5),
                category_name=category_name,
                image_url=(
                    quote(str(raw.get("thumbnail")), safe=":/?=&%")
                    if raw.get("thumbnail")
                    else None
                ),
            )
        )

    return products
