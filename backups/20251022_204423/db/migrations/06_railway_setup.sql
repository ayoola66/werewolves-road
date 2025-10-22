-- Railway setup migration
-- This ensures all tables exist in the public schema

SET search_path TO public;

-- Create games table if it doesn't exist
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_code TEXT NOT NULL UNIQUE,
    host_id TEXT NOT NULL,
    settings JSONB NOT NULL,
    status TEXT DEFAULT 'lobby',
    current_phase TEXT DEFAULT 'lobby',
    phase_timer TEXT,
    night_count TEXT DEFAULT '0',
    day_count TEXT DEFAULT '0',
    last_phase_change TIMESTAMP DEFAULT NOW(),
    required_actions JSONB DEFAULT '[]',
    completed_actions JSONB DEFAULT '[]',
    phase_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create players table if it doesn't exist
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    is_alive BOOLEAN DEFAULT true,
    is_host BOOLEAN DEFAULT false,
    is_sheriff BOOLEAN DEFAULT false,
    has_shield BOOLEAN,
    action_used BOOLEAN,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create night_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS night_actions (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    target_id TEXT,
    action_type TEXT NOT NULL,
    data JSONB,
    phase TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_actions table if it doesn't exist (for any additional game actions)
CREATE TABLE IF NOT EXISTS game_actions (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
); 