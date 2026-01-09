# Deploy Error Logs Database Table

## Overview
Error logging has been upgraded from localStorage to Supabase database for persistent, shareable error tracking with resolution management.

## Step 1: Create Database Table

Run the SQL migration in your Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/lfexxmccwzfvlmwgqgdq/sql/new
2. Copy and paste the contents of: `supabase/migrations/create_error_logs_table.sql`
3. Click "Run" to execute

Or use Supabase CLI:
```bash
supabase db push
```

## Step 2: Verify Table Creation

Check that the table was created:
```sql
SELECT * FROM error_logs LIMIT 1;
```

## Features

### Database-Backed Error Logging
- ✅ Persistent storage in Supabase
- ✅ Cross-device access
- ✅ Team collaboration
- ✅ Real-time updates via Supabase Realtime
- ✅ Automatic timestamp tracking
- ✅ Resolution tracking with dates

### Error Status Management
- **new** - Newly logged errors
- **investigating** - Errors being worked on
- **resolved** - Fixed errors (with resolution date)
- **ignored** - Errors that won't be fixed

### Error Context
Each error log includes:
- Error message and details
- Stack trace
- Source (client, edge-function, database, network)
- Function name
- Game code and player ID (when available)
- URL and user agent
- Timestamps (created, updated, resolved)

### Industry Best Practices
- ✅ Persistent storage (database)
- ✅ Status workflow (new → investigating → resolved)
- ✅ Resolution tracking with timestamps
- ✅ Notes field for investigation notes
- ✅ Automatic cleanup (30+ day old errors)
- ✅ Export functionality for reporting

## Migration from localStorage

Existing localStorage errors will be preserved as fallback. New errors will be saved to the database. To migrate old errors:

1. Export from localStorage (if needed)
2. New errors automatically go to database
3. Old localStorage errors remain as fallback until cleared

## Usage

Errors are automatically logged when:
- Edge Functions fail
- Network requests fail
- Game state fetch fails
- Any error occurs in useGameState hook

View errors at: `/error-logs`

## Database Schema

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE,
  message TEXT NOT NULL,
  details TEXT,
  source TEXT CHECK (source IN ('client', 'edge-function', 'database', 'network')),
  function_name TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  notes TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  game_code TEXT,
  player_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```
