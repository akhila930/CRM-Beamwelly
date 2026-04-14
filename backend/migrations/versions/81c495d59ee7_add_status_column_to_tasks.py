"""add_status_column_to_tasks

Revision ID: 81c495d59ee7
Revises: 409f3da0c492
Create Date: 2024-03-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '81c495d59ee7'
down_revision = '409f3da0c492'
branch_labels = None
depends_on = None

def upgrade():
    # Create TaskStatus enum type
    task_status = postgresql.ENUM('pending', 'in-progress', 'completed', 'cancelled', name='taskstatus')
    task_status.create(op.get_bind())

    # Add status column with default value
    op.add_column('tasks', sa.Column('status', sa.Enum('pending', 'in-progress', 'completed', 'cancelled', name='taskstatus'), nullable=False, server_default='pending'))

def downgrade():
    # Drop the status column
    op.drop_column('tasks', 'status')
    
    # Drop the enum type
    task_status = postgresql.ENUM('pending', 'in-progress', 'completed', 'cancelled', name='taskstatus')
    task_status.drop(op.get_bind())
