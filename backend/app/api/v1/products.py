import re
import unicodedata
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.v1.auth import get_current_user, require_admin
from app.db.session import get_db
from app.models import Brand, Category, Product, ProductImage, User
from app.schemas.product import (
    CustomerProductCreate,
    ProductCreate,
    ProductResponse,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)

# Musteri urun girisi otomatik onay suresi (dakika). Su asama admin onay
# ekranina gecmedigimiz icin onay bekleyen urunler bu sure sonunda
# vitrine alinir; ileride sadece deger degistirilerek admin onayina tasinir.
AUTO_APPROVE_MINUTES = 5

# Tek musterinin ayni anda onay bekleyebilecegi maksimum urun sayisi (spam onlemi).
MAX_PENDING_PER_USER = 10

MAX_PRICE = 10000000
MAX_STOCK = 1000000


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _naive_utc_cutoff(minutes: int) -> datetime:
    """SQLite (naive kolon) ve Postgres (timestamptz) uyumlu esik zamani."""
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=minutes)


def autoapprove_pending_products(db: Session) -> int:
    """Suresi dolan onay bekleyen urunleri vitrine alir (tembel otomatik onay).

    Urun listeleme/detay isteklerinde calistirilir; boylece ayri bir
    zamanlayiciSureci (worker) gerektirmeden 5 dakikalik onay akisi isler.
    """
    cutoff = _naive_utc_cutoff(AUTO_APPROVE_MINUTES)

    result = db.execute(
        update(Product)
        .where(
            Product.status == Product.STATUS_PENDING,
            Product.submitted_at.is_not(None),
            Product.submitted_at <= cutoff,
        )
        .values(status=Product.STATUS_APPROVED)
    )

    if result.rowcount:
        db.commit()

    return result.rowcount or 0


_TR_CHAR_MAP = str.maketrans({
    "ı": "i", "İ": "i", "ş": "s", "Ş": "s",
    "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
    "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
})


def _slugify(value: str) -> str:
    """Turkce karakterleri sadelestirip URL uyumlu slug uretir."""
    normalized = unicodedata.normalize("NFKD", value.translate(_TR_CHAR_MAP))
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")

    return slug or "urun"


def _unique_slug(db: Session, name: str) -> str:
    base_slug = _slugify(name)
    slug = base_slug
    counter = 2

    while db.scalar(select(Product.id).where(Product.slug == slug)) is not None:
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def _validate_customer_product(
    db: Session,
    data: CustomerProductCreate,
) -> CustomerProductCreate:
    """Baslangic seviyesi urun girisi kontrolleri; hatayi Turkce dondurur."""
    name = data.name.strip()
    description = data.description.strip()

    if len(name) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ürün adı en az 3 karakter olmalıdır",
        )

    if len(description) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ürün açıklaması en az 10 karakter olmalıdır",
        )

    if data.price <= 0 or data.price > MAX_PRICE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fiyat 0 ile {MAX_PRICE} TL arasında olmalıdır",
        )

    if data.stock < 0 or data.stock > MAX_STOCK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stok adedi 0 ile {MAX_STOCK} arasında olmalıdır",
        )

    if db.get(Category, data.category_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz kategori",
        )

    if data.image_url is not None:
        image_url = data.image_url.strip()

        if not image_url.lower().startswith(("http://", "https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Görsel bağlantısı http:// veya https:// ile başlamalıdır",
            )

    return data


@router.post(
    "",
    response_model=ProductResponse,
    status_code=201,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    if db.get(Category, product_data.category_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )

    if product_data.brand_id is not None and db.get(Brand, product_data.brand_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand not found",
        )

    product = Product(
        name=product_data.name,
        slug=product_data.slug,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
        category_id=product_data.category_id,
        brand_id=product_data.brand_id,
        status=Product.STATUS_APPROVED,
    )

    db.add(product)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu slug ile bir ürün zaten var",
        )

    db.refresh(product)

    return product


@router.post(
    "/submissions",
    response_model=ProductResponse,
    status_code=201,
)
def create_customer_product(
    data: CustomerProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Musteri urun girisi: urun 'pending' olarak onaya girer.

    - Kontroller: ad/açıklama uzunluğu, fiyat/stok sınırları, kategori
      varlığı, görsel bağlantı biçimi ve kullanıcı başına bekleyen ürün limiti.
    - Onay: 5 dakika sonra vitrin isteklerinde otomatik yapilir.
    """
    if current_user.role == "admin":
        # Admin dogrudan /products ucuyla onayli urun acar; karisikligi onler.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin kullanıcılar ürün girişini /products ucuyla yapmalıdır",
        )

    data = _validate_customer_product(db, data)

    pending_count = db.scalar(
        select(func.count(Product.id)).where(
            Product.owner_user_id == current_user.id,
            Product.status == Product.STATUS_PENDING,
        )
    ) or 0

    if pending_count >= MAX_PENDING_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Çok fazla onay bekleyen ürününüz var. "
                "Lütfen önce onaylanan ürünlerinizi kontrol edin."
            ),
        )

    product = Product(
        name=data.name.strip(),
        slug=_unique_slug(db, data.name.strip()),
        description=data.description.strip(),
        price=data.price,
        stock=data.stock,
        category_id=data.category_id,
        status=Product.STATUS_PENDING,
        owner_user_id=current_user.id,
        submitted_at=_utc_now(),
        is_sample=False,
        is_active=True,
    )

    if data.image_url is not None:
        product.images.append(
            ProductImage(
                image_url=data.image_url.strip(),
                sort_order=0,
                is_primary=True,
            )
        )

    db.add(product)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu ada benzer bir ürün zaten var, lütfen adı değiştirin",
        )

    db.refresh(product)

    return product


@router.get(
    "/submissions",
    response_model=list[ProductResponse],
)
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giris yapan musterinin kendi urun girislerini durumlarıyla dondurur."""
    autoapprove_pending_products(db)

    products = db.scalars(
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.owner_user_id == current_user.id)
        .order_by(Product.id.desc())
    ).all()

    return products


@router.get(
    "",
    response_model=list[ProductResponse],
)
def list_products(
    page: int = 1,
    limit: int = 20,
    category: str | None = None,
    q: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    if limit < 1:
        limit = 20

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    autoapprove_pending_products(db)

    query = (
        select(Product)
        .options(joinedload(Product.category))
        .where(
            Product.is_active.is_(True),
            Product.status == Product.STATUS_APPROVED,
        )
        .order_by(Product.id.desc())
    )

    if category is not None:
        query = query.where(Product.category.has(Category.slug == category))

    if q is not None and q.strip():
        needle = f"%{q.strip().lower()}%"
        query = query.where(Product.name.ilike(needle))

    products = db.scalars(
        query.offset(offset).limit(limit)
    ).all()

    return products


@router.get(
    "/{slug}",
    response_model=ProductResponse,
)
def get_product(
    slug: str,
    db: Session = Depends(get_db),
):
    autoapprove_pending_products(db)

    product = db.scalar(
        select(Product).where(
            Product.slug == slug,
            Product.is_active.is_(True),
            Product.status == Product.STATUS_APPROVED,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product


@router.get(
    "/{slug}/related",
    response_model=list[ProductResponse],
)
def get_related_products(
    slug: str,
    limit: int = Query(default=4, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """Ürüne benzer önerileri döndürür: once ayni kategori, sonra en yeni urunler."""
    autoapprove_pending_products(db)

    product = db.scalar(
        select(Product).where(
            Product.slug == slug,
            Product.is_active.is_(True),
            Product.status == Product.STATUS_APPROVED,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    base_query = (
        select(Product)
        .options(joinedload(Product.category))
        .where(
            Product.is_active.is_(True),
            Product.status == Product.STATUS_APPROVED,
            Product.id != product.id,
        )
        .order_by(Product.id.desc())
        .limit(limit)
    )

    related: list[Product] = []

    if product.category_id is not None:
        related = list(
            db.scalars(
                base_query.where(Product.category_id == product.category_id)
            ).all()
        )

    if len(related) < limit:
        seen_ids = {product.id, *(item.id for item in related)}
        fallback = [
            item
            for item in db.scalars(
                select(Product)
                .options(joinedload(Product.category))
                .where(
                    Product.is_active.is_(True),
                    Product.status == Product.STATUS_APPROVED,
                    Product.id.notin_(seen_ids),
                )
                .order_by(Product.id.desc())
                .limit(limit - len(related))
            ).all()
            if item.id not in seen_ids
        ]
        related.extend(fallback)

    return related
