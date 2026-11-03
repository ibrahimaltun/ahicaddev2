from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.v1.auth import require_admin
from app.db.session import get_db
from app.models import Brand, Category, Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


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


@router.get(
    "",
    response_model=list[ProductResponse],
)
def list_products(
    page: int = 1,
    limit: int = 20,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    if limit < 1:
        limit = 20

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    query = (
        select(Product)
        .options(joinedload(Product.category))
        .where(Product.is_active.is_(True))
        .order_by(Product.id.desc())
    )

    if category is not None:
        query = query.where(Product.category.has(Category.slug == category))

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
    product = db.scalar(
        select(Product).where(
            Product.slug == slug,
            Product.is_active.is_(True),
        )
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product
