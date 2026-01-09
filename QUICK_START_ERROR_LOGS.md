# Quick Start: Error Logs Database Setup

## ⚡ Quick Setup (2 minutes)

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/lfexxmccwzfvlmwgqgdq/sql/new

2. **Copy & Paste SQL:**
   - Open file: `supabase/migrations/create_error_logs_table.sql`
   - Copy ALL the SQL content
   - Paste into Supabase SQL Editor
   - Click **"Run"** button

3. **Verify:**
   - Check that table was created: `SELECT COUNT(*) FROM error_logs;`
   - Should return `0` (no errors yet)

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI configured
supabase db push
```

## ✅ What This Does

Creates a persistent `error_logs` table in Supabase with:
- ✅ Full error tracking (message, stack, details)
- ✅ Status management (new → investigating → resolved → ignored)
- ✅ Resolution tracking with timestamps
- ✅ Game context (game_code, player_id)
- ✅ Real-time updates
- ✅ Automatic cleanup (30+ day old errors)

## 🎯 After Setup

1. **Errors automatically log to database** - No code changes needed
2. **View errors at:** `/error-logs`
3. **Mark as resolved** - Click checkmark on any error
4. **Add notes** - Click details icon to add investigation notes
5. **Export** - Download JSON for reporting

## 📊 Features

- **Persistent** - Survives browser clears, works across devices
- **Collaborative** - Team can see and resolve errors together
- **Trackable** - Resolution dates, notes, status workflow
- **Searchable** - Filter by status, source, function, game code
- **Exportable** - Download for reporting/analysis

---

**That's it!** Error logging is now database-backed and ready to use.
