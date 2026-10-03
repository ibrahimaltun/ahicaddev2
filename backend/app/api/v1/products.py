from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=ProductResponse,
    status_code=201,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
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
    db.commit()
    db.refresh(product)

    return product


@router.get(
    "",
    response_model=list[ProductResponse],
)
def list_products(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1

    if limit < 1:
        limit = 20

    if limit > 100:
        limit = 100

    offset = (page - 1) * limit

    products = db.scalars(
        select(Product)
        .where(Product.is_active.is_(True))
        .order_by(Product.id.desc())
        .offset(offset)
        .limit(limit)
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
