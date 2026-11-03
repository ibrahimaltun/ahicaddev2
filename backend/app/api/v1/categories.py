from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.db.session import get_db
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=201,
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    category = Category(
        name=category_data.name,
        slug=category_data.slug,
    )

    db.add(category)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu slug ile bir kategori zaten var",
        )

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
