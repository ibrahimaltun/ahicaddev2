from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import SessionLocal
from app.models import Cart, CartItem, Product, User
from app.api.v1.auth import get_current_user

from app.schemas.cart import (
    CartResponse,
    CartItemCreate,
    CartItemUpdate,
)

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
