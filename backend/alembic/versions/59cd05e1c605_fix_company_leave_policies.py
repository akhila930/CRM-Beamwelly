"""fix company leave policies

Revision ID: 59cd05e1c605
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '59cd05e1c605'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing foreign key constraints if they exist
    try:
        op.drop_constraint('company_leave_policies_company_id_fkey', 'company_leave_policies', type_='foreignkey')
    except:
        pass
    
    # Drop the company_id column if it exists
    try:
        op.drop_column('company_leave_policies', 'company_id')
    except:
        pass
    
    # Add company_name column if it doesn't exist
    try:
        op.add_column('company_leave_policies', sa.Column('company_name', sa.String(), nullable=False))
    except:
        pass
    
    # Add unique constraint on company_name if it doesn't exist
    try:
        op.create_unique_constraint('uq_company_leave_policies_company_name', 'company_leave_policies', ['company_name'])
    except:
        pass

def downgrade():
    # Drop unique constraint if it exists
    try:
        op.drop_constraint('uq_company_leave_policies_company_name', 'company_leave_policies', type_='unique')
    except:
        pass
    
    # Drop company_name column if it exists
    try:
        op.drop_column('company_leave_policies', 'company_name')
    except:
        pass
    
    # Add back company_id column if it doesn't exist
    try:
        op.add_column('company_leave_policies', sa.Column('company_id', sa.Integer(), nullable=False))
    except:
        pass
    
    # Add back foreign key constraint if it doesn't exist
    try:
        op.create_foreign_key('company_leave_policies_company_id_fkey', 'company_leave_policies', 'companies', ['company_id'], ['id'])
    except:
        pass
