"""create seller_applications table

Revision ID: a1b2c3d4e5f6
Revises: 95645f216b2c
Create Date: 2026-10-28 16:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "95645f216b2c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "seller_applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("seller_type", sa.String(length=30), nullable=False),
        sa.Column("business_name", sa.String(length=160), nullable=True),
        sa.Column("tax_number", sa.String(length=11), nullable=True),
        sa.Column("website_or_social", sa.String(length=255), nullable=True),
        sa.Column("product_category", sa.String(length=80), nullable=False),
        sa.Column("product_description", sa.Text(), nullable=False),
        sa.Column("estimated_product_count", sa.String(length=10), nullable=False),
        sa.Column(
            "status", sa.String(length=20), server_default="pending", nullable=False
        ),
        sa.Column("kvkk_consent", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_seller_applications_email", "seller_applications", ["email"])
    op.create_index("ix_seller_applications_status", "seller_applications", ["status"])
    op.create_index(
        "uq_seller_applications_pending_email",
        "seller_applications",
        ["email"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_seller_applications_pending_email", table_name="seller_applications"
    )
    op.drop_index("ix_seller_applications_status", table_name="seller_applications")
    op.drop_index("ix_seller_applications_email", table_name="seller_applications")
    op.drop_table("seller_applications")
