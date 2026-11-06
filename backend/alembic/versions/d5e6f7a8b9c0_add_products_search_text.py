"""add products search_text (accent-insensitive Turkce arama)

Revision ID: d5e6f7a8b9c0
Revises: c3d4e5f6a7b8
Create Date: 2026-11-06
"""
from alembic import op
import sqlalchemy as sa

revision = "d5e6f7a8b9c0"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None

# Uygulama katmanindaki transliterasyonla ayni karakter seti.
_TR_MAP = (
    ("ı", "i"), ("İ", "i"),
    ("ş", "s"), ("Ş", "s"),
    ("ğ", "g"), ("Ğ", "g"),
    ("ü", "u"), ("Ü", "u"),
    ("ö", "o"), ("Ö", "o"),
    ("ç", "c"), ("Ç", "c"),
)


def _translit_sql(expr: str) -> str:
    for src, dst in _TR_MAP:
        expr = f"REPLACE({expr}, '{src}', '{dst}')"

    return f"lower({expr})"


def upgrade() -> None:
    op.add_column("products", sa.Column("search_text", sa.Text(), nullable=True))
    op.create_index("ix_products_search_text", "products", ["search_text"])

    # Mevcut kayitlari doldur: ad + aciklama (transliterasyonlu).
    search_expr = (
        f"TRIM({_translit_sql('name')} || ' ' || "
        f"COALESCE({_translit_sql('description')}, ''))"
    )
    op.execute(f"UPDATE products SET search_text = {search_expr}")

    # Kategori adini de arama metnine ekle (UPDATE ... FROM).
    bind = op.get_bind()

    if bind.dialect.name in ("postgresql", "sqlite"):
        op.execute(
            "UPDATE products SET search_text = "
            "TRIM(search_text || ' ' || "
            f"COALESCE({_translit_sql('categories.name')}, '')) "
            "FROM categories "
            "WHERE products.category_id = categories.id"
        )

    # Postgres: alt-metin aramasi icin trigram indeksi (opsiyonel).
    if bind.dialect.name == "postgresql":
        try:
            bind.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            bind.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_products_search_text_trgm "
                "ON products USING gin (search_text gin_trgm_ops)"
            )
        except Exception:
            # Uzanti kurulumu (superuser hakki) mumkun degilse btree indeks yeterli.
            pass


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        try:
            bind.exec_driver_sql("DROP INDEX IF EXISTS ix_products_search_text_trgm")
        except Exception:
            pass

    op.drop_index("ix_products_search_text", table_name="products")
    op.drop_column("products", "search_text")