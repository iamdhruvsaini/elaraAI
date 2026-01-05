"""Add enhanced skin analysis fields

Revision ID: e220fdf6113b
Revises: 1420a6b58c50
Create Date: 2026-01-05 07:20:45.758195+00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON  


# revision identifiers, used by Alembic.
revision = 'e220fdf6113b'
down_revision = '1420a6b58c50'
branch_labels = None
depends_on = None


def upgrade():
    """Add enhanced skin analysis fields to user_profiles table"""
    
    # ==================== BASIC SKIN ANALYSIS ====================
    op.add_column('user_profiles', 
        sa.Column('skin_tone_hex', sa.String(10), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('fitzpatrick_scale', sa.String(20), nullable=True))
    
    # ==================== DETAILED SKIN METRICS ====================
    op.add_column('user_profiles', 
        sa.Column('texture_score', sa.Float(), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('hydration_level', sa.String(20), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('oil_level', sa.String(20), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('pore_size', sa.String(20), nullable=True))
    
    # ==================== FACE ANALYSIS ====================
    op.add_column('user_profiles', 
        sa.Column('face_shape', sa.String(50), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('facial_features', JSON, nullable=True, server_default='{}'))
    
    # ==================== ALLERGY/PREFERENCE FIELDS ====================
    op.add_column('user_profiles', 
        sa.Column('ingredient_preferences', JSON, nullable=True, server_default='[]'))
    
    op.add_column('user_profiles', 
        sa.Column('avoid_ingredients', JSON, nullable=True, server_default='[]'))
    
    # ==================== ANALYSIS METADATA ====================
    op.add_column('user_profiles', 
        sa.Column('last_analysis_date', sa.DateTime(timezone=True), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('analysis_confidence', sa.Float(), nullable=True))
    
    op.add_column('user_profiles', 
        sa.Column('analysis_version', sa.String(20), nullable=True))
    
    # ==================== ADDITIONAL STATS ====================
    op.add_column('user_profiles', 
        sa.Column('favorite_looks_count', sa.Integer(), nullable=True, server_default='0'))
    
    # ==================== CREATE INDEXES ====================
    op.create_index('idx_user_profiles_skin_tone', 'user_profiles', ['skin_tone'], unique=False)
    op.create_index('idx_user_profiles_skin_type', 'user_profiles', ['skin_type'], unique=False)
    op.create_index('idx_user_profiles_fitzpatrick', 'user_profiles', ['fitzpatrick_scale'], unique=False)
    op.create_index('idx_user_profiles_analysis_date', 'user_profiles', ['last_analysis_date'], unique=False)


def downgrade():
    """Remove enhanced skin analysis fields"""
    
    # Drop indexes first
    op.drop_index('idx_user_profiles_analysis_date', table_name='user_profiles')
    op.drop_index('idx_user_profiles_fitzpatrick', table_name='user_profiles')
    op.drop_index('idx_user_profiles_skin_type', table_name='user_profiles')
    op.drop_index('idx_user_profiles_skin_tone', table_name='user_profiles')
    
    # Drop columns
    op.drop_column('user_profiles', 'favorite_looks_count')
    op.drop_column('user_profiles', 'analysis_version')
    op.drop_column('user_profiles', 'analysis_confidence')
    op.drop_column('user_profiles', 'last_analysis_date')
    op.drop_column('user_profiles', 'avoid_ingredients')
    op.drop_column('user_profiles', 'ingredient_preferences')
    op.drop_column('user_profiles', 'facial_features')
    op.drop_column('user_profiles', 'face_shape')
    op.drop_column('user_profiles', 'pore_size')
    op.drop_column('user_profiles', 'oil_level')
    op.drop_column('user_profiles', 'hydration_level')
    op.drop_column('user_profiles', 'texture_score')
    op.drop_column('user_profiles', 'fitzpatrick_scale')
    op.drop_column('user_profiles', 'skin_tone_hex')