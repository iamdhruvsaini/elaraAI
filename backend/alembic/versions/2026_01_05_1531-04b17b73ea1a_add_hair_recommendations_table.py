"""add hair recommendations table

Revision ID: 04b17b73ea1a
Revises: e220fdf6113b
Create Date: 2026-01-05 15:31:57.386469+00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '04b17b73ea1a'
down_revision = 'e220fdf6113b'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create hair_recommendations table
    op.create_table(
        'hair_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('outfit_description', sa.Text(), nullable=False),
        sa.Column('outfit_style', sa.String(length=100), nullable=True),
        sa.Column('occasion', sa.String(length=100), nullable=False),
        sa.Column('face_shape', sa.String(length=50), nullable=True),
        sa.Column('hair_texture', sa.String(length=50), nullable=True),
        sa.Column('hair_length', sa.String(length=50), nullable=True),
        sa.Column('recommended_style', sa.String(length=200), nullable=True),
        sa.Column('style_attributes', sa.JSON(), nullable=True),
        sa.Column('reasoning', sa.JSON(), nullable=True),
        sa.Column('alternatives', sa.JSON(), nullable=True),
        sa.Column('styling_tips', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_hair_recommendations_id'), 
        'hair_recommendations', 
        ['id'], 
        unique=False
    )


def downgrade() -> None:
    # Drop table if rolling back
    op.drop_index(op.f('ix_hair_recommendations_id'), table_name='hair_recommendations')
    op.drop_table('hair_recommendations')