-- Create error_logs table for persistent error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  source TEXT NOT NULL CHECK (source IN ('client', 'edge-function', 'database', 'network')),
  function_name TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  notes TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  game_code TEXT,
  player_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_game_code ON error_logs(game_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_function_name ON error_logs(function_name);

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read error logs (for debugging)
CREATE POLICY "Allow public read access to error logs"
  ON error_logs FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert error logs
CREATE POLICY "Allow public insert access to error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update error logs (for status changes)
CREATE POLICY "Allow public update access to error logs"
  ON error_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete error logs
CREATE POLICY "Allow public delete access to error logs"
  ON error_logs FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_logs_updated_at();
