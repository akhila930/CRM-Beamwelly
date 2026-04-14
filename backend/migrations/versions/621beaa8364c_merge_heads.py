"""merge heads

Revision ID: 621beaa8364c
Revises: 3a3234f89d70, 4b4345f9a81
Create Date: 2025-04-13 11:42:48.201618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '621beaa8364c'
down_revision: Union[str, None] = ('3a3234f89d70', '4b4345f9a81')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
