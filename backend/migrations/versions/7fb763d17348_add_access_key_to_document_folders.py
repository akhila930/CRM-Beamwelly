"""Add access_key to document_folders

Revision ID: 7fb763d17348
Revises: 5d83ec95fc54
Create Date: 2024-03-19 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7fb763d17348'
down_revision = '5d83ec95fc54'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add access_key column to document_folders table
    op.add_column('document_folders', sa.Column('access_key', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove access_key column from document_folders table
    op.drop_column('document_folders', 'access_key')
