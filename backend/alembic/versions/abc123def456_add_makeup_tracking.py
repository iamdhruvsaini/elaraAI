"""Add makeup session tracking fields

Revision ID: abc123def456
Revises: 04b17b73ea1a
Create Date: 2026-01-07 11:45:23.123456

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = '04b17b73ea1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add fields for enhanced makeup session functionality.
    Uses batch operations with IF NOT EXISTS logic for PostgreSQL.
    """
    
    # Get connection to check if we're in online or offline mode
    conn = op.get_bind()
    
    # ═══════════════════════════════════════════════════════════════
    # MAKEUP_SESSIONS TABLE - Add columns with IF NOT EXISTS
    # ═══════════════════════════════════════════════════════════════
    
    # For PostgreSQL, we can use raw SQL with IF NOT EXISTS
    if conn.dialect.name == 'postgresql':
        # Use raw SQL for columns that might exist
        conn.execute(sa.text("""
            DO $$ 
            BEGIN
                -- Add makeup_plan column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='makeup_plan'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN makeup_plan JSONB;
                END IF;
                
                -- Add total_steps column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='total_steps'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN total_steps INTEGER NOT NULL DEFAULT 0;
                END IF;
                
                -- Add current_step column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='current_step'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN current_step INTEGER NOT NULL DEFAULT 1;
                END IF;
                
                -- Add steps_completed column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='steps_completed'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN steps_completed INTEGER[] NOT NULL DEFAULT '{}';
                END IF;
                
                -- Add status column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='status'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft';
                END IF;
                
                -- Add completed_at column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='makeup_sessions' AND column_name='completed_at'
                ) THEN
                    ALTER TABLE makeup_sessions ADD COLUMN completed_at TIMESTAMPTZ;
                END IF;
            END $$;
        """))
        
        # Create indexes if they don't exist
        conn.execute(sa.text("""
            CREATE INDEX IF NOT EXISTS ix_makeup_sessions_status 
            ON makeup_sessions (status);
            
            CREATE INDEX IF NOT EXISTS ix_makeup_sessions_user_status 
            ON makeup_sessions (user_id, status);
        """))
    else:
        # Fallback for other databases (will fail if columns exist)
        op.add_column('makeup_sessions', sa.Column('makeup_plan', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
        op.add_column('makeup_sessions', sa.Column('total_steps', sa.Integer(), nullable=False, server_default='0'))
        op.add_column('makeup_sessions', sa.Column('current_step', sa.Integer(), nullable=False, server_default='1'))
        op.add_column('makeup_sessions', sa.Column('steps_completed', postgresql.ARRAY(sa.Integer()), nullable=False, server_default='{}'))
        op.add_column('makeup_sessions', sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'))
        op.add_column('makeup_sessions', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
        op.create_index('ix_makeup_sessions_status', 'makeup_sessions', ['status'])
        op.create_index('ix_makeup_sessions_user_status', 'makeup_sessions', ['user_id', 'status'])
    
    # ═══════════════════════════════════════════════════════════════
    # VANITY_PRODUCTS TABLE
    # ═══════════════════════════════════════════════════════════════
    
    if conn.dialect.name == 'postgresql':
        conn.execute(sa.text("""
            DO $$ 
            BEGIN
                -- Add safety_warnings column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='safety_warnings'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN safety_warnings TEXT[];
                END IF;
                
                -- Add is_safe_for_user column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='is_safe_for_user'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN is_safe_for_user BOOLEAN NOT NULL DEFAULT true;
                END IF;
                
                -- Add expiry_date column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='expiry_date'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN expiry_date TIMESTAMPTZ;
                END IF;
                
                -- Add last_used column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='last_used'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN last_used TIMESTAMPTZ;
                END IF;
                
                -- Add shade column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='shade'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN shade VARCHAR(100);
                END IF;
                
                -- Add finish column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='finish'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN finish VARCHAR(50);
                END IF;
                
                -- Add is_high_end column
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='vanity_products' AND column_name='is_high_end'
                ) THEN
                    ALTER TABLE vanity_products ADD COLUMN is_high_end BOOLEAN NOT NULL DEFAULT false;
                END IF;
            END $$;
        """))
        
        # Create indexes
        conn.execute(sa.text("""
            CREATE INDEX IF NOT EXISTS ix_vanity_products_safe 
            ON vanity_products (user_id, is_safe_for_user);
            
            CREATE INDEX IF NOT EXISTS ix_vanity_products_expiry 
            ON vanity_products (expiry_date);
        """))
    else:
        op.add_column('vanity_products', sa.Column('safety_warnings', postgresql.ARRAY(sa.String()), nullable=True))
        op.add_column('vanity_products', sa.Column('is_safe_for_user', sa.Boolean(), nullable=False, server_default='true'))
        op.add_column('vanity_products', sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True))
        op.add_column('vanity_products', sa.Column('last_used', sa.DateTime(timezone=True), nullable=True))
        op.add_column('vanity_products', sa.Column('shade', sa.String(length=100), nullable=True))
        op.add_column('vanity_products', sa.Column('finish', sa.String(length=50), nullable=True))
        op.add_column('vanity_products', sa.Column('is_high_end', sa.Boolean(), nullable=False, server_default='false'))
        op.create_index('ix_vanity_products_safe', 'vanity_products', ['user_id', 'is_safe_for_user'])
        op.create_index('ix_vanity_products_expiry', 'vanity_products', ['expiry_date'])
    
    # ═══════════════════════════════════════════════════════════════
    # USER_STYLE_SESSIONS TABLE
    # ═══════════════════════════════════════════════════════════════
    
    if conn.dialect.name == 'postgresql':
        conn.execute(sa.text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='user_style_sessions' AND column_name='formality_level'
                ) THEN
                    ALTER TABLE user_style_sessions ADD COLUMN formality_level VARCHAR(50) DEFAULT 'casual';
                END IF;
            END $$;
        """))
    else:
        op.add_column('user_style_sessions', sa.Column('formality_level', sa.String(length=50), nullable=True, server_default='casual'))
    
    # ═══════════════════════════════════════════════════════════════
    # USER_PROFILES TABLE
    # ═══════════════════════════════════════════════════════════════
    
    if conn.dialect.name == 'postgresql':
        conn.execute(sa.text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='user_profiles' AND column_name='eye_color'
                ) THEN
                    ALTER TABLE user_profiles ADD COLUMN eye_color VARCHAR(50);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='user_profiles' AND column_name='hair_color'
                ) THEN
                    ALTER TABLE user_profiles ADD COLUMN hair_color VARCHAR(50);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='user_profiles' AND column_name='preferred_coverage'
                ) THEN
                    ALTER TABLE user_profiles ADD COLUMN preferred_coverage VARCHAR(50) DEFAULT 'medium';
                END IF;
            END $$;
        """))
    else:
        op.add_column('user_profiles', sa.Column('eye_color', sa.String(length=50), nullable=True))
        op.add_column('user_profiles', sa.Column('hair_color', sa.String(length=50), nullable=True))
        op.add_column('user_profiles', sa.Column('preferred_coverage', sa.String(length=50), nullable=True, server_default='medium'))


def downgrade() -> None:
    """
    Remove all added fields (rollback migration).
    Only drops columns if they exist.
    """
    conn = op.get_bind()
    
    if conn.dialect.name == 'postgresql':
        # Drop columns safely with IF EXISTS
        conn.execute(sa.text("""
            -- USER_PROFILES
            ALTER TABLE user_profiles DROP COLUMN IF EXISTS preferred_coverage;
            ALTER TABLE user_profiles DROP COLUMN IF EXISTS hair_color;
            ALTER TABLE user_profiles DROP COLUMN IF EXISTS eye_color;
            
            -- USER_STYLE_SESSIONS
            ALTER TABLE user_style_sessions DROP COLUMN IF EXISTS formality_level;
            
            -- VANITY_PRODUCTS
            DROP INDEX IF EXISTS ix_vanity_products_expiry;
            DROP INDEX IF EXISTS ix_vanity_products_safe;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS is_high_end;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS finish;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS shade;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS last_used;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS expiry_date;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS is_safe_for_user;
            ALTER TABLE vanity_products DROP COLUMN IF EXISTS safety_warnings;
            
            -- MAKEUP_SESSIONS
            DROP INDEX IF EXISTS ix_makeup_sessions_user_status;
            DROP INDEX IF EXISTS ix_makeup_sessions_status;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS completed_at;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS status;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS steps_completed;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS current_step;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS total_steps;
            ALTER TABLE makeup_sessions DROP COLUMN IF EXISTS makeup_plan;
        """))
    else:
        # Fallback for other databases
        op.drop_column('user_profiles', 'preferred_coverage')
        op.drop_column('user_profiles', 'hair_color')
        op.drop_column('user_profiles', 'eye_color')
        op.drop_column('user_style_sessions', 'formality_level')
        op.drop_index('ix_vanity_products_expiry', table_name='vanity_products')
        op.drop_index('ix_vanity_products_safe', table_name='vanity_products')
        op.drop_column('vanity_products', 'is_high_end')
        op.drop_column('vanity_products', 'finish')
        op.drop_column('vanity_products', 'shade')
        op.drop_column('vanity_products', 'last_used')
        op.drop_column('vanity_products', 'expiry_date')
        op.drop_column('vanity_products', 'is_safe_for_user')
        op.drop_column('vanity_products', 'safety_warnings')
        op.drop_index('ix_makeup_sessions_user_status', table_name='makeup_sessions')
        op.drop_index('ix_makeup_sessions_status', table_name='makeup_sessions')
        op.drop_column('makeup_sessions', 'completed_at')
        op.drop_column('makeup_sessions', 'status')
        op.drop_column('makeup_sessions', 'steps_completed')
        op.drop_column('makeup_sessions', 'current_step')
        op.drop_column('makeup_sessions', 'total_steps')
        op.drop_column('makeup_sessions', 'makeup_plan')