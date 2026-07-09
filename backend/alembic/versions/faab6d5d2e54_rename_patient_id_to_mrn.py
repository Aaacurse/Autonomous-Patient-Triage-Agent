"""rename patient_id to mrn on triage_sessions

Revision ID: faab6d5d2e54
Revises: 62a666da603b
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'faab6d5d2e54'
down_revision: Union[str, None] = '62a666da603b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('triage_sessions', 'patient_id', new_column_name='mrn')
    op.create_index(op.f('ix_triage_sessions_mrn'), 'triage_sessions', ['mrn'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_triage_sessions_mrn'), table_name='triage_sessions')
    op.alter_column('triage_sessions', 'mrn', new_column_name='patient_id')