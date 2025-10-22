-- Drop existing tables with CASCADE
DROP TABLE IF EXISTS night_actions CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS game_actions CASCADE;
DROP TABLE IF EXISTS games CASCADE;

-- Create games table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_code TEXT NOT NULL UNIQUE,
    host_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    settings JSONB NOT NULL,
    current_phase TEXT NOT NULL DEFAULT 'waiting',
    phase_timer INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    is_alive BOOLEAN DEFAULT TRUE NOT NULL,
    is_host BOOLEAN DEFAULT FALSE NOT NULL,
    is_sheriff BOOLEAN DEFAULT FALSE NOT NULL,
    has_shield BOOLEAN,
    action_used BOOLEAN,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT,
    player_name TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'player',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create votes table
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create night_actions table
CREATE TABLE night_actions (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    target_id TEXT,
    action_type TEXT NOT NULL,
    data JSONB,
    phase TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);