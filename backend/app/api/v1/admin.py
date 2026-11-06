"""Yönetim paneli API'leri.

Tüm uçlar require_admin ile korunur:
- /stats           : panel özet sayıları
- /users           : kullanıcı listesi + rol/durum güncelleme
- /products        : tüm ürünler (pasif dahil) + güncelleme + silme
- /orders          : tüm siparişler (durum filtresi ile)
- /catalog/import  : harici online API'den örnek katalog içe aktarma
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.v1.auth import require_admin
from app.api.v1.products import autoapprove_pending_products
from app.db.session import get_db
from app.models import Category, Product, SellerApplication, User
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.product_image import ProductImage
from app.schemas.admin import (
    AdminOrderResponse,
    AdminProductResponse,
    AdminProductUpdate,
    AdminStatsResponse,
    AdminUserResponse,
    AdminUserUpdate,
    CatalogImportRequest,
    CatalogImportResponse,
)
from app.services.external_catalog import (
    ExternalCatalogError,
    fetch_dummyjson_products,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

MAX_LIMIT = 100


def _clamp_pagination(page: int, limit: int) -> tuple[int, int]:
    page = max(page, 1)
    limit = min(max(limit, 1), MAX_LIMIT)
    return page, limit


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
)
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    users_total = db.scalar(select(func.count(User.id))) or 0
    products_total = db.scalar(select(func.count(Product.id))) or 0
    products_active = db.scalar(
        select(func.count(Product.id)).where(Product.is_active.is_(True))
    ) or 0
    categories_total = db.scalar(select(func.count(Category.id))) or 0
    orders_total = db.scalar(select(func.count(Order.id))) or 0

    orders_by_status_rows = db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    ).all()
    orders_by_status = {row[0]: row[1] for row in orders_by_status_rows}

    revenue_total = db.scalar(
        select(func.coalesce(func.sum(Order.total_price), 0)).where(
            Order.status != "cancelled"
        )
    ) or Decimal("0.00")

    application_rows = db.execute(
        select(SellerApplication.status, func.count(SellerApplication.id)).group_by(
            SellerApplication.status
        )
    ).all()
    seller_applications_by_status = {row[0]: row[1] for row in application_rows}

    return AdminStatsResponse(
        users_total=users_total,
        products_total=products_total,
        products_active=products_active,
        categories_total=categories_total,
        orders_total=orders_total,
        orders_by_status=orders_by_status,
        revenue_total=revenue_total,
        seller_applications_by_status=seller_applications_by_status,
    )


@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def list_users(
    search: str | None = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    page, limit = _clamp_pagination(page, limit)

    query = select(User).order_by(User.id.desc())

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
            )
        )

    users = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()

    order_counts = dict(
        db.execute(
            select(Order.user_id, func.count(Order.id)).group_by(Order.user_id)
        ).all()
    )

    return [
        AdminUserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            orders_count=order_counts.get(user.id, 0),
        )
        for user in users
    ]


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı.",
        )

    if user.id == admin.id and (
        (payload.role is not None and payload.role != "admin")
        or payload.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kendi yönetici yetkinizi veya hesabınızı kapatamazsınız.",
        )

    if payload.role is not None:
        user.role = payload.role

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    orders_count = db.scalar(
        select(func.count(Order.id)).where(Order.user_id == user.id)
    ) or 0

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        orders_count=orders_count,
    )


@router.get(
    "/products",
    response_model=list[AdminProductResponse],
)
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    page, limit = _clamp_pagination(page, limit)

    # Sureyi gecen musteri urunlerini once otomatik onaya al (admin onay
    # ekranina gecene kadar 5 dakikalik otomatik onay akisi burada da isler).
    autoapprove_pending_products(db)

    query = (
        select(Product)
        .options(joinedload(Product.category))
        .order_by(Product.id.desc())
    )

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Product.name.ilike(term),
                Product.slug.ilike(term),
            )
        )

    if category_id is not None:
        query = query.where(Product.category_id == category_id)

    if status_filter:
        query = query.where(Product.status == status_filter)

    products = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()

    return [
        AdminProductResponse(
            id=product.id,
            name=product.name,
            slug=product.slug,
            description=product.description,
            price=product.price,
            stock=product.stock,
            is_active=product.is_active,
            status=product.status,
            owner_user_id=product.owner_user_id,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            primary_image_url=product.primary_image_url,
        )
        for product in products
    ]


@router.patch(
    "/products/{product_id}",
    response_model=AdminProductResponse,
)
def update_product(
    product_id: int,
    payload: AdminProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün bulunamadı.",
        )

    if payload.category_id is not None and db.get(Category, payload.category_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )

    if payload.name is not None:
        product.name = payload.name.strip()

    if payload.description is not None:
        product.description = payload.description.strip() or None

    if payload.price is not None:
        product.price = payload.price

    if payload.stock is not None:
        product.stock = payload.stock

    if payload.is_active is not None:
        product.is_active = payload.is_active

    if payload.category_id is not None:
        product.category_id = payload.category_id

    # Admin onay ekranina gecene kadar 5 dakikalik otomatik onay akisi isler.
    autoapprove_pending_products(db)

    db.commit()
    db.refresh(product)

    return AdminProductResponse(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        price=product.price,
        stock=product.stock,
        is_active=product.is_active,
        status=product.status,
        owner_user_id=product.owner_user_id,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        primary_image_url=product.primary_image_url,
    )


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün bulunamadı.",
        )

    cart_ids = db.scalars(select(Cart.id)).all()

    if cart_ids:
        db.execute(
            delete(CartItem).where(
                CartItem.product_id == product_id,
                CartItem.cart_id.in_(cart_ids),
            )
        )

    db.delete(product)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ürün sipariş geçmişiyle ilişkili olduğu için silinemedi.",
        )


@router.get(
    "/orders",
    response_model=list[AdminOrderResponse],
)
def list_orders(
    order_status: str | None = Query(default=None, alias="status"),
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    page, limit = _clamp_pagination(page, limit)

    query = (
        select(Order)
        .options(joinedload(Order.user), joinedload(Order.items))
        .order_by(Order.id.desc())
    )

    if order_status:
        query = query.where(Order.status == order_status)

    orders = db.scalars(
        query.offset((page - 1) * limit).limit(limit)
    ).unique().all()

    return [
        AdminOrderResponse(
            id=order.id,
            user_id=order.user_id,
            user_email=order.user.email if order.user else "",
            status=order.status,
            payment_method=order.payment_method,
            total_price=order.total_price,
            shipping_full_name=order.shipping_full_name,
            shipping_city=order.shipping_city,
            created_at=order.created_at,
            items=order.items,
        )
        for order in orders
    ]


@router.post(
    "/catalog/import",
    response_model=CatalogImportResponse,
)
def import_external_catalog(
    payload: CatalogImportRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Harici online API'den ürün çekip vitrine aktarır (idempotent)."""
    if payload.source == "dummyjson":
        try:
            external_products = fetch_dummyjson_products(payload.limit)
        except ExternalCatalogError as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(error),
            ) from error
    else:  # pragma: no cover - Literal zaten kısıtlıyor
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Bilinmeyen katalog kaynağı.",
        )

    created_categories = 0
    created_products = 0
    skipped_products = 0

    categories_cache: dict[str, Category] = {
        category.name.lower(): category
        for category in db.scalars(select(Category)).all()
    }

    for external_product in external_products:
        existing = db.scalar(
            select(Product).where(Product.slug == external_product.slug)
        )

        if existing is not None:
            skipped_products += 1
            continue

        category_key = external_product.category_name.lower()
        category = categories_cache.get(category_key)

        if category is None:
            category = Category(
                name=external_product.category_name,
                slug=external_product.category_name.lower().replace(" ", "-"),
            )
            db.add(category)
            db.flush()
            categories_cache[category_key] = category
            created_categories += 1

        product = Product(
            name=external_product.name,
            slug=external_product.slug,
            description=external_product.description,
            price=external_product.price,
            stock=external_product.stock,
            category_id=category.id,
            brand_id=None,
            is_sample=True,
            is_active=True,
        )
        db.add(product)
        db.flush()

        if external_product.image_url:
            db.add(
                ProductImage(
                    product_id=product.id,
                    image_url=external_product.image_url,
                    sort_order=0,
                    is_primary=True,
                )
            )

        created_products += 1

    db.commit()

    total_products = db.scalar(select(func.count(Product.id))) or 0

    return CatalogImportResponse(
        source=payload.source,
        created_categories=created_categories,
        created_products=created_products,
        skipped_products=skipped_products,
        total_products=total_products,
    )
