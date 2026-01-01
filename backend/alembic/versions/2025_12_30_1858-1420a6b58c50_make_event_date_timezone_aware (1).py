"""make event_date timezone aware

Revision ID: 1420a6b58c50
Revises: fix_sched_evt_enum
Create Date: 2025-12-30 18:58:31.246543+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1420a6b58c50'
down_revision = 'fix_sched_evt_enum'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make event_date timezone-aware
    op.alter_column(
        'scheduled_events',
        'event_date',
        existing_type=sa.DateTime(timezone=False),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using='event_date AT TIME ZONE \'UTC\''
    )

    # ✅ Fix for event_time casting
    op.alter_column(
        'scheduled_events',
        'event_time',
        existing_type=sa.String(length=100),  # adjust if it was VARCHAR
        type_=sa.Time(timezone=False),
        existing_nullable=True,
        postgresql_using='event_time::time without time zone'
    )


def downgrade() -> None:
    # Revert event_date
    op.alter_column(
        'scheduled_events',
        'event_date',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
        existing_nullable=False,
        postgresql_using='event_date'
    )

    # Revert event_time
    op.alter_column(
        'scheduled_events',
        'event_time',
        existing_type=sa.Time(timezone=False),
        type_=sa.String(length=100),
        existing_nullable=True,
        postgresql_using='event_time::text'
    )

    