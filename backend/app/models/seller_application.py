from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class SellerApplication(Base):
    __tablename__ = "seller_applications"
    __table_args__ = (
        # Aynı e-posta ile aynı anda yalnızca bir "pending" başvuru olabilir
        Index(
            "uq_seller_applications_pending_email",
            "email",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
            name="fk_seller_applications_user_id_users",
        ),
        nullable=False,
        index=True,
    )

    # İletişim
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)

    # İşletme
    seller_type: Mapped[str] = mapped_column(String(30), nullable=False)
    business_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    tax_number: Mapped[str | None] = mapped_column(String(11), nullable=True)
    website_or_social: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Ürün
    product_category: Mapped[str] = mapped_column(String(80), nullable=False)
    product_description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_product_count: Mapped[str] = mapped_column(String(10), nullable=False)

    # Durum: pending | approved | rejected
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )
    kvkk_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
