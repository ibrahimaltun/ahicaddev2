"""dif head is merged

Revision ID: 1677736a612d
Revises: 2874b3b2c463, a1b2c3d4e5f6
Create Date: 2026-10-30 01:12:25.513874

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1677736a612d'
down_revision: Union[str, Sequence[str], None] = ('2874b3b2c463', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
