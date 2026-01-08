# Netlify + Supabase Deployment Guide

This guide will help you deploy the Werewolf game using Netlify for hosting and Supabase for the database.

## Prerequisites

1. A [Netlify](https://www.netlify.com/) account
2. A [Supabase](https://supabase.com/) account
3. Node.js 20.x installed locally

## Step 1: Set Up Supabase Database

### 1.1 Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in your project details:
   - Name: `werewolf-game`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
4. Wait for the project to be created (takes ~2 minutes)

### 1.2 Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 1.3 Run Database Migrations

1. Create a `.env` file in your project root:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

2. Run the migration script:
   ```bash
   npm run db:setup
   ```

   Or manually run the SQL from `create-tables.sql` in the Supabase SQL Editor:
   - Go to **SQL Editor** in Supabase dashboard
   - Click **New Query**
   - Copy and paste the contents of `create-tables.sql`
   - Click **Run**

## Step 2: Deploy to Netlify

### 2.1 Prepare Your Repository

1. Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### 2.2 Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **Add new site** → **Import an existing project**
3. Choose your Git provider and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/client`
   - **Functions directory**: `netlify/functions`

### 2.3 Set Environment Variables

In Netlify dashboard, go to **Site settings** → **Environment variables** and add:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
NODE_ENV=production
```

### 2.4 Deploy

1. Click **Deploy site**
2. Wait for the build to complete
3. Your site will be live at `https://your-site-name.netlify.app`

## Important Notes About WebSockets

⚠️ **WebSocket Limitation**: Netlify Functions don't support WebSocket connections natively. For real-time game functionality, you have two options:

### Option A: Use Supabase Realtime (Recommended)

Supabase provides built-in realtime functionality that can replace WebSockets:

1. Enable Realtime in Supabase:
   - Go to **Database** → **Replication**
   - Enable replication for your tables: `games`, `players`, `chat_messages`, `votes`, `night_actions`

2. Update your client code to use Supabase Realtime instead of WebSockets:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
   
   // Subscribe to changes
   supabase
     .channel('game-updates')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
       // Handle game updates
     })
     .subscribe()
   ```

### Option B: Use a Separate WebSocket Service

Deploy the WebSocket server separately on a platform that supports WebSockets:

1. **Railway** (Recommended for WebSockets)
   - Deploy the server folder to Railway
   - Set the `DATABASE_URL` environment variable
   - Railway provides a WebSocket-compatible URL

2. **Render**
   - Create a new Web Service
   - Connect your repository
   - Set build command: `npm run build:server`
   - Set start command: `npm start`

3. **Heroku**
   - Create a new app
   - Add Heroku Postgres addon or use your Supabase URL
   - Deploy using Git

Then update your Netlify frontend to connect to the separate WebSocket server URL.

## Step 3: Configure Client for Production

Update your client WebSocket connection to point to your WebSocket server:

```typescript
// In client/src/lib/websocket.ts or similar
const WS_URL = import.meta.env.PROD 
  ? 'wss://your-websocket-server.railway.app' 
  : 'ws://localhost:5000';
```

## Recommended Architecture

For the best setup with Netlify + Supabase:

```
┌─────────────────┐
│   Netlify       │  ← Static frontend (React app)
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │   Railway       │
│   (Database +   │  │   (WebSocket    │
│    Realtime)    │  │    Server)      │
└─────────────────┘  └─────────────────┘
```

## Testing Your Deployment

1. Visit your Netlify URL
2. Create a game
3. Join with multiple players (open in different browsers/incognito windows)
4. Test game functionality

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct in Netlify environment variables
- Check Supabase project is not paused (free tier pauses after inactivity)
- Ensure SSL is enabled in connection string

### Build Failures
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version matches (20.x)

### WebSocket Not Working
- Remember: Netlify doesn't support WebSockets
- Use Supabase Realtime or deploy WebSocket server separately
- Check CORS settings if using separate WebSocket server

## Cost Considerations

- **Netlify**: Free tier includes 100GB bandwidth/month
- **Supabase**: Free tier includes 500MB database, 2GB bandwidth
- **Railway** (if used for WebSockets): $5/month for hobby plan

## Alternative: Full Deployment on Railway

If you want everything in one place with WebSocket support:

1. Deploy entire app to Railway
2. Add PostgreSQL database (or use Supabase URL)
3. Railway handles both frontend and WebSocket connections
4. See `RAILWAY_DEPLOYMENT.md` for details

## Support

For issues specific to:
- Netlify deployment: Check [Netlify docs](https://docs.netlify.com/)
- Supabase setup: Check [Supabase docs](https://supabase.com/docs)
- Game functionality: Open an issue in the repository
