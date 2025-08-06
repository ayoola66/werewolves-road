-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id SERIAL PRIMARY KEY,
  game_code TEXT NOT NULL,
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

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
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

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'player',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create night_actions table
CREATE TABLE IF NOT EXISTS public.night_actions (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  target_id TEXT,
  action_type TEXT NOT NULL,
  data JSONB,
  phase TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
); 