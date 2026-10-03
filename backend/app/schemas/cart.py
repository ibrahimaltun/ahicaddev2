from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CartProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


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
