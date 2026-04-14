"""fix_employee_feedback_foreign_keys

Revision ID: f0efd79cb4ef
Revises: 7927607feffd
Create Date: 2024-04-29 13:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f0efd79cb4ef'
down_revision: Union[str, None] = '7927607feffd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints
    op.drop_constraint('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    op.drop_constraint('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    
    # Create new foreign key constraints pointing to users table
    op.create_foreign_key('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', 'users', ['from_employee_id'], ['id'])
    op.create_foreign_key('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', 'users', ['to_employee_id'], ['id'])


def downgrade() -> None:
    # Drop the new foreign key constraints
    op.drop_constraint('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    op.drop_constraint('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', type_='foreignkey')
    
    # Recreate the original foreign key constraints
    op.create_foreign_key('employee_feedbacks_from_employee_id_fkey', 'employee_feedbacks', 'employees', ['from_employee_id'], ['id'])
    op.create_foreign_key('employee_feedbacks_to_employee_id_fkey', 'employee_feedbacks', 'employees', ['to_employee_id'], ['id'])
