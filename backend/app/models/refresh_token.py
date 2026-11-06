from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RefreshToken(Base):
    """Yenileme (refresh) token kaydi.

    Token'in ham degeri tarayiciya httpOnly cookie olarak verilir; DB'de
    yalnizca sha256 ozeti tutulur. Kullanimda dondurulur (rotasyon),
    sifre degisikliginde tum kullanici oturumlari iptal edilir.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    user: Mapped["User"] = relationship(  # noqa: F821
        back_populates="refresh_tokens",
    )