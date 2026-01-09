---
title: "Werewolves Game - Implementation Stories"
date: 2026-01-09
project: "werewolveshx"
status: "Ready for Implementation"
epics: 3
stories: 5
---

# Implementation Epics and User Stories

## Epic 1: Complete useGameState Hook - Client-Side Methods

**Epic Goal:** Implement missing client-side utility methods in `useGameState` hook to support UI components.

**Business Value:** Enables proper display of current player information and role throughout the game interface.

**Technical Context:** These are pure client-side methods that don't require server-side logic. They operate on existing gameState data.

---

### Story 1.1: Implement `getCurrentPlayer()` Method

**As a** player in the game  
**I want** to see my current player information displayed correctly  
**So that** I know my role, status, and can interact appropriately with the game interface.

#### Acceptance Criteria:
- [ ] Method `getCurrentPlayer()` is added to `useGameState` hook
- [ ] Method returns `Player | null` type
- [ ] Method finds player in `gameState.players` array matching `playerId`
- [ ] Method returns `null` if `gameState` is null
- [ ] Method returns `null` if `playerId` is null
- [ ] Method returns `null` if player not found in array
- [ ] Method is exported in the hook's return object
- [ ] All components using `gameState.getCurrentPlayer()` work correctly:
  - [ ] GameScreen.tsx displays player info correctly
  - [ ] VotingInterface.tsx shows current player
  - [ ] NightActionInterface.tsx shows current player
  - [ ] Chat.tsx shows current player
  - [ ] PlayerList.tsx shows current player

#### Technical Details:
- **File:** `client/src/hooks/useGameState.ts`
- **Implementation:** Simple array find operation
- **Dependencies:** None (uses existing state)
- **Testing:** Verify method returns correct player object

#### Definition of Done:
- ✅ Code implemented and committed
- ✅ No TypeScript errors
- ✅ All components render without errors
- ✅ Method returns expected Player object structure

---

## Epic 2: Player Leave Game Functionality

**Epic Goal:** Enable players to leave games at any time, with proper cleanup and navigation.

**Business Value:** Improves user experience by allowing players to exit games gracefully, preventing frustration from being stuck in games.

**Technical Context:** Requires both client-side method and server-side Edge Function to handle player removal and state updates.

---

### Story 2.1: Create `leave-game` Edge Function

**As a** game system  
**I want** to remove players from games server-side  
**So that** game state remains consistent and other players are notified of changes.

#### Acceptance Criteria:
- [ ] Edge Function `leave-game` created in `supabase/functions/leave-game/index.ts`
- [ ] Function accepts `{ gameCode: string, playerId: string }` in request body
- [ ] Function validates player exists in game
- [ ] Function removes player from `players` table (DELETE WHERE game_code AND player_id)
- [ ] Function broadcasts update via Supabase Realtime (database trigger handles this)
- [ ] Function returns `{ success: boolean, message?: string }`
- [ ] Function handles errors gracefully with appropriate HTTP status codes
- [ ] Function includes CORS headers for Netlify client
- [ ] Function uses Supabase service role key for database operations

#### Technical Details:
- **File:** `supabase/functions/leave-game/index.ts`
- **Database Operation:** DELETE FROM players WHERE game_code = $1 AND player_id = $2
- **Security:** Validate player belongs to game before deletion
- **Testing:** Test with Supabase CLI locally before deployment

#### Definition of Done:
- ✅ Edge Function created and tested locally
- ✅ Function deployed to Supabase
- ✅ Function URL documented
- ✅ Error handling implemented

---

### Story 2.2: Implement `leaveGame()` Method in useGameState

**As a** player  
**I want** to leave a game I'm in  
**So that** I can exit and return to the main menu.

#### Acceptance Criteria:
- [ ] Method `leaveGame()` is added to `useGameState` hook
- [ ] Method calls `leave-game` Edge Function with gameCode and playerId
- [ ] Method shows success toast notification
- [ ] Method navigates to "initial" screen via `setCurrentScreen("initial")`
- [ ] Method cleans up Realtime subscriptions
- [ ] Method resets relevant state (gameState, playerId, etc.)
- [ ] Method handles errors and shows error toast
- [ ] Method is exported in the hook's return object
- [ ] All components using `gameState.leaveGame()` work correctly:
  - [ ] GameScreen.tsx leave button works
  - [ ] Lobby.tsx leave button works
  - [ ] GameOverOverlay.tsx leave button works

#### Technical Details:
- **File:** `client/src/hooks/useGameState.ts`
- **Edge Function URL:** `${VITE_SUPABASE_URL}/functions/v1/leave-game`
- **State Cleanup:** Clear gameState, reset currentScreen, cleanup subscriptions
- **Error Handling:** Try-catch with toast notifications

