"""merge_heads

Revision ID: a1b01c6d3f50
Revises: 2ed0ac32f44f, 6797bfe6bd42
Create Date: 2025-06-09 07:21:56.306474

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b01c6d3f50'
down_revision: Union[str, None] = ('2ed0ac32f44f', '6797bfe6bd42')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
