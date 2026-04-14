"""merge heads

Revision ID: e3f1d2d1a3f8
Revises: 7bd24338dfdb, fix_employee_feedback_fk
Create Date: 2025-04-30 10:15:01.313810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f1d2d1a3f8'
down_revision: Union[str, None] = ('7bd24338dfdb', 'fix_employee_feedback_fk')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
