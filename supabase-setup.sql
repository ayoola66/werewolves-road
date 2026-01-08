-- Enable Realtime for all game tables
-- Run this in Supabase SQL Editor after creating tables

-- Enable replication for games table
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Enable replication for players table
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Enable replication for chat_messages table
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Enable replication for votes table
ALTER TABLE votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Enable replication for night_actions table
ALTER TABLE night_actions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE night_actions;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_game_code ON games(game_code);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_votes_game_id ON votes(game_id);
CREATE INDEX IF NOT EXISTS idx_night_actions_game_id ON night_actions(game_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- These policies allow all operations for now - customize based on your requirements

-- Games policies
CREATE POLICY "Allow all operations on games" ON games
  FOR ALL USING (true) WITH CHECK (true);

-- Players policies
CREATE POLICY "Allow all operations on players" ON players
  FOR ALL USING (true) WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Votes policies
CREATE POLICY "Allow all operations on votes" ON votes
  FOR ALL USING (true) WITH CHECK (true);

-- Night actions policies
CREATE POLICY "Allow all operations on night_actions" ON night_actions
  FOR ALL USING (true) WITH CHECK (true);
