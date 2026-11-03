from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models import Cart, CartItem, Product, User
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartResponse,
)

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


def _get_or_create_cart(db: Session, user: User) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.user_id == user.id))

    if cart is None:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.flush()

    return cart


def _load_cart_with_items(db: Session, cart: Cart) -> Cart:
    return db.scalar(
        select(Cart)
        .options(
            joinedload(Cart.items).joinedload(CartItem.product),
        )
        .where(Cart.id == cart.id)
    )


@router.get(
    "",
    response_model=CartResponse,
)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)
    db.commit()

    return _load_cart_with_items(db, cart)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))

    if cart is not None:
        cart_items = db.scalars(
            select(CartItem).where(CartItem.cart_id == cart.id)
        ).all()

        for item in cart_items:
            db.delete(item)

        db.commit()

    return None


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_cart_item(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)

    product = db.get(Product, item_data.product_id)

    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    existing_item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product.id,
        )
    )

    new_quantity = item_data.quantity
    if existing_item:
        new_quantity = existing_item.quantity + item_data.quantity

    if new_quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ürüne ait yeterli stok yok",
        )

    if existing_item:
        existing_item.quantity = new_quantity
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=item_data.quantity,
            )
        )

    db.commit()

    return _load_cart_with_items(db, cart)


@router.patch(
    "/items/{item_id}",
    response_model=CartResponse,
)
def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)

    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    if item_data.quantity > item.product.stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ürüne ait yeterli stok yok",
        )

    item.quantity = item_data.quantity
    db.commit()

    return _load_cart_with_items(db, cart)


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)

    item = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    db.delete(item)
    db.commit()

    return None
