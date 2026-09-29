from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=201,
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
):
    category = Category(
        name=category_data.name,
        slug=category_data.slug,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.get(
    "",
    response_model=list[CategoryResponse],
)
def list_categories(
    db: Session = Depends(get_db),
):
    return db.scalars(select(Category).order_by(Category.id.desc())).all()


@router.get(
    "/{slug}",
    response_model=CategoryResponse,
)
def get_category(
    slug: str,
    db: Session = Depends(get_db),
):
    category = db.scalar(select(Category).where(Category.slug == slug))

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    return category
