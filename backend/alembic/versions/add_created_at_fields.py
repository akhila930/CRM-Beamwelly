"""add created_at fields

Revision ID: add_created_at_fields
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = 'add_created_at_fields'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add created_at column to services table
    op.add_column('services', sa.Column('created_at', sa.DateTime(), server_default=func.now(), nullable=True))
    
    # Add created_at column to interactions table
    op.add_column('interactions', sa.Column('created_at', sa.DateTime(), server_default=func.now(), nullable=True))
    
    # Add created_at column to client_service_documents table
    op.add_column('client_service_documents', sa.Column('created_at', sa.DateTime(), server_default=func.now(), nullable=True))

def downgrade():
    # Remove created_at column from services table
    op.drop_column('services', 'created_at')
    
    # Remove created_at column from interactions table
    op.drop_column('interactions', 'created_at')
    
    # Remove created_at column from client_service_documents table
    op.drop_column('client_service_documents', 'created_at') 