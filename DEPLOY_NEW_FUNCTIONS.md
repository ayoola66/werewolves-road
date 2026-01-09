# 🚀 Deploy New Edge Functions: leave-game & start-voting

## Quick Deployment Guide

Two new Edge Functions have been created and need to be deployed:
- `leave-game` - Allows players to leave games
- `start-voting` - Allows players to manually start voting phase

---

## Option 1: Deploy via Supabase CLI (Recommended)

### Quick Deploy Script

I've created a deployment script for you! Just run:

```bash
# Step 1: Login (opens browser - run this in your terminal)
supabase login

# Step 2: Run the deployment script
./deploy-functions.sh
```

### Manual Deploy Steps

If you prefer to deploy manually:

**Step 1: Login to Supabase**
```bash
supabase login
```
This will open your browser to authenticate.

**Step 2: Deploy the Functions**
From the project root, run:

```bash
# Deploy leave-game function
supabase functions deploy leave-game --project-ref lfexxmccwzfvlmwgqgdq

# Deploy start-voting function
supabase functions deploy start-voting --project-ref lfexxmccwzfvlmwgqgdq
```

### Step 3: Verify Deployment
After deployment, your functions will be available at:
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/leave-game`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/start-voting`

---

## Option 2: Manual Deployment via Supabase Dashboard

If you prefer to deploy manually via the dashboard:

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/lfexxmccwzfvlmwgqgdq/functions

### Step 2: Deploy leave-game Function

1. Click **"Create a new function"**
2. **Function Name:** `leave-game`
3. **Code:** Copy the entire contents of `supabase/functions-standalone/leave-game.ts`
4. Click **"Deploy"**

### Step 3: Deploy start-voting Function

1. Click **"Create a new function"** (or "New Function")
2. **Function Name:** `start-voting`
3. **Code:** Copy the entire contents of `supabase/functions-standalone/start-voting.ts`
4. Click **"Deploy"**

---

## ✅ Verification

After deployment, test the functions:

### Test leave-game:
```bash
curl -X POST https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/leave-game \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"gameCode":"TEST01","playerId":"test-player-id"}'
```

### Test start-voting:
```bash
curl -X POST https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/start-voting \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"gameCode":"TEST01","playerId":"test-player-id"}'
```

---

## 📋 Function Details

### leave-game Function
- **Purpose:** Removes a player from a game
- **Input:** `{ gameCode: string, playerId: string }`
- **Output:** `{ success: boolean, message?: string }`
- **Validations:**
  - Game must exist
  - Player must exist in game
- **Actions:**
  - Deletes player from players table
  - Adds system message to chat

### start-voting Function
- **Purpose:** Transitions game from "day" phase to "voting" phase
- **Input:** `{ gameCode: string, playerId: string }`
- **Output:** `{ success: boolean, message?: string, phase: string, timer: number }`
- **Validations:**
  - Game must be in "day" phase
  - Game status must be "playing"
  - Player must be alive
- **Actions:**
  - Updates game phase to "voting"
  - Sets phase timer and end time
  - Adds system message to chat

---

## 🎯 Next Steps

After deploying both functions:

1. **Test in your app** - Create a game and test leaving
2. **Test voting** - Start a game, get to day phase, test start voting button
3. **Monitor logs** - Check Supabase dashboard for any errors

---

## 📝 Notes

- Both functions use the service role key automatically (set in Supabase environment)
- Functions include CORS headers for Netlify deployment
- Error handling is comprehensive with user-friendly messages
- Functions follow the same pattern as existing Edge Functions

---

**Deployment Status:** Ready to deploy ✅
**Standalone Files:** Created in `supabase/functions-standalone/`
**Source Files:** Located in `supabase/functions/leave-game/` and `supabase/functions/start-voting/`
