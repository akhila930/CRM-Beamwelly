"""merge_budget_heads

Revision ID: d5a255beb7f8
Revises: 5d30fe5b221a, add_budget_tables, 8f2a9c3d4e5b, merge_heads_revision
Create Date: 2025-04-16 16:15:21.571702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5a255beb7f8'
down_revision: Union[str, None] = ('5d30fe5b221a', 'add_budget_tables', '8f2a9c3d4e5b', 'merge_heads_revision')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
