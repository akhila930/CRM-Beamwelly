"""Fix leave_requests columns

Revision ID: fix_leave_requests_columns
Revises: be2db1071677
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_leave_requests_columns'
down_revision = 'be2db1071677'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add missing columns to leave_requests table
    op.execute('ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)')
    op.execute('ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT')
    op.execute('ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')

def downgrade() -> None:
    # Remove added columns
    op.execute('ALTER TABLE leave_requests DROP COLUMN IF EXISTS approved_by')
    op.execute('ALTER TABLE leave_requests DROP COLUMN IF EXISTS rejection_reason')
    op.execute('ALTER TABLE leave_requests DROP COLUMN IF EXISTS updated_at') 