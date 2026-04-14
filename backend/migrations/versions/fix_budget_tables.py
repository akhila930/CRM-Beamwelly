"""Fix budget tables

Revision ID: fix_budget_tables
Revises: d5a255beb7f8
Create Date: 2024-03-21 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_budget_tables'
down_revision = 'd5a255beb7f8'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop existing tables if they exist
    op.execute('DROP TABLE IF EXISTS department_budgets CASCADE')
    op.execute('DROP TABLE IF EXISTS budgets CASCADE')

    # Create budgets table
    op.create_table('budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('total_budget', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Create department_budgets table
    op.create_table('department_budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('spent_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('department_budgets')
    op.drop_table('budgets') 