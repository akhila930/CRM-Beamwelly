"""create lead and client tables

Revision ID: create_lead_client_tables
Revises: 
Create Date: 2024-03-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_lead_client_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create LeadStatus enum type
    op.execute("""
        CREATE TYPE leadstatus AS ENUM (
            'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
        )
    """)

    # Create ClientStatus enum type
    op.execute("""
        CREATE TYPE clientstatus AS ENUM (
            'active', 'inactive', 'onboarding'
        )
    """)

    # Create leads table
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('status', postgresql.ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', name='leadstatus'), nullable=False, server_default='new'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('expected_value', sa.Float(), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'inactive', 'onboarding', name='clientstatus'), nullable=False, server_default='onboarding'),
        sa.Column('contract_start_date', sa.Date(), nullable=True),
        sa.Column('contract_end_date', sa.Date(), nullable=True),
        sa.Column('contract_value', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_leads_email'), 'leads', ['email'], unique=False)
    op.create_index(op.f('ix_clients_email'), 'clients', ['email'], unique=False)

    # Add assigned_to column to clients table
    op.add_column('clients', sa.Column('assigned_to', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_clients_assigned_to_employees', 'clients', 'employees', ['assigned_to'], ['id'], ondelete='SET NULL')

def downgrade():
    # Drop tables
    op.drop_index(op.f('ix_clients_email'), table_name='clients')
    op.drop_index(op.f('ix_leads_email'), table_name='leads')
    op.drop_table('clients')
    op.drop_table('leads')

    # Drop enum types
    op.execute('DROP TYPE clientstatus')
    op.execute('DROP TYPE leadstatus') 