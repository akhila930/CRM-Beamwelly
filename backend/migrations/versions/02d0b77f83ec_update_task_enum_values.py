"""update_task_enum_values

Revision ID: 02d0b77f83ec
Revises: 81c495d59ee7
Create Date: 2024-03-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '02d0b77f83ec'
down_revision = '81c495d59ee7'
branch_labels = None
depends_on = None

def upgrade():
    # Create new enums
    new_task_priority = postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='taskpriority_new')
    new_task_status = postgresql.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='taskstatus_new')
    
    # Create new enums
    new_task_priority.create(op.get_bind(), checkfirst=True)
    new_task_status.create(op.get_bind(), checkfirst=True)
    
    # Drop default values
    op.execute("ALTER TABLE tasks ALTER COLUMN priority DROP DEFAULT")
    op.execute("ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT")
    
    # Update existing data
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN priority TYPE taskpriority_new 
        USING (CASE 
            WHEN priority = 'low' THEN 'LOW'::taskpriority_new
            WHEN priority = 'medium' THEN 'MEDIUM'::taskpriority_new
            WHEN priority = 'high' THEN 'HIGH'::taskpriority_new
            ELSE 'MEDIUM'::taskpriority_new
        END)
    """)
    
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN status TYPE taskstatus_new 
        USING (CASE 
            WHEN status = 'pending' THEN 'PENDING'::taskstatus_new
            WHEN status = 'in-progress' THEN 'IN_PROGRESS'::taskstatus_new
            WHEN status = 'completed' THEN 'COMPLETED'::taskstatus_new
            WHEN status = 'cancelled' THEN 'CANCELLED'::taskstatus_new
            ELSE 'PENDING'::taskstatus_new
        END)
    """)
    
    # Drop old enums
    op.execute("DROP TYPE IF EXISTS taskpriority")
    op.execute("DROP TYPE IF EXISTS taskstatus")
    
    # Rename new enums to old names
    op.execute("ALTER TYPE taskpriority_new RENAME TO taskpriority")
    op.execute("ALTER TYPE taskstatus_new RENAME TO taskstatus")
    
    # Add back default values
    op.execute("ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'MEDIUM'::taskpriority")
    op.execute("ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'PENDING'::taskstatus")

def downgrade():
    # Create old enums
    old_task_priority = postgresql.ENUM('low', 'medium', 'high', name='taskpriority_old')
    old_task_status = postgresql.ENUM('pending', 'in-progress', 'completed', 'cancelled', name='taskstatus_old')
    
    # Create old enums
    old_task_priority.create(op.get_bind(), checkfirst=True)
    old_task_status.create(op.get_bind(), checkfirst=True)
    
    # Drop default values
    op.execute("ALTER TABLE tasks ALTER COLUMN priority DROP DEFAULT")
    op.execute("ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT")
    
    # Update existing data
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN priority TYPE taskpriority_old 
        USING (CASE 
            WHEN priority = 'LOW' THEN 'low'::taskpriority_old
            WHEN priority = 'MEDIUM' THEN 'medium'::taskpriority_old
            WHEN priority = 'HIGH' THEN 'high'::taskpriority_old
            ELSE 'medium'::taskpriority_old
        END)
    """)
    
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN status TYPE taskstatus_old 
        USING (CASE 
            WHEN status = 'PENDING' THEN 'pending'::taskstatus_old
            WHEN status = 'IN_PROGRESS' THEN 'in-progress'::taskstatus_old
            WHEN status = 'COMPLETED' THEN 'completed'::taskstatus_old
            WHEN status = 'CANCELLED' THEN 'cancelled'::taskstatus_old
            ELSE 'pending'::taskstatus_old
        END)
    """)
    
    # Drop new enums
    op.execute("DROP TYPE IF EXISTS taskpriority")
    op.execute("DROP TYPE IF EXISTS taskstatus")
    
    # Rename old enums to original names
    op.execute("ALTER TYPE taskpriority_old RENAME TO taskpriority")
    op.execute("ALTER TYPE taskstatus_old RENAME TO taskstatus")
    
    # Add back default values
    op.execute("ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium'::taskpriority")
    op.execute("ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending'::taskstatus")
