"""add product status, owner ve submitted_at (urun giris onay akisi)

Revision ID: b1c2d3e4f5a6
Revises: a9b8c7d6e5f4
Create Date: 2026-11-03
"""
from alembic import op
import sqlalchemy as sa

revision = "b1c2d3e4f5a6"
down_revision = "a9b8c7d6e5f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="approved",
        ),
    )

    op.add_column(
        "products",
        sa.Column("owner_user_id", sa.Integer(), nullable=True),
    )

    op.add_column(
        "products",
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_products_status", "products", ["status"])
    op.create_index("ix_products_owner_user_id", "products", ["owner_user_id"])

    op.create_foreign_key(
        "fk_products_owner_user_id_users",
        "products",
        "users",
        ["owner_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_products_owner_user_id_users", "products", type_="foreignkey")
    op.drop_index("ix_products_owner_user_id", table_name="products")
    op.drop_index("ix_products_status", table_name="products")
    op.drop_column("products", "submitted_at")
    op.drop_column("products", "owner_user_id")
    op.drop_column("products", "status")
