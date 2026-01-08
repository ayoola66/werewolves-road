# Supabase Setup Guide for Werewolf Game

This guide will help you set up Supabase as the backend for your Werewolf game deployed on Netlify.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `werewolf-game` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the sidebar
2. Go to **API** section
3. You'll need two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
4. Save these values - you'll need them later

## Step 3: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Copy the entire contents of `create-tables.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Option B: Using Local Database Connection

1. Create a `.env` file in your project root:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
2. Replace `[YOUR-PASSWORD]` with your database password
3. Replace `[YOUR-PROJECT-REF]` with your project reference (from the Project URL)
4. Run: `npm run db:setup`

## Step 4: Enable Realtime

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-setup.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"**
6. This will:
   - Enable realtime replication for all game tables
   - Create indexes for better performance
   - Set up Row Level Security policies

## Step 5: Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

5. Click **"Save"**
6. Trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

## Step 6: Test Locally (Optional)

1. Create a `.env` file in your project root:
   ```bash
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` and test creating/joining a game

## Step 7: Verify Realtime is Working

1. In Supabase dashboard, go to **Database** → **Replication**
2. You should see all these tables listed:
   - `games`
   - `players`
   - `chat_messages`
   - `votes`
   - `night_actions`
3. Make sure they all have replication enabled (green checkmark)

## Troubleshooting

### "Failed to fetch" errors
- Check that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Make sure the environment variables are set in Netlify
- Redeploy your site after adding environment variables

### Realtime not working
- Verify that you ran `supabase-setup.sql` successfully
- Check that replication is enabled in **Database** → **Replication**
- Make sure Row Level Security policies are set up correctly

### Database connection errors
- Verify your database password is correct
- Check that your IP is not blocked (Supabase allows all IPs by default)
- Make sure you're using the correct connection string format

## Architecture Overview

The app now works as follows:

1. **Frontend (Netlify)**: Static React app
2. **Database (Supabase)**: PostgreSQL database with all game data
3. **Realtime (Supabase)**: Real-time updates via Supabase Realtime (replaces WebSockets)
4. **API (Supabase)**: Direct database queries via Supabase client (replaces REST API)

All game logic now happens client-side with Supabase handling:
- Data persistence
- Real-time synchronization
- Authentication (if needed later)

## Next Steps

Once everything is set up:
1. Your game should be fully functional at `https://your-site.netlify.app`
2. Players can create and join games
3. Real-time updates work via Supabase Realtime
4. All game data is stored in Supabase PostgreSQL

## Security Considerations

The current setup uses permissive RLS policies (`USING (true)`). For production, you should:
1. Implement proper authentication
2. Restrict policies based on player/game ownership
3. Add rate limiting
4. Validate all inputs

For now, the permissive policies allow the game to work without authentication.
