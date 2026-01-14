# 🐛 Critical Bugs & Issues Report

**Generated**: After testing session on Night Phase  
**Game Code Tested**: LE8VWN  
**Players**: 4 (Ayo, loolp, jack, mike)

---

## 🔴 CRITICAL BUGS (Game-Breaking)

### Bug #1: Player Stuck in Lobby

**Severity**: 🔴 Critical  
**Affected**: 1 of 4 players (loolp)  
**Symptom**: Player remained in Lobby screen while game was in Night Phase  
**Visual**: Shows "LOBBY" with game code, "Waiting for host to start the game", but also shows "Night Time" card overlaid

**Root Cause Analysis**:

- The `useEffect` in `useGameState.ts` that watches `gameState.game.status === 'playing'` didn't trigger for this player
- Possibly a Supabase Realtime subscription race condition
- Player's `currentScreen` state never changed from `'lobby'` to `'game'`

**Location**: `client/src/hooks/useGameState.ts` - line ~72-102 (auto-switch useEffect)

---

### Bug #2: Timer Shows 0:00 Instead of Countdown

**Severity**: 🔴 Critical  
**Affected**: All players  
**Symptom**: Night 1 timer displays "0:00" instead of counting down from "2:00"  
**Expected**: Should show countdown from 120 seconds (2 minutes)

**Root Cause Analysis**:

- Timer calculation in `GameScreen.tsx` relies on `phaseEndTime`
- Either `phaseEndTime` is not being set correctly by Edge Functions
- Or the timer calculation logic is incorrect
- Timer should be: `Math.max(0, (endTime - now) / 1000)`

**Location**:

- `client/src/components/werewolf/GameScreen.tsx` - timer useEffect (~line 84-129)
- `supabase/functions/start-game/index.ts` - phaseEndTime calculation

---

### Bug #3: Villagers Missing Chat Box

**Severity**: 🔴 Critical  
**Affected**: Villager players (Ayo confirmed)  
**Symptom**: Villager sees "Night Time" waiting card but NO chat interface  
**Expected**: All players should see Village Chat during night (scrambled for villagers)

**Impact**: Villagers will be struck by lightning (AFK rule) unfairly because they have no chat to type in!

**Root Cause Analysis**:

- `NightActionInterface.tsx` only shows chat panel for werewolves (`isWerewolf` check)
- Non-werewolf players with no night action see waiting screen without chat
- Chat should be visible for ALL players during night

**Location**: `client/src/components/werewolf/NightActionInterface.tsx` - line ~146-179 (waiting screen)

---

### Bug #4: Night Action API Error

**Severity**: 🔴 Critical  
**Symptom**: Error toast "Missing required fields: gameCode, playerId, and action"  
**Console**: Multiple 400 errors from `submit-night-action` Edge Function

**Root Cause Analysis**:

- `performNightAction` function is being called without proper parameters
- Either `action` parameter is undefined
- Or the function call signature doesn't match what Edge Function expects

**Location**:

- `client/src/hooks/useGameState.ts` - `performNightAction` function
- `supabase/functions/submit-night-action/index.ts` - parameter validation

---

## 🟠 HIGH PRIORITY BUGS

### Bug #5: Duplicate Chat Panels for Werewolf

**Severity**: 🟠 High  
**Affected**: Werewolf players (mike)  
**Symptom**: Werewolf sees TWO "Village Chat" panels instead of one Werewolf Chat + one Village Chat  
**Expected**:

- Top panel: "🐺 Werewolf Chat (Private)"
- Bottom panel: "🌙 Village Chat (Scrambled)"

**Root Cause Analysis**:

- Rendering issue in `NightActionInterface.tsx`
- Both panels showing "Village Chat" label
- Channel prop might not be passed correctly

**Location**: `client/src/components/werewolf/NightActionInterface.tsx` - line ~237-275

---

### Bug #6: Votes Are Visible Before All Voted

**Severity**: 🟠 High  
**Current Behaviour**: Players can see who has voted for who during voting  
**Expected**: Votes should be SECRET until ALL players have voted, then reveal results

**Impact**: Players are influenced by seeing others' votes

**Location**: `client/src/components/werewolf/VotingInterface.tsx`

---

## 🟡 MEDIUM PRIORITY (Wrong Settings/Polish)

### Issue #7: Role Reveal Timer Too Short

**Severity**: 🟡 Medium  
**Current**: 10 seconds  
**Required**: 15 seconds

**Location**: `supabase/functions/start-game/index.ts` - PHASE_TIMERS.role_reveal

---

### Issue #8: Voting Results Timer Too Long

**Severity**: 🟡 Medium  
**Current**: 15 seconds  
**Required**: 10 seconds

**Location**: Multiple Edge Functions - PHASE_TIMERS.voting_results

---

### Issue #9: Voting UI Needs Improvement

**Severity**: 🟡 Medium  
**Current**: Player buttons with click-to-select  
**Required**:

- Radio buttons for selection
- "Confirm Vote" button
- Clear visual feedback

**Location**: `client/src/components/werewolf/VotingInterface.tsx`

---

### Issue #10: Eliminated Player Message

**Severity**: 🟡 Medium  
**Current**: Eliminated player sees general game over screen  
**Required**: Clear "You have been eliminated" message with explanation

**Location**: `client/src/components/werewolf/overlays/GameOverOverlay.tsx` or new overlay

---

## 📊 PHASE TIMERS REFERENCE

| Phase          | Current         | Required   | Status     |
| -------------- | --------------- | ---------- | ---------- |
| Role Reveal    | 10 sec          | **15 sec** | 🔴 Wrong   |
| Night          | 120 sec (2 min) | 120 sec    | ✅ Correct |
| Day            | 180 sec (3 min) | 180 sec    | ✅ Correct |
| Voting         | 120 sec (2 min) | 120 sec    | ✅ Correct |
| Voting Results | 15 sec          | **10 sec** | 🔴 Wrong   |

---

## ✅ CONFIRMED WORKING

- [x] Role reveal shows player roles
- [x] Werewolves can see each other during role reveal
- [x] Message scrambling algorithm works
- [x] Lightning strike implementation exists
- [x] Shield activation works
- [x] Day phase shows "Discussion Time" card
- [x] Tie vote = no elimination logic
- [x] Game state syncs via Supabase Realtime (mostly)

---

## 🔧 FIX PRIORITY ORDER

### Phase 1: Critical (Must fix for game to be playable)

1. Bug #3: Villagers missing chat box (will cause unfair lightning strikes)
2. Bug #4: Night action API error (werewolves can't act)
3. Bug #2: Timer not counting down (phases won't auto-transition)
4. Bug #1: Player stuck in lobby (1 in 4 players can't play)

### Phase 2: High Priority (Wrong behaviour)

5. Bug #5: Duplicate chat panels
6. Bug #6: Secret voting (votes visible too early)

### Phase 3: Polish

7. Issue #7: Role reveal timer (10 → 15 sec)
8. Issue #8: Voting results timer (15 → 10 sec)
9. Issue #9: Voting UI improvements
10. Issue #10: Eliminated player message

---

## 📝 NOTES

- Console logs show game state IS updating (Phase: lobby → night)
- "Game started! Switching to game screen..." appears in console
- The auto-switch logic IS triggering for some players but not all
- Error [Error Log] Object visible in console - check error_logs table for more details

---

## 🎯 NEXT STEPS

1. Read the current `performNightAction` implementation to understand API mismatch
2. Fix villager chat visibility in `NightActionInterface.tsx`
3. Debug timer calculation in `GameScreen.tsx`
4. Investigate Supabase Realtime subscription for lobby player issue
5. Update phase timers to correct values
6. Implement secret voting
