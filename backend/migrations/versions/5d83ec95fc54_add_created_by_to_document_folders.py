"""Add created_by to document_folders

Revision ID: 5d83ec95fc54
Revises: e4fea0dd5fdf
Create Date: 2024-03-19 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5d83ec95fc54'
down_revision = 'e4fea0dd5fdf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add created_by column to document_folders table
    op.add_column('document_folders', sa.Column('created_by', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_document_folders_created_by_users',
        'document_folders', 'users',
        ['created_by'], ['id']
    )


def downgrade() -> None:
    # Remove created_by column from document_folders table
    op.drop_constraint('fk_document_folders_created_by_users', 'document_folders', type_='foreignkey')
    op.drop_column('document_folders', 'created_by')
