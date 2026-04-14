"""Add general expenses table

Revision ID: 8f2a9c3d4e5b
Revises: be2db1071677
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8f2a9c3d4e5b'
down_revision = 'be2db1071677'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types for category and payment method
    op.execute("DROP TYPE IF EXISTS expensecategory CASCADE;")
    op.execute("DROP TYPE IF EXISTS paymentmethod CASCADE;")
    
    op.execute("""
        CREATE TYPE expensecategory AS ENUM (
            'Office Supplies',
            'Utilities',
            'Rent',
            'Equipment',
            'Software',
            'Travel',
            'Maintenance',
            'Other'
        );
    """)
    
    op.execute("""
        CREATE TYPE paymentmethod AS ENUM (
            'Cash',
            'Credit Card',
            'Bank Transfer',
            'Check',
            'Digital Wallet'
        );
    """)
    
    # Create general_expenses table
    op.create_table(
        'general_expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', postgresql.ENUM('Office Supplies', 'Utilities', 'Rent', 'Equipment', 'Software', 'Travel', 'Maintenance', 'Other', name='expensecategory', native_enum=True), nullable=False),
        sa.Column('payment_method', postgresql.ENUM('Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet', name='paymentmethod', native_enum=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('general_expenses')
    op.execute("DROP TYPE IF EXISTS expensecategory CASCADE;")
    op.execute("DROP TYPE IF EXISTS paymentmethod CASCADE;") 