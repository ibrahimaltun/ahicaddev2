from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    shipping_full_name: str = Field(min_length=3, max_length=200)
    shipping_phone: str = Field(min_length=7, max_length=30)
    shipping_city: str = Field(min_length=2, max_length=100)
    shipping_district: str = Field(min_length=2, max_length=100)
    shipping_address: str = Field(min_length=10, max_length=1000)
    shipping_postal_code: str | None = Field(
        default=None,
        max_length=10,
    )
    payment_method: Literal["iban_transfer"] = "iban_transfer"


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    unit_price: Decimal
    quantity: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderResponse(BaseModel):
    id: int
    status: str
    payment_method: str
    total_price: Decimal
    shipping_full_name: str
    shipping_phone: str
    shipping_city: str
    shipping_district: str
    shipping_address: str
    shipping_postal_code: str | None
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderStatusUpdate(BaseModel):
    status: Literal["processing", "shipped", "delivered", "cancelled"]
