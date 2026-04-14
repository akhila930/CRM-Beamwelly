"""
Add services, interactions, and client_service_documents tables

Revision ID: 20240610_add_services_interactions_documents
Revises: 
Create Date: 2024-06-10
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'services',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('client_id', sa.Integer, sa.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('stage', sa.String, nullable=True, server_default='active'),
    )
    op.create_table(
        'interactions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('service_id', sa.Integer, sa.ForeignKey('services.id', ondelete='CASCADE'), nullable=False),
        sa.Column('details', sa.Text, nullable=False),
    )
    op.create_table(
        'client_service_documents',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('service_id', sa.Integer, sa.ForeignKey('services.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('file_url', sa.String, nullable=False),
    )

def downgrade():
    op.drop_table('client_service_documents')
    op.drop_table('interactions')
    op.drop_table('services') 