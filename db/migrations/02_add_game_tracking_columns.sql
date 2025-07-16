-- Add new columns to games table
ALTER TABLE games
ADD COLUMN night_count INTEGER DEFAULT 0,
ADD COLUMN day_count INTEGER DEFAULT 0,
ADD COLUMN last_phase_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN required_actions JSONB DEFAULT '[]',
ADD COLUMN completed_actions JSONB DEFAULT '[]',
ADD COLUMN phase_end_time TIMESTAMP WITH TIME ZONE;

-- Add new columns to players table
ALTER TABLE players
ADD COLUMN has_shield BOOLEAN DEFAULT FALSE,
ADD COLUMN action_used BOOLEAN DEFAULT FALSE; 