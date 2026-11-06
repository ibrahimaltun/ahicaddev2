"""Yönetim paneli için şemalar."""
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.order import OrderItemResponse


class AdminStatsResponse(BaseModel):
    users_total: int
    products_total: int
    products_active: int
    categories_total: int
    orders_total: int
    orders_by_status: dict[str, int]
    revenue_total: Decimal
    seller_applications_by_status: dict[str, int]


class AdminUserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    created_at: datetime
    orders_count: int

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    role: Literal["customer", "admin"] | None = None
    is_active: bool | None = None


class AdminProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    stock: int
    is_active: bool
    status: str
    owner_user_id: int | None = None
    category_id: int | None
    category_name: str | None
    primary_image_url: str | None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    category_id: int | None = None
    # Onay akisi: admin pending urunu onaylayabilir/reddedebilir.
    status: Literal["approved", "rejected", "pending"] | None = None


class AdminOrderResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    status: str
    payment_method: str
    total_price: Decimal
    shipping_full_name: str
    shipping_city: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class CatalogImportRequest(BaseModel):
    source: Literal["dummyjson"] = "dummyjson"
    limit: int = Field(default=30, ge=1, le=100)


class CatalogImportResponse(BaseModel):
    source: str
    created_categories: int
    created_products: int
    skipped_products: int
    total_products: int
