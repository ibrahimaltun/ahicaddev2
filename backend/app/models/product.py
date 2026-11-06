from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

from typing import TYPE_CHECKING

from datetime import datetime

if TYPE_CHECKING:
    from app.models.product_image import ProductImage
    from app.models.category import Category
    from app.models.brand import Brand


class Product(Base):
    __tablename__ = "products"

    # Onay akisi durumlari:
    # - pending  : musteri urun girisi yapti, onay bekliyor (5 dk'da otomatik onay)
    # - approved : vitrinde gosterilir
    # - rejected : admin reddi (ilerideki onay ekrani icin sakli)
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    stock: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )

    # Ornek katalog (DummyJSON gibi harici kaynaklardan) aktarilan gecici
    # urunler icin isaret; gercek satici urunlerinde False kalir.
    is_sample: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Urun giris onay akisi: musteriler 'pending' ile baslar, 5 dakika
    # sonra otomatik onaylanir. Admin/katalog urunleri dogrudan 'approved'.
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=STATUS_APPROVED,
        server_default=STATUS_APPROVED,
        index=True,
    )

    # Urunu giren musteri (admin/katalog urunlerinde None).
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Onaya gonderilme zamani; otomatik onay suresi bu alanla hesaplanir.
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
        index=True,
    )

    category: Mapped["Category | None"] = relationship(
        back_populates="products",
    )

    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )

    brand_id: Mapped[int | None] = mapped_column(
        ForeignKey("brands.id"),
        nullable=True,
        index=True,
    )

    brand: Mapped["Brand | None"] = relationship(
        back_populates="products",
    )

    @property
    def primary_image_url(self) -> str | None:
        """Sepet görüntüleme için tek bir gösterim görseli döndürür."""
        if not self.images:
            return None

        primary_image = next(
            (image for image in self.images if image.is_primary),
            None,
        )

        return (primary_image or self.images[0]).image_url
