from datetime import datetime
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
    """Admin urun olusturma (slug el ile verilir, aninda onayli)."""

    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    category_id: int | None = None
    brand_id: int | None = None


class CustomerProductCreate(BaseModel):
    """Musteri urun girisi (baslangic seviyesi form alanlari).

    Slug sunucuda otomatik uretilir; urun 'pending' durumunda onaya
    girer ve AUTO_APPROVE dakika sonra otomatik onaylanir.
    """

    name: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    price: Decimal = Field(gt=0, le=Decimal("10000000"))
    stock: int = Field(default=0, ge=0, le=1000000)
    category_id: int = Field(gt=0)
    # Opsiyonel tek gorsel; bos birakilirse urun gorselsiz vitrine cikar.
    image_url: str | None = Field(default=None, max_length=500)


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    stock: int
    is_sample: bool
    is_active: bool
    status: str
    owner_user_id: int | None
    submitted_at: datetime | None
    category_id: int | None
    brand_id: int | None
    images: list[ProductImageResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )


