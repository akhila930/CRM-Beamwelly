"""Fix document relationships

Revision ID: be2db1071677
Revises: 7fb763d17348
Create Date: 2024-03-19 12:34:56.789012

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'be2db1071677'
down_revision = '7fb763d17348'
branch_labels = None
depends_on = None

def get_constraint_names(table_name):
    conn = op.get_bind()
    insp = inspect(conn)
    return [fk['name'] for fk in insp.get_foreign_keys(table_name)]

def column_exists(table_name, column_name):
    conn = op.get_bind()
    insp = inspect(conn)
    columns = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in columns

def upgrade():
    # Add parent_folder_id column if it doesn't exist
    if not column_exists("document_folders", "parent_folder_id"):
        op.add_column('document_folders', sa.Column('parent_folder_id', sa.Integer(), nullable=True))

    # Add file_type column if it doesn't exist
    if not column_exists("documents", "file_type"):
        op.add_column('documents', sa.Column('file_type', sa.String(length=50), nullable=True))

    # Add foreign key constraints with ON DELETE CASCADE
    op.create_foreign_key(
        'fk_folders_parent_folder_id',
        'document_folders', 'document_folders',
        ['parent_folder_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_documents_folder_id',
        'documents', 'document_folders',
        ['folder_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade():
    # Drop foreign key constraints
    op.drop_constraint('fk_documents_folder_id', 'documents', type_='foreignkey')
    op.drop_constraint('fk_folders_parent_folder_id', 'document_folders', type_='foreignkey')

    # Drop columns if they exist
    if column_exists("documents", "file_type"):
        op.drop_column('documents', 'file_type')
    if column_exists("document_folders", "parent_folder_id"):
        op.drop_column('document_folders', 'parent_folder_id')

    # Recreate original foreign key constraints without ON DELETE CASCADE
    op.create_foreign_key(
        'documents_folder_id_fkey',
        'documents', 'document_folders',
        ['folder_id'], ['id']
    )
    op.create_foreign_key(
        'document_folders_parent_folder_id_fkey',
        'document_folders', 'document_folders',
        ['parent_folder_id'], ['id']
    )
