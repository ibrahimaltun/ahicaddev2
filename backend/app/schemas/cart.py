from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    stock: int
    is_sample: bool = False
    image_url: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: CartProductResponse

    model_config = ConfigDict(
        from_attributes=True,
    )


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )
