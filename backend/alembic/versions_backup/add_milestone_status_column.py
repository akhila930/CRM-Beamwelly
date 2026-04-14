"""add milestone status column

Revision ID: add_milestone_status_column
Revises: 2dddd5991bab
Create Date: 2023-10-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_milestone_status_column'
down_revision = '2dddd5991bab'
branch_labels = None
depends_on = None


def upgrade():
    # Create the milestonestatus enum type if it doesn't exist
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestonestatus') THEN
            CREATE TYPE milestonestatus AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
        END IF;
    END$$;
    """)
    
    # Add the status column to the milestones table
    op.add_column('milestones', sa.Column('status', sa.Enum('pending', 'in_progress', 'completed', 'cancelled', name='milestonestatus'), nullable=False, server_default='pending'))


def downgrade():
    # Drop the status column from the milestones table
    op.drop_column('milestones', 'status')
    
    # Optionally drop the enum type if no other tables use it
    op.execute("DROP TYPE IF EXISTS milestonestatus;") 