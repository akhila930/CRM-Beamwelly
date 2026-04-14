"""Merge heads

Revision ID: 5d30fe5b221a
Revises: 621beaa8364c, 5a4234f89d72
Create Date: 2025-04-14 11:49:20.296190

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d30fe5b221a'
down_revision: Union[str, None] = ('621beaa8364c', '5a4234f89d72')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
