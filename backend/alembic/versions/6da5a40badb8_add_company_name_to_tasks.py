"""add company_name to tasks

Revision ID: 6da5a40badb8
Revises: add_created_at_fields
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6da5a40badb8'
down_revision = 'add_created_at_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Add company_name column to tasks table
    op.add_column('tasks', sa.Column('company_name', sa.String(), nullable=True))


def downgrade():
    # Remove company_name column from tasks table
    op.drop_column('tasks', 'company_name')
