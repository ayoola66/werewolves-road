# 🐛 Critical Bugs & Issues Report

**Last Updated**: January 2026  
**Testing Sessions**: Multiple (Night Phase, Voting Phase, Game Over)  
**Players Tested**: 4 (AYO, Jay, Meh, Lov)

---

## 📊 STATUS SUMMARY

| Category           | Total | Fixed | Remaining |
| ------------------ | ----- | ----- | --------- |
| 🔴 Critical        | 8     | 4     | **4**     |
| 🟠 High Priority   | 4     | 2     | **2**     |
| 🟡 Medium Priority | 7     | 4     | **3**     |

---

## 🔴 CRITICAL BUGS (Game-Breaking)

### Bug #1: Player Stuck in Lobby ✅ FIXED

**Severity**: 🔴 Critical  
**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Added polling mechanism (every 2s) to detect game start even if Realtime subscription fails

**Location**: `client/src/hooks/useGameState.ts`

---

### Bug #2: Timer Shows 0:00 Instead of Countdown ✅ FIXED

**Severity**: 🔴 Critical  
**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Added phase default timers fallback and immediate timer calculation on mount

**Location**: `client/src/components/werewolf/GameScreen.tsx`

---

### Bug #3: Villagers Missing Chat Box ✅ FIXED

**Severity**: 🔴 Critical  
**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Added Village Chat panel to the "no night action" waiting screen

**Location**: `client/src/components/werewolf/NightActionInterface.tsx`

---

### Bug #4: Night Action API Error ✅ FIXED

**Severity**: 🔴 Critical  
**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Added `getActionType()` function and `handleSkip()` to properly pass action parameter

**Location**: `client/src/components/werewolf/NightActionInterface.tsx`

---

### Bug #5: Game Over Not Triggering - `gameId` Typo 🔴 NEW

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games where win condition is met

**Symptom**: When villagers vote out the last werewolf (or vice versa), game doesn't end. Screen stays on "Vote Cast Successfully" indefinitely.

**Root Cause**: Line 167 in `process-votes/index.ts` uses undefined variable `gameId` instead of `game.id`:

```javascript
// BUGGY CODE:
.eq('id', gameId)  // ❌ gameId is undefined!

// SHOULD BE:
.eq('id', game.id)  // ✅ Correct
```

**Impact**: Win condition is detected by `checkWinCondition()` but database never updates to `game_over` status.

**Location**: `supabase/functions/process-votes/index.ts` - line 167

---

### Bug #6: Votes Not Being Fetched from Database 🔴 NEW

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All players during voting phase

**Symptom**: Vote progress shows "0/4 players have voted" even after all players have voted and received "Vote Recorded" toast.

**Root Cause**: In `fetchGameState`, votes are hardcoded to empty object instead of fetching from database:

```javascript
// BUGGY CODE (line 317):
votes: {},        // ❌ Never fetched!
nightActions: {}, // ❌ Never fetched!
```

**Impact**:

- Vote count never updates in UI
- Players can't see voting progress
- No visual feedback that votes are being recorded

**Location**: `client/src/hooks/useGameState.ts` - line 317-318

---

### Bug #7: No Auto-Transition After All Players Vote 🔴 NEW

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games

**Symptom**: After all players vote, screen stays on "Waiting for other players..." until timer expires.

**Expected Behaviour**: When `totalVotes >= totalAlivePlayers`, immediately:

1. Call `process-votes` edge function
2. Show voting results (who was eliminated)
3. Transition to next phase

**Current Behaviour**: Must wait for full voting timer (120 seconds) to expire.

**Location**:

- `client/src/components/werewolf/VotingInterface.tsx`
- `client/src/hooks/useGameState.ts` - phase timer logic

---

### Bug #8: Missing Voting Results Phase 🔴 NEW

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games

**Symptom**: After `process-votes` runs, game jumps directly from voting to night phase without showing who was eliminated.

**Expected Flow**:

1. Voting phase ends
2. → `voting_results` phase (10 seconds) showing:
   - Who was eliminated (or "No one - tie vote")
   - Vote breakdown (who voted for whom)
3. → Night phase (or Game Over if win condition met)

**Current Flow**:

1. Voting phase ends
2. → Night phase immediately (skips results!)

**Location**: `supabase/functions/process-votes/index.ts` - missing voting_results transition

---

## 🟠 HIGH PRIORITY BUGS

### Bug #9: Duplicate Chat Panels for Werewolf ✅ FIXED

**Severity**: 🟠 High  
**Status**: ✅ Fixed (structure verified correct)

---

### Bug #10: Votes Visible Before All Voted ✅ FIXED

**Severity**: 🟠 High  
**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Added "🔒 Secret Voting" notice, votes only revealed in voting_results phase

---

### Bug #11: Dead Player's Role Visible During Game 🟠 NEW

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: All players

**Symptom**: When AYO (Werewolf) was voted out, their role "WEREWOLF" was immediately visible in the player sidebar while game continued.

**Expected**: Dead player's role should be hidden until game ends completely. Only show:

- Player name
- "Dead" status badge
- NO role information

**Impact**: Reveals information that should be secret, affects remaining gameplay strategy.

**Location**: `client/src/components/werewolf/PlayerSidebar.tsx`

---

### Bug #12: Phase Sync Issues Between Players 🟠 NEW

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: Some players

**Symptom**: In screenshots, some players see "DAY 01" while others see "NIGHT 1" at the same time.

**Root Cause**: Possible race condition in Realtime subscription or state update timing.

**Location**: `client/src/hooks/useGameState.ts` - Supabase subscription handling

---

## 🟡 MEDIUM PRIORITY (UI/UX Issues)

### Issue #13: Role Reveal Timer ✅ FIXED

**Status**: ✅ Already set to 15 seconds

---

### Issue #14: Voting Results Timer ✅ FIXED

**Status**: ✅ Changed from 15s to 10s (deployed to Supabase)

---

### Issue #15: Voting UI Improvements ✅ FIXED

**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Radio button selection + "✓ Confirm Vote" button

---

### Issue #16: Eliminated Player Message ✅ FIXED

**Status**: ✅ Fixed (commit 113dfba)  
**Fix Applied**: Created `EliminatedOverlay.tsx` component

---

### Issue #17: Too Much Whitespace in Player Cards 🟡 NEW

**Severity**: 🟡 Medium  
**Status**: ❌ NOT FIXED

**Symptom**: Large gap between player name and status badge (Alive/Dead) in player sidebar.

**Impact**: Wastes valuable screen space, especially problematic on mobile devices.

**Required Changes**:

- Reduce padding between elements
- Make player cards more compact
- Ensure all info visible on mobile without scrolling

**Location**: `client/src/components/werewolf/PlayerSidebar.tsx`

---

### Issue #18: Leave Game Button Overlapping 🟡 NEW

**Severity**: 🟡 Medium  
**Status**: ❌ NOT FIXED

**Symptom**: "Leave Game" button positioned over other content, not in its own dedicated space.

**Expected**: Button should have its own corner/space, not overlap anything.

**Location**: `client/src/components/werewolf/GameScreen.tsx`

---

### Issue #19: Vote Target Name Not Showing 🟡 NEW

**Severity**: 🟡 Medium  
**Status**: ❌ NOT FIXED

**Symptom**: "Vote Cast Successfully" screen shows "You voted for:" but the target name appears to be blank/missing.

**Location**: `client/src/components/werewolf/VotingInterface.tsx`

---

## 📊 PHASE TIMERS REFERENCE

| Phase          | Current         | Required | Status     |
| -------------- | --------------- | -------- | ---------- |
| Role Reveal    | 15 sec          | 15 sec   | ✅ Correct |
| Night          | 120 sec (2 min) | 120 sec  | ✅ Correct |
| Day            | 180 sec (3 min) | 180 sec  | ✅ Correct |
| Voting         | 120 sec (2 min) | 120 sec  | ✅ Correct |
| Voting Results | 10 sec          | 10 sec   | ✅ Correct |

---

## ✅ CONFIRMED WORKING

- [x] Role reveal shows player roles
- [x] Werewolves can see each other during role reveal
- [x] Message scrambling algorithm works
- [x] Lightning strike implementation exists
- [x] Shield activation works
- [x] Day phase shows "Discussion Time" card
- [x] Tie vote = no elimination logic
- [x] Timer shows countdown (with fallback defaults)
- [x] Lobby polling detects game start
- [x] Villagers have chat during night
- [x] Night action API sends correct parameters
- [x] Secret voting notice displayed
- [x] Radio buttons for vote selection
- [x] Eliminated overlay shows when player dies

---

## 🔧 FIX PRIORITY ORDER

### Phase 1: Critical (Must fix for game to complete)

1. **Bug #5**: Fix `gameId` → `game.id` typo in process-votes (game over broken)
2. **Bug #6**: Fetch votes and nightActions from database (vote count broken)
3. **Bug #7**: Auto-process votes when all players have voted
4. **Bug #8**: Add voting_results phase transition

### Phase 2: High Priority (Wrong behaviour)

5. **Bug #11**: Hide dead player roles until game over
6. **Bug #12**: Fix phase sync issues between players

### Phase 3: UI/UX Polish

7. **Issue #17**: Compact player cards (reduce whitespace)
8. **Issue #18**: Fix Leave Game button positioning
9. **Issue #19**: Show vote target name correctly

---

## 📝 NOTES FROM LATEST TEST

**Test Date**: January 2026  
**Game Code**: (new game)  
**Players**: AYO (Werewolf/Host), Jay (Villager), Meh (Villager), Lov (Villager)

**Observations**:

1. Voting worked - votes were recorded (toast confirmed)
2. Vote count showed 0/4 despite all voting (Bug #6)
3. AYO was correctly identified as werewolf and voted out
4. Game should have ended (villagers win) but stayed on voting screen (Bug #5)
5. AYO's role was revealed in sidebar during game (Bug #11)
6. 147 new errors logged in error_logs table

---

## 🎯 IMMEDIATE NEXT STEPS

1. Fix `gameId` typo in `process-votes/index.ts` line 167
2. Add votes/nightActions fetching to `fetchGameState` in `useGameState.ts`
3. Add logic to auto-call `process-votes` when all players have voted
4. Add `voting_results` phase before transitioning to night
5. Hide dead player roles in `PlayerSidebar.tsx`
6. Deploy updated edge functions to Supabase

---

## 📁 FILES REQUIRING CHANGES

| File                                                 | Issues      |
| ---------------------------------------------------- | ----------- |
| `supabase/functions/process-votes/index.ts`          | #5, #8      |
| `client/src/hooks/useGameState.ts`                   | #6, #7, #12 |
| `client/src/components/werewolf/VotingInterface.tsx` | #7, #19     |
| `client/src/components/werewolf/PlayerSidebar.tsx`   | #11, #17    |
| `client/src/components/werewolf/GameScreen.tsx`      | #18         |


---

## 🔴 API CONTRACT MISMATCHES (Added: January 14, 2026)

> **Source:** Codebase analysis comparing Edge Function expectations vs client calls

### Bug #20: `start-game` Edge Function Parameter Mismatch 🔴 CRITICAL

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games - prevents game from starting

**Symptom**: Game fails to start when host clicks "Start Game" button.

**Root Cause**: Client and Edge Function have incompatible parameter contracts:

```typescript
// CLIENT SENDS (useGameState.ts:241):
body: JSON.stringify({ gameCode: gameState.game.gameCode })  // string only

// EDGE FUNCTION EXPECTS (start-game/index.ts:10):
const { gameId, playerId } = await req.json() as { gameId: number; playerId: number }  // numbers!
```

**Problems Identified**:
1. Client sends `gameCode` (string) - Edge Function expects `gameId` (number)
2. Client doesn't send `playerId` at all
3. Edge Function expects numeric IDs but system uses string IDs

**Impact**: Start game always fails with 400 Bad Request

**Location**: 
- `client/src/hooks/useGameState.ts` - line 241
- `supabase/functions/start-game/index.ts` - line 10

---

### Bug #21: `start-game` Wrong Player Lookup Field 🔴 CRITICAL

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games - host verification fails

**Root Cause**: Edge Function queries by `player.id` (serial integer PK) but should use `player.player_id` (text unique ID):

```typescript
// BUGGY CODE (start-game/index.ts:25):
.eq('id', playerId)  // ❌ Wrong! This is the serial PK

// SHOULD BE:
.eq('player_id', playerId)  // ✅ Correct - matches the text player_id field
```

**Database Schema Reference** (shared/schema.ts):
```typescript
export const players = pgTable("players", {
  id: serial("id").primaryKey(),        // ← Auto-increment integer
  playerId: text("player_id").notNull(), // ← This is what we use for identification!
  // ...
});
```

**Impact**: Host verification fails even when correct playerId is sent

**Location**: `supabase/functions/start-game/index.ts` - line 25

---

### Bug #22: `send-chat` Edge Function Parameter Mismatch 🟠 HIGH

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: All chat functionality

**Symptom**: Chat messages fail to send.

**Root Cause**: Client and Edge Function have incompatible parameter contracts:

```typescript
// CLIENT SENDS (useGameState.ts:272):
body: JSON.stringify({
  gameCode: gameState.game.gameCode,  // string
  playerId,                            // string
  message,
  channel: channel || "all",
})

// EDGE FUNCTION EXPECTS (send-chat/index.ts:10):
const { gameId, playerId, message } = await req.json()  // expects gameId as number
```

**Impact**: Chat messages fail - breaks core social deduction gameplay

**Location**: 
- `client/src/hooks/useGameState.ts` - line 272
- `supabase/functions/send-chat/index.ts` - line 10

---

### Bug #23: Inconsistent API Parameter Naming Convention 🟠 HIGH

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: Developer experience, maintainability, error-prone integration

**Problem**: Edge Functions use inconsistent parameter naming:

| Edge Function | Identifier Used | Type Expected | Correct? |
|--------------|-----------------|---------------|----------|
| `create-game` | `playerName` | string | ✅ |
| `join-game` | `gameCode`, `playerName` | strings | ✅ |
| `start-game` | `gameId`, `playerId` | **numbers** | ❌ |
| `send-chat` | `gameId`, `playerId` | **numbers** | ❌ |
| `submit-vote` | `gameCode`, `playerId` | strings | ✅ |
| `submit-night-action` | `gameCode`, `playerId` | strings | ✅ |
| `process-votes` | `gameId` | **number** | ❌ |
| `process-night` | `gameId` | **number** | ❌ |

**Required Standard** (per HX REST API Style Policy):
- Use `gameCode` (string) - the human-readable game identifier
- Use `playerId` (string) - the text unique player ID
- Never expose database integer IDs (`game.id`, `player.id`) to clients

**Impact**: 
- Inconsistent API makes integration error-prone
- Violates HX policy on stable identifiers ("opaque strings like `bk_123`, not DB integers")
- Different functions break for different reasons

**Location**: All Edge Functions in `supabase/functions/`

---

## 📋 UPDATED STATUS SUMMARY

| Category           | Total | Fixed | Remaining |
| ------------------ | ----- | ----- | --------- |
| 🔴 Critical        | 10    | 4     | **6**     |
| 🟠 High Priority   | 6     | 2     | **4**     |
| 🟡 Medium Priority | 7     | 4     | **3**     |

---

## 🔧 UPDATED FIX PRIORITY ORDER

### Phase 0: API Contract Fixes (Must fix before anything else works)

1. **Bug #20**: Fix `start-game` to accept `gameCode` (string) and `playerId` (string)
2. **Bug #21**: Fix `start-game` to query by `player_id` field, not `id`
3. **Bug #22**: Fix `send-chat` to accept `gameCode` (string) instead of `gameId` (number)
4. **Bug #23**: Standardise all Edge Functions to use `gameCode`/`playerId` strings

### Phase 1: Critical Game Logic (Must fix for game to complete)

5. **Bug #5**: Fix `gameId` → `game.id` typo in process-votes
6. **Bug #6**: Fetch votes and nightActions from database
7. **Bug #7**: Auto-process votes when all players have voted
8. **Bug #8**: Add voting_results phase transition

### Phase 2: High Priority (Wrong behaviour)

9. **Bug #11**: Hide dead player roles until game over
10. **Bug #12**: Fix phase sync issues between players

### Phase 3: UI/UX Polish

11. **Issue #17**: Compact player cards
12. **Issue #18**: Fix Leave Game button positioning
13. **Issue #19**: Show vote target name correctly

---

## 📁 UPDATED FILES REQUIRING CHANGES

| File                                                 | Issues              |
| ---------------------------------------------------- | ------------------- |
| `supabase/functions/start-game/index.ts`             | #20, #21, #23       |
| `supabase/functions/send-chat/index.ts`              | #22, #23            |
| `supabase/functions/process-votes/index.ts`          | #5, #8, #23         |
| `supabase/functions/process-night/index.ts`          | #23                 |
| `client/src/hooks/useGameState.ts`                   | #6, #7, #12, #20    |
| `client/src/components/werewolf/VotingInterface.tsx` | #7, #19             |
| `client/src/components/werewolf/PlayerSidebar.tsx`   | #11, #17            |
| `client/src/components/werewolf/GameScreen.tsx`      | #18                 |


---

## 🔴 API CONTRACT MISMATCHES (Added: January 14, 2026)

> **Source:** Codebase analysis comparing Edge Function expectations vs client calls

### Bug #20: `start-game` Edge Function Parameter Mismatch 🔴 CRITICAL

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games - prevents game from starting

**Symptom**: Game fails to start when host clicks "Start Game" button.

**Root Cause**: Client and Edge Function have incompatible parameter contracts:

```typescript
// CLIENT SENDS (useGameState.ts:241):
body: JSON.stringify({ gameCode: gameState.game.gameCode })  // string only

// EDGE FUNCTION EXPECTS (start-game/index.ts:10):
const { gameId, playerId } = await req.json() as { gameId: number; playerId: number }  // numbers!
```

**Problems Identified**:
1. Client sends `gameCode` (string) - Edge Function expects `gameId` (number)
2. Client doesn't send `playerId` at all
3. Edge Function expects numeric IDs but system uses string IDs

**Impact**: Start game always fails with 400 Bad Request

**Location**: 
- `client/src/hooks/useGameState.ts` - line 241
- `supabase/functions/start-game/index.ts` - line 10

---

### Bug #21: `start-game` Wrong Player Lookup Field 🔴 CRITICAL

**Severity**: 🔴 Critical  
**Status**: ❌ NOT FIXED  
**Affected**: All games - host verification fails

**Root Cause**: Edge Function queries by `player.id` (serial integer PK) but should use `player.player_id` (text unique ID):

```typescript
// BUGGY CODE (start-game/index.ts:25):
.eq('id', playerId)  // ❌ Wrong! This is the serial PK

// SHOULD BE:
.eq('player_id', playerId)  // ✅ Correct - matches the text player_id field
```

**Database Schema Reference** (shared/schema.ts):
```typescript
export const players = pgTable("players", {
  id: serial("id").primaryKey(),        // ← Auto-increment integer
  playerId: text("player_id").notNull(), // ← This is what we use for identification!
  // ...
});
```

**Impact**: Host verification fails even when correct playerId is sent

**Location**: `supabase/functions/start-game/index.ts` - line 25

---

### Bug #22: `send-chat` Edge Function Parameter Mismatch 🟠 HIGH

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: All chat functionality

**Symptom**: Chat messages fail to send.

**Root Cause**: Client and Edge Function have incompatible parameter contracts:

```typescript
// CLIENT SENDS (useGameState.ts:272):
body: JSON.stringify({
  gameCode: gameState.game.gameCode,  // string
  playerId,                            // string
  message,
  channel: channel || "all",
})

// EDGE FUNCTION EXPECTS (send-chat/index.ts:10):
const { gameId, playerId, message } = await req.json()  // expects gameId as number
```

**Impact**: Chat messages fail - breaks core social deduction gameplay

**Location**: 
- `client/src/hooks/useGameState.ts` - line 272
- `supabase/functions/send-chat/index.ts` - line 10

---

### Bug #23: Inconsistent API Parameter Naming Convention 🟠 HIGH

**Severity**: 🟠 High  
**Status**: ❌ NOT FIXED  
**Affected**: Developer experience, maintainability, error-prone integration

**Problem**: Edge Functions use inconsistent parameter naming:

| Edge Function | Identifier Used | Type Expected | Correct? |
|--------------|-----------------|---------------|----------|
| `create-game` | `playerName` | string | ✅ |
| `join-game` | `gameCode`, `playerName` | strings | ✅ |
| `start-game` | `gameId`, `playerId` | **numbers** | ❌ |
| `send-chat` | `gameId`, `playerId` | **numbers** | ❌ |
| `submit-vote` | `gameCode`, `playerId` | strings | ✅ |
| `submit-night-action` | `gameCode`, `playerId` | strings | ✅ |
| `process-votes` | `gameId` | **number** | ❌ |
| `process-night` | `gameId` | **number** | ❌ |

**Required Standard** (per HX REST API Style Policy):
- Use `gameCode` (string) - the human-readable game identifier
- Use `playerId` (string) - the text unique player ID
- Never expose database integer IDs (`game.id`, `player.id`) to clients

**Impact**: 
- Inconsistent API makes integration error-prone
- Violates HX policy on stable identifiers ("opaque strings like `bk_123`, not DB integers")
- Different functions break for different reasons

**Location**: All Edge Functions in `supabase/functions/`

---

## 📋 UPDATED STATUS SUMMARY

| Category           | Total | Fixed | Remaining |
| ------------------ | ----- | ----- | --------- |
| 🔴 Critical        | 10    | 4     | **6**     |
| 🟠 High Priority   | 6     | 2     | **4**     |
| 🟡 Medium Priority | 7     | 4     | **3**     |

---

## 🔧 UPDATED FIX PRIORITY ORDER

### Phase 0: API Contract Fixes (Must fix before anything else works)

1. **Bug #20**: Fix `start-game` to accept `gameCode` (string) and `playerId` (string)
2. **Bug #21**: Fix `start-game` to query by `player_id` field, not `id`
3. **Bug #22**: Fix `send-chat` to accept `gameCode` (string) instead of `gameId` (number)
4. **Bug #23**: Standardise all Edge Functions to use `gameCode`/`playerId` strings

### Phase 1: Critical Game Logic (Must fix for game to complete)

5. **Bug #5**: Fix `gameId` → `game.id` typo in process-votes
6. **Bug #6**: Fetch votes and nightActions from database
7. **Bug #7**: Auto-process votes when all players have voted
8. **Bug #8**: Add voting_results phase transition

### Phase 2: High Priority (Wrong behaviour)

9. **Bug #11**: Hide dead player roles until game over
10. **Bug #12**: Fix phase sync issues between players

### Phase 3: UI/UX Polish

11. **Issue #17**: Compact player cards
12. **Issue #18**: Fix Leave Game button positioning
13. **Issue #19**: Show vote target name correctly

---

## 📁 UPDATED FILES REQUIRING CHANGES

| File                                                 | Issues              |
| ---------------------------------------------------- | ------------------- |
| `supabase/functions/start-game/index.ts`             | #20, #21, #23       |
| `supabase/functions/send-chat/index.ts`              | #22, #23            |
| `supabase/functions/process-votes/index.ts`          | #5, #8, #23         |
| `supabase/functions/process-night/index.ts`          | #23                 |
| `client/src/hooks/useGameState.ts`                   | #6, #7, #12, #20    |
| `client/src/components/werewolf/VotingInterface.tsx` | #7, #19             |
| `client/src/components/werewolf/PlayerSidebar.tsx`   | #11, #17            |
| `client/src/components/werewolf/GameScreen.tsx`      | #18                 |
