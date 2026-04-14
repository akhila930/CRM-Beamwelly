"""Add feedback tables

Revision ID: 4b4345f9a81
Revises: 3a3234f89d70
Create Date: 2024-03-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4b4345f9a81'
down_revision = '3a3234f89d70'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create employee_feedbacks table
    op.create_table('employee_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_employee_id', sa.Integer(), nullable=False),
        sa.Column('to_employee_id', sa.Integer(), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['from_employee_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['to_employee_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create client_feedbacks table
    op.create_table('client_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_email', sa.String(), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('form_token', sa.String(), nullable=True, unique=True),
        sa.Column('form_expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_submitted', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('client_feedbacks')
    op.drop_table('employee_feedbacks') 