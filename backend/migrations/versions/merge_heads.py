"""merge heads

Revision ID: merge_heads_revision
Revises: fix_leave_requests_columns, 4b4345f9a81
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads_revision'
down_revision = ('fix_leave_requests_columns', '4b4345f9a81')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass 