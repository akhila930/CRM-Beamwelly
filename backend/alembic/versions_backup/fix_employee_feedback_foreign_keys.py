"""fix employee feedback foreign keys

Revision ID: fix_employee_feedback_fk
Revises: aef3064e94c7
Create Date: 2024-04-30 04:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_employee_feedback_fk'
down_revision = 'aef3064e94c7'
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing foreign key constraints
    op.drop_constraint('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    op.drop_constraint('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    
    # Add new foreign key constraints pointing to employees table
    op.create_foreign_key(
        'employee_feedbacks_from_employee_id_fkey',
        'employee_feedbacks', 'employees',
        ['from_employee_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'employee_feedbacks_to_employee_id_fkey',
        'employee_feedbacks', 'employees',
        ['to_employee_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade():
    # Drop new foreign key constraints
    op.drop_constraint('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    op.drop_constraint('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    
    # Recreate old foreign key constraints
    op.create_foreign_key(
        'employee_feedbacks_from_employee_id_fkey',
        'employee_feedbacks', 'users',
        ['from_employee_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'employee_feedbacks_to_employee_id_fkey',
        'employee_feedbacks', 'users',
        ['to_employee_id'], ['id'],
        ondelete='CASCADE'
    ) 