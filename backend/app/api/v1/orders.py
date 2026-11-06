from decimal import Decimal
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user, require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models import Cart, CartItem, Order, OrderItem, Product, User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.email import email_service

logger = logging.getLogger("ahicadde.orders")

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)

# Siparis bu durumlardayken musterinin iptal edebilecegi durumlar.
# (Stok iadesi yapilir.)
CANCELLABLE_STATUSES = {"pending_payment", "processing"}

# Bu durumlardaki siparisler artik degistirilemez.
FINAL_STATUSES = {"delivered", "cancelled"}

# Durum makinesi: gecerli admin gecisleri (musteri iptali de bu matrise
# uyar; musteri yalnizca CANCELLABLE_STATUSES -> cancelled gecisi yapar).
ORDER_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending_payment": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}

# Durum degisikliginde musteriyi bilgilendiren e-posta sablonlari.
ORDER_STATUS_EMAILS: dict[str, tuple[str, str]] = {
    "processing": (
        "Siparişiniz hazırlanıyor",
        "Siparişinizin hazırlanmasına başlandı. Kargoya verildiğinde "
        "tekrar haber vereceğiz.",
    ),
    "shipped": (
        "Siparişiniz kargoya verildi",
        "Siparişiniz kargoya verildi. En kısa sürede adresinize teslim "
        "edilecektir.",
    ),
    "delivered": (
        "Siparişiniz teslim edildi",
        "Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür "
        "ederiz; ürünle ilgili görüşlerinizi bizimle paylaşabilirsiniz.",
    ),
    "cancelled": (
        "Siparişiniz iptal edildi",
        "Siparişiniz iptal edildi ve ürünler stoğa geri eklendi. Ödeme "
        "yapmışsanız iade süreci için sipariş numaranızla bizimle "
        "iletişime geçebilirsiniz.",
    ),
}


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


def _send_order_status_email(order: Order, new_status: str) -> None:
    """Durum degisikligini musterinin e-postasina bildirir (hataya takilmaz)."""
    template = ORDER_STATUS_EMAILS.get(new_status)

    if template is None:
        return

    recipient = order.user.email if order.user else None

    if not recipient:
        return

    subject_title, body_text = template

    try:
        email_service.send(
            to=recipient,
            subject=f"Ahicadde - Sipariş #{order.id}: {subject_title}",
            body=(
                "Merhaba,\n\n"
                f"{body_text}\n\n"
                f"Sipariş numarası: #{order.id}\n"
                f"Toplam: {order.total_price} ₺\n\n"
                f"Siparişinizi şuradan takip edebilirsiniz: "
                f"{settings.frontend_url}/orders/{order.id}"
            ),
        )
    except Exception:
        logger.exception(
            "Siparis durum e-postasi gonderilemedi (siparis: %s, durum: %s)",
            order.id,
            new_status,
        )


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
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    response: Response = Response(),
):
    """Kullanicinin siparisleri (yeni once, sayfali).

    Toplam kayit sayisi X-Total-Count basligiyla doner.
    """
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    )

    total = db.scalar(
        select(func.count()).select_from(
            select(Order.id).where(Order.user_id == current_user.id).subquery()
        )
    )

    response.headers["X-Total-Count"] = str(total or 0)

    orders = db.scalars(
        query.offset((page - 1) * limit).limit(limit)
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

    # Once tum satirlari dogrula; hata varsa hicbir sey yazmadan cik.
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

        if product.status != Product.STATUS_APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Sepetinizde onaylanmamış ürünler var. "
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

    _send_order_status_email(order, "cancelled")

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

    # Durum makinesi: yalnizca matriste tanimli gecislere izin verilir.
    allowed = ORDER_STATUS_TRANSITIONS.get(order.status, set())

    if status_data.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"'{order.status}' durumundan '{status_data.status}' durumuna "
                f"geçilemez. Geçilebilecek durumlar: "
                f"{', '.join(sorted(allowed)) if allowed else 'yok'}."
            ),
        )

    if status_data.status == "cancelled":
        _restock_order_items(db, order)

    order.status = status_data.status
    db.commit()
    db.refresh(order)

    _send_order_status_email(order, status_data.status)

    return order
