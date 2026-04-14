"""add_new_lead_client_fields

Revision ID: 2ed0ac32f44f
Revises: 
Create Date: 2024-03-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2ed0ac32f44f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to leads table
    op.add_column('leads', sa.Column('mobile_number', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('company_name', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('profession', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('qualification', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('income', sa.Float(), nullable=True))
    op.add_column('leads', sa.Column('date_of_investment', sa.Date(), nullable=True))
    op.add_column('leads', sa.Column('investment_type', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('reference_name', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('reference_email', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('reference_contact', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('relationship_manager', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('interaction_type', sa.String(), nullable=True))

    # Add new columns to clients table
    op.add_column('clients', sa.Column('mobile_number', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('company_name', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('profession', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('qualification', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('income', sa.Float(), nullable=True))
    op.add_column('clients', sa.Column('date_of_investment', sa.Date(), nullable=True))
    op.add_column('clients', sa.Column('investment_type', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('reference_name', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('reference_email', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('reference_contact', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('relationship_manager', sa.String(), nullable=True))
    op.add_column('clients', sa.Column('interaction_type', sa.String(), nullable=True))


def downgrade():
    # Remove columns from leads table
    op.drop_column('leads', 'mobile_number')
    op.drop_column('leads', 'company_name')
    op.drop_column('leads', 'profession')
    op.drop_column('leads', 'qualification')
    op.drop_column('leads', 'income')
    op.drop_column('leads', 'date_of_investment')
    op.drop_column('leads', 'investment_type')
    op.drop_column('leads', 'reference_name')
    op.drop_column('leads', 'reference_email')
    op.drop_column('leads', 'reference_contact')
    op.drop_column('leads', 'relationship_manager')
    op.drop_column('leads', 'interaction_type')

    # Remove columns from clients table
    op.drop_column('clients', 'mobile_number')
    op.drop_column('clients', 'company_name')
    op.drop_column('clients', 'profession')
    op.drop_column('clients', 'qualification')
    op.drop_column('clients', 'income')
    op.drop_column('clients', 'date_of_investment')
    op.drop_column('clients', 'investment_type')
    op.drop_column('clients', 'reference_name')
    op.drop_column('clients', 'reference_email')
    op.drop_column('clients', 'reference_contact')
    op.drop_column('clients', 'relationship_manager')
    op.drop_column('clients', 'interaction_type')
