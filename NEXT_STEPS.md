# Next Steps for Full Supabase Integration

## What's Been Done ✅

1. **Supabase Client Setup** (`client/src/lib/supabase.ts`)
   - Created comprehensive API functions for all game operations
   - Set up Realtime subscriptions for live updates
   - Functions for: createGame, joinGame, startGame, sendChatMessage, submitVote, submitNightAction

2. **Realtime Hook** (`client/src/hooks/useSupabaseRealtime.ts`)
   - Created hook to replace WebSocket functionality
   - Subscribes to all game-related database changes
   - Provides same interface as useWebSocket for easy migration

3. **Setup Guide** (`SUPABASE_SETUP_GUIDE.md`)
   - Step-by-step instructions for Supabase setup
   - Database migration steps
   - Netlify environment variable configuration

## What Needs to Be Done 🚧

### Critical: Move Game Logic to Client

The current implementation has game logic in `server/services/gameLogic.ts` which won't work on Netlify (no backend server). You need to either:

**Option A: Client-Side Game Logic (Simpler)**
- Move game logic functions to the client
- Handle role assignment, phase transitions, vote counting, etc. in React
- Use Supabase only for data storage and sync

**Option B: Supabase Edge Functions (More Complex)**
- Create Supabase Edge Functions for game logic
- Deploy serverless functions to Supabase
- Keep logic separate from client

### Required Changes

1. **Update `useGameState.ts`** to use Supabase instead of WebSocket:
   ```typescript
   // Replace this:
   import { useWebSocket } from "./useWebSocket";
   
   // With this:
   import { useSupabaseRealtime } from "./useSupabaseRealtime";
   import * as supabaseApi from "@/lib/supabase";
   ```

2. **Replace API calls** in game actions:
   ```typescript
   // Instead of sendMessage("create_game", {...})
   const { game, player } = await supabaseApi.createGame(name, settings);
   
   // Instead of sendMessage("join_game", {...})
   const { game, player } = await supabaseApi.joinGame(code, name);
   
   // Instead of sendMessage("start_game", {...})
   await supabaseApi.startGame(gameId);
   ```

3. **Implement Client-Side Game Logic**:
   - Role assignment when game starts
   - Phase transitions (night → day → voting → night)
   - Vote counting and elimination
   - Night action resolution
   - Win condition checking

4. **Update Realtime Handlers**:
   - Listen for database changes
   - Fetch full game state when changes occur
   - Update local state accordingly

## Quick Start Implementation

Here's a minimal example of how to update `useGameState.ts`:

```typescript
import { useSupabaseRealtime } from "./useSupabaseRealtime";
import * as supabaseApi from "@/lib/supabase";

export function useGameState() {
  const [gameId, setGameId] = useState<number | null>(null);
  const { isConnected, onMessage } = useSupabaseRealtime(gameId);

  // Handle realtime updates
  onMessage("game_state_update", async () => {
    if (gameId) {
      const state = await supabaseApi.getGameState(gameId);
      setGameState(state);
    }
  });

  const createGame = async (name: string, settings: any) => {
    const { game, player } = await supabaseApi.createGame(name, settings);
    setGameId(game.id);
    setPlayerId(player.id);
    // ... rest of logic
  };

  // ... other functions
}
```

## Testing Checklist

Once implemented, test these flows:

- [ ] Create a new game
- [ ] Join an existing game
- [ ] Start the game (roles assigned)
- [ ] Send chat messages
- [ ] Submit votes during day phase
- [ ] Perform night actions
- [ ] Game ends with correct winner

## Current Status

- ✅ Netlify deployment working
- ✅ Supabase API client ready
- ✅ Realtime subscriptions configured
- ⏳ Game logic needs migration
- ⏳ useGameState needs update
- ⏳ Testing required

## Estimated Time

- Client-side logic migration: 2-3 hours
- Testing and debugging: 1-2 hours
- **Total: 3-5 hours of development**

## Alternative: Keep Backend Server

If you prefer to keep the existing backend logic:
1. Deploy the Express server to Railway/Render/Heroku
2. Update WebSocket URL to point to deployed backend
3. Keep current architecture (simpler, but requires separate backend hosting)

This would only take 30 minutes but requires a separate backend service.
