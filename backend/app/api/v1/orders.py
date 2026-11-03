from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user, require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models import Cart, CartItem, Order, OrderItem, Product, User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)

# Sipariş bu durumlardayken iptal edilebilir (stok iadesi yapılır).
CANCELLABLE_STATUSES = {"pending_payment", "processing"}

# Bu durumlardaki siparişler artık değiştirilemez.
FINAL_STATUSES = {"delivered", "cancelled"}


def _load_order(db: Session, order_id: int) -> Order | None:
    return db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )


def _get_order_for_user(db: Session, order_id: int, user: User) -> Order:
    order = _load_order(db, order_id)

    if order is None or (
        order.user_id != user.id and user.role != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


def _restock_order_items(db: Session, order: Order) -> None:
    for item in order.items:
        if item.product_id is None:
            continue

        product = db.get(Product, item.product_id)

        if product is not None:
            product.stock += item.quantity


@router.get(
    "/payment-info",
)
def get_payment_info():
    return {
        "payment_method": "iban_transfer",
        "iban": settings.payment_iban,
        "receiver": settings.payment_receiver,
        "instructions": (
            "Sipariş numaranızı ödeme açıklamasına yazarak havale/EFT "
            "yapabilirsiniz. Ödemeniz onaylandığında siparişiniz "
            "hazırlanmaya başlanacaktır."
        ),
    }


@router.get(
    "",
    response_model=list[OrderResponse],
)
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    ).all()

    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_order_for_user(db, order_id, current_user)


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))

    cart_items = (
        db.scalars(
            select(CartItem).where(CartItem.cart_id == cart.id)
        ).all()
        if cart is not None
        else []
    )

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sepetiniz boş. Sipariş oluşturulamadı.",
        )

    product_ids = [item.product_id for item in cart_items]

    # Ödeme adımındaki stok yarışını engellemek için ürün satırlarını kilitler.
    products = {
        product.id: product
        for product in db.scalars(
            select(Product)
            .where(Product.id.in_(product_ids))
            .with_for_update()
        ).all()
    }

    # Önce tüm satırları doğrula; hata varsa hiçbir şey yazmadan çık.
    for item in cart_items:
        product = products.get(item.product_id)

        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Sepetinizde artık satın alınamayan ürünler var. "
                    "Lütfen sepetinizi güncelleyin."
                ),
            )

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"'{product.name}' için yeterli stok yok. "
                    f"Kalan stok: {product.stock}"
                ),
            )

    order = Order(
        user_id=current_user.id,
        status="pending_payment",
        payment_method=order_data.payment_method,
        total_price=Decimal("0"),
        shipping_full_name=order_data.shipping_full_name.strip(),
        shipping_phone=order_data.shipping_phone.strip(),
        shipping_city=order_data.shipping_city.strip(),
        shipping_district=order_data.shipping_district.strip(),
        shipping_address=order_data.shipping_address.strip(),
        shipping_postal_code=order_data.shipping_postal_code,
    )
    db.add(order)
    db.flush()

    total_price = Decimal("0")

    for item in cart_items:
        product = products[item.product_id]

        product.stock -= item.quantity
        total_price += product.price * item.quantity

        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=item.quantity,
            )
        )

    order.total_price = total_price

    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(order)

    return order


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_for_user(db, order_id, current_user)

    if order.status not in CANCELLABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu durumdaki sipariş iptal edilemez.",
        )

    _restock_order_items(db, order)
    order.status = "cancelled"
    db.commit()
    db.refresh(order)

    return order


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    order = _get_order_for_user(db, order_id, current_user)

    if order.status in FINAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tamamlanmış veya iptal edilmiş siparişin durumu değiştirilemez.",
        )

    if status_data.status == "cancelled":
        _restock_order_items(db, order)

    order.status = status_data.status
    db.commit()
    db.refresh(order)

    return order
