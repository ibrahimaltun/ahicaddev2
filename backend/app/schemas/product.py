from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    sort_order: int
    is_primary: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    category_id: int | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    stock: int
    is_active: bool
    category_id: int | None

    model_config = ConfigDict(
        from_attributes=True,
    )
    brand_id: int | None
    images: list[ProductImageResponse]
