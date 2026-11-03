"""add user_id to seller_applications

Revision ID: c0e1f2a3b4d5
Revises: 1677736a612d
Create Date: 2026-11-03 11:00:00.000000

Alembic check, seller_applications tablosunda model ile sema arasinda
eksik user_id kolonunu (FK + index) tespit etti. a1b2c3d4e5f6 revizyonu
tabloyu users tablosu olusturulmadan once olusturdugu icin FK burada
(merge sonrasi) tamamlaniyor.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0e1f2a3b4d5'
down_revision: Union[str, Sequence[str], None] = '1677736a612d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "seller_applications",
        sa.Column("user_id", sa.Integer(), nullable=True),
    )

    op.create_index(
        op.f("ix_seller_applications_user_id"),
        "seller_applications",
        ["user_id"],
    )

    op.create_foreign_key(
        "fk_seller_applications_user_id_users",
        "seller_applications",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Tablo hizalama: veri tasima yapilmadan zorunlu alan yapilir.
    op.alter_column(
        "seller_applications",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "fk_seller_applications_user_id_users",
        "seller_applications",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_seller_applications_user_id"),
        table_name="seller_applications",
    )

    op.drop_column("seller_applications", "user_id")
