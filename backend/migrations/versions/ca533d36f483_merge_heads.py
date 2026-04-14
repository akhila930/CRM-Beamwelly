"""merge heads

Revision ID: ca533d36f483
Revises: create_lead_client_tables, fix_budget_tables
Create Date: 2025-04-18 12:37:44.596587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca533d36f483'
down_revision: Union[str, None] = ('create_lead_client_tables', 'fix_budget_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
