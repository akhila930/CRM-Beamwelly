"""Add leave management tables

Revision ID: 4a4234f89d71
Revises: 3a3234f89d70
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4a4234f89d71'
down_revision = '3a3234f89d70'
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing enum types if they exist
    connection = op.get_bind()
    connection.execute(sa.text('DROP TYPE IF EXISTS leavetype CASCADE;'))
    connection.execute(sa.text('DROP TYPE IF EXISTS leavestatus CASCADE;'))
    
    # Create enum types
    connection.execute(sa.text("CREATE TYPE leavetype AS ENUM ('casual', 'sick', 'annual', 'unpaid', 'other');"))
    connection.execute(sa.text("CREATE TYPE leavestatus AS ENUM ('pending', 'approved', 'rejected');"))
    
    # Create leave_requests table
    op.create_table('leave_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('leave_type', postgresql.ENUM('casual', 'sick', 'annual', 'unpaid', 'other', name='leavetype', create_type=False), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'approved', 'rejected', name='leavestatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create leave_balances table
    op.create_table('leave_balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('casual_leave', sa.Integer(), nullable=False, default=12),
        sa.Column('sick_leave', sa.Integer(), nullable=False, default=15),
        sa.Column('annual_leave', sa.Integer(), nullable=False, default=20),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id', 'year', name='unique_employee_year')
    )

def downgrade():
    op.drop_table('leave_balances')
    op.drop_table('leave_requests')
    connection = op.get_bind()
    connection.execute(sa.text('DROP TYPE IF EXISTS leavetype CASCADE;'))
    connection.execute(sa.text('DROP TYPE IF EXISTS leavestatus CASCADE;')) 