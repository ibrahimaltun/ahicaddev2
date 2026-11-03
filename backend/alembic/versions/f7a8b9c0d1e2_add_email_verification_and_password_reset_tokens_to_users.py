"""Add email verification and password reset tokens to users

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-11-03 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, Sequence[str], None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('verification_token', sa.String(length=128), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column(
            'verification_token_expires',
            sa.DateTime(),
            nullable=True,
        ),
    )
    op.add_column(
        'users',
        sa.Column('reset_token', sa.String(length=128), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('reset_token_expires', sa.DateTime(), nullable=True),
    )
    op.create_index(
        'ix_users_verification_token',
        'users',
        ['verification_token'],
    )
    op.create_index(
        'ix_users_reset_token',
        'users',
        ['reset_token'],
    )


def downgrade() -> None:
    op.drop_index('ix_users_reset_token', table_name='users')
    op.drop_index('ix_users_verification_token', table_name='users')
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'verification_token_expires')
    op.drop_column('users', 'verification_token')