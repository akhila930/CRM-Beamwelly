"""update employee feedback foreign keys

Revision ID: update_employee_feedback_fk
Revises: e3f1d2d1a3f8
Create Date: 2024-04-30 04:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_employee_feedback_fk'
down_revision = 'e3f1d2d1a3f8'
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing foreign key constraints
    op.drop_constraint('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    op.drop_constraint('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    
    # Add new foreign key constraints
    op.create_foreign_key(
        'employee_feedbacks_from_employee_id_fkey',
        'employee_feedbacks', 'users',  # Point to users table for from_employee_id
        ['from_employee_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'employee_feedbacks_to_employee_id_fkey',
        'employee_feedbacks', 'employees',  # Keep pointing to employees table for to_employee_id
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