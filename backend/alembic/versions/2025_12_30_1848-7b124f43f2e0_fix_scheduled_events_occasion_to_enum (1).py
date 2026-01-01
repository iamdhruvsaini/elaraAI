"""fix scheduled_events occasion to enum"""
from alembic import op
import sqlalchemy as sa
from app.models.makeup import OccasionType

# revision identifiers, used by Alembic.
revision = 'fix_sched_evt_enum'

down_revision = '09a26d362309'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM type if not exists
    occasion_enum = sa.Enum(
        'daily', 'office', 'party', 'wedding', 'festive',
        'date_night', 'photoshoot', 'other',
        name='occasiontype'
    )
    occasion_enum.create(op.get_bind(), checkfirst=True)

    # Convert string column to enum type
    op.alter_column(
        'scheduled_events',
        'occasion',
        existing_type=sa.String(length=100),
        type_=occasion_enum,
        postgresql_using='occasion::occasiontype'
    )


def downgrade() -> None:
    # Revert enum to string
    op.alter_column(
        'scheduled_events',
        'occasion',
        existing_type=sa.Enum(
            'daily', 'office', 'party', 'wedding', 'festive',
            'date_night', 'photoshoot', 'other',
            name='occasiontype'
        ),
        type_=sa.String(length=100),
        postgresql_using='occasion::text'
    )

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS occasiontype')
