"""merge_heads

Revision ID: 6797bfe6bd42
Revises: 59cd05e1c605, 6da5a40badb8
Create Date: 2025-06-02 22:01:26.920277

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6797bfe6bd42'
down_revision: Union[str, None] = ('59cd05e1c605', '6da5a40badb8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
