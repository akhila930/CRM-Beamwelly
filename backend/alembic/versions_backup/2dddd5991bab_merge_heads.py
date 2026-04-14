"""merge heads

Revision ID: 2dddd5991bab
Revises: add_milestone_status_column, update_employee_feedback_fk
Create Date: 2025-05-07 20:54:51.143007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2dddd5991bab'
down_revision: Union[str, None] = ('add_milestone_status_column', 'update_employee_feedback_fk')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