#### Definition of Done:
- ✅ Code implemented and committed
- ✅ Method successfully calls Edge Function
- ✅ Player removed from game in database
- ✅ UI navigates correctly after leaving
- ✅ No memory leaks from subscriptions

---

## Epic 3: Start Voting Phase Functionality

**Epic Goal:** Enable players to manually trigger voting phase transition during day phase.

**Business Value:** Gives players control over game pacing, allowing them to move to voting when ready rather than waiting for timer.

**Technical Context:** Requires both client-side method and server-side Edge Function to handle phase transition with proper validation.

---

### Story 3.1: Create `start-voting` Edge Function

**As a** game system  
**I want** to transition games from day phase to voting phase server-side  
**So that** game state remains consistent and phase transitions are validated properly.

#### Acceptance Criteria:
- [ ] Edge Function `start-voting` created in `supabase/functions/start-voting/index.ts`
- [ ] Function accepts `{ gameCode: string, playerId: string }` in request body
- [ ] Function validates game is in "day" phase
- [ ] Function validates player exists and is alive
- [ ] Function validates game status is "playing"
- [ ] Function updates game phase to "voting"
- [ ] Function sets phase timer (from game settings or default)
- [ ] Function sets phaseEndTime (current time + timer duration)
- [ ] Function broadcasts phase change via Realtime
- [ ] Function returns `{ success: boolean, message?: string }`
- [ ] Function handles validation errors with appropriate messages
- [ ] Function includes CORS headers for Netlify client
- [ ] Function uses Supabase service role key for database operations

#### Technical Details:
- **File:** `supabase/functions/start-voting/index.ts`
- **Database Operation:** UPDATE games SET phase = 'voting', phase_timer = $1, phase_end_time = $2 WHERE game_code = $3
- **Validation:** Check phase, player status, game status before update
- **Timer:** Use game.settings.voteDuration or default (e.g., 300 seconds)
- **Testing:** Test with Supabase CLI locally before deployment

#### Definition of Done:
- ✅ Edge Function created and tested locally
- ✅ All validations work correctly
- ✅ Function deployed to Supabase
- ✅ Function URL documented
- ✅ Error handling implemented

---

### Story 3.2: Implement `startVoting()` Method in useGameState

**As a** player during day phase  
**I want** to start the voting phase  
**So that** we can proceed to voting when all players are ready.

#### Acceptance Criteria:
- [ ] Method `startVoting()` is added to `useGameState` hook
- [ ] Method calls `start-voting` Edge Function with gameCode and playerId
- [ ] Method shows success toast notification
- [ ] Method handles validation errors (wrong phase, player dead, etc.) with error toast
- [ ] Method is exported in the hook's return object
- [ ] Component using `gameState.startVoting()` works correctly:
  - [ ] GameScreen.tsx "Start Voting Now" button works
  - [ ] Button only shows during "day" phase
  - [ ] Button only shows for alive players

#### Technical Details:
- **File:** `client/src/hooks/useGameState.ts`
- **Edge Function URL:** `${VITE_SUPABASE_URL}/functions/v1/start-voting`
- **Error Handling:** Try-catch with toast notifications for validation errors
- **UI Integration:** Button already exists in GameScreen.tsx, just needs method

#### Definition of Done:
- ✅ Code implemented and committed
- ✅ Method successfully calls Edge Function
- ✅ Game phase transitions correctly
- ✅ UI updates via Realtime subscription
- ✅ Error messages are user-friendly

---

## Implementation Priority

### Priority 1 (Critical - Blocks Core Functionality):
1. **Story 1.1:** Implement `getCurrentPlayer()` - Required by multiple components
2. **Story 2.1 & 2.2:** Leave game functionality - High user impact

### Priority 2 (Important - Enhances UX):
3. **Story 3.1 & 3.2:** Start voting functionality - Nice-to-have feature

## Testing Strategy

### Unit Testing:
- Test `getCurrentPlayer()` with various gameState scenarios
- Test `leaveGame()` error handling
- Test `startVoting()` validation scenarios

### Integration Testing:
- Test Edge Functions with Supabase CLI locally
- Test full flow: create game → join → leave game
- Test full flow: start game → day phase → start voting

### Manual Testing:
- Test all UI components that use these methods
- Verify Realtime updates work correctly
- Test error scenarios (network failures, validation failures)

## Deployment Checklist

- [ ] All Edge Functions tested locally
- [ ] All Edge Functions deployed to Supabase
- [ ] Client code updated and tested
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console
- [ ] All user flows tested end-to-end
- [ ] Documentation updated (if needed)

---

**Stories Created:** 2026-01-09  
**Created By:** BMAD Framework - PM Agent  
**Status:** Ready for Development
