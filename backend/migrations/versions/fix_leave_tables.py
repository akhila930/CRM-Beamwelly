"""Fix leave tables

Revision ID: 5a4234f89d72
Revises: 4a4234f89d71
Create Date: 2024-03-19 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5a4234f89d72'
down_revision = '4a4234f89d71'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add missing columns to leave_requests table
    op.add_column('leave_requests', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('leave_requests', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('leave_requests', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add foreign key constraint for approved_by
    op.create_foreign_key(
        'fk_leave_requests_approved_by_users',
        'leave_requests', 'users',
        ['approved_by'], ['id']
    )

def downgrade() -> None:
    # Remove foreign key constraint
    op.drop_constraint('fk_leave_requests_approved_by_users', 'leave_requests', type_='foreignkey')
    
    # Remove columns
    op.drop_column('leave_requests', 'updated_at')
    op.drop_column('leave_requests', 'rejection_reason')
    op.drop_column('leave_requests', 'approved_by')

    # Drop existing foreign key constraints
    op.drop_constraint('company_leave_policies_company_id_fkey', 'company_leave_policies', type_='foreignkey')
    
    # Drop the company_id column
    op.drop_column('company_leave_policies', 'company_id')
    
    # Add company_name column
    op.add_column('company_leave_policies', sa.Column('company_name', sa.String(), nullable=False))
    
    # Add unique constraint on company_name
    op.create_unique_constraint('uq_company_leave_policies_company_name', 'company_leave_policies', ['company_name'])

def downgrade_company_leave_policies():
    # Drop unique constraint
    op.drop_constraint('uq_company_leave_policies_company_name', 'company_leave_policies', type_='unique')
    
    # Drop company_name column
    op.drop_column('company_leave_policies', 'company_name')
    
    # Add back company_id column
    op.add_column('company_leave_policies', sa.Column('company_id', sa.Integer(), nullable=False))
    
    # Add back foreign key constraint
    op.create_foreign_key('company_leave_policies_company_id_fkey', 'company_leave_policies', 'companies', ['company_id'], ['id']) 