"""add_status_to_budgets

Revision ID: 3a3234f89d70
Revises: be2db1071677
Create Date: 2024-04-13 12:34:56.789012

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a3234f89d70'
down_revision = 'be2db1071677'
branch_labels = None
depends_on = None


def upgrade():
    # Add status column with default value 'active'
    op.add_column('budgets', sa.Column('status', sa.String(), nullable=True))
    op.execute("UPDATE budgets SET status = 'active'")
    op.alter_column('budgets', 'status', nullable=False)


def downgrade():
    # Remove status column
    op.drop_column('budgets', 'status')
