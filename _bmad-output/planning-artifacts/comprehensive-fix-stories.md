# 🎯 Comprehensive Fix Stories: Resolve All Game Flow Issues

**Epic:** Complete Game Flow Implementation and Bug Fixes  
**Created:** 2025-01-27  
**Priority:** CRITICAL  
**Status:** Ready for Implementation

---

## 📋 Epic Overview

This epic addresses all critical, high, and medium severity issues identified in the codebase flow analysis. The goal is to create a fully functional, stable Werewolf game with proper phase transitions, complete role mechanics, and robust error handling.

**Business Value:**
- Game becomes fully playable end-to-end
- Eliminates back-and-forth debugging cycles
- Provides stable, predictable game experience
- Ensures all game mechanics work correctly

**Success Criteria:**
- All phases transition automatically after timers expire
- All roles function correctly with proper action resolution
- Voting system works with sheriff bonus and tie handling
- Game flow from lobby → role reveal → night → day → voting → repeat works seamlessly
- All validations prevent cheating and ensure game integrity

---

## 🏗️ Architecture Decision: Phase Transition Strategy

**Decision:** Implement client-side phase checking with automatic Edge Function calls

**Rationale:**
- Edge Functions are stateless and cannot run background timers
- Client already has access to `phase_end_time` from database
- Client can check timer expiration and call process functions
- Simpler than setting up cron jobs or external schedulers
- Works reliably with Supabase Realtime for state updates

**Implementation Approach:**
1. Client checks `phase_end_time` every 5 seconds
2. When `phase_end_time` has passed, client calls appropriate process function
3. Process function updates database and triggers Realtime updates
4. All clients receive updated state via Realtime subscriptions

---

## 📖 User Stories

### Epic 1: Automatic Phase Transitions

#### Story 1.1: Implement Client-Side Phase Timer Checking
**Priority:** CRITICAL  
**Story Points:** 8

**As a** game player  
**I want** phases to transition automatically when timers expire  
**So that** the game progresses without manual intervention

**Acceptance Criteria:**
- [ ] Client checks `phase_end_time` every 5 seconds when game is active
- [ ] When `phase_end_time` has passed, client calls appropriate process function:
  - Night phase → calls `process-night`
  - Voting phase → calls `process-votes`
- [ ] Process functions update database with new phase and `phase_end_time`
- [ ] All clients receive phase change via Realtime subscriptions
- [ ] Phase transitions happen automatically without user action
- [ ] Timer checking stops when game is in `game_over` phase

**Technical Details:**
- **File:** `client/src/hooks/useGameState.ts`
- **Implementation:**
  - Add `useEffect` hook that runs interval every 5 seconds
  - Check `gameState?.game?.phaseEndTime`
  - Compare with current time
  - Call `processNight()` or `processVotes()` when expired
  - Only check when `currentScreen === 'game'` and phase is `night` or `voting`

**Dependencies:** None (foundational)

---

#### Story 1.2: Fix process-night API to Use gameCode
**Priority:** CRITICAL  
**Story Points:** 3

**As a** developer  
**I want** `process-night` to accept `gameCode` instead of `gameId`  
**So that** API is consistent across all Edge Functions

**Acceptance Criteria:**
- [ ] `process-night` Edge Function accepts `gameCode` (string) instead of `gameId` (integer)
- [ ] Function queries game by `game_code` instead of `id`
- [ ] Function queries players by `game_id` (integer) after finding game
- [ ] Client calls function with `gameCode` parameter
- [ ] All error messages updated to use `gameCode`

**Technical Details:**
- **File:** `supabase/functions/process-night/index.ts`
- **Changes:**
  - Change request body from `{ gameId }` to `{ gameCode }`
  - Query game: `.eq('game_code', gameCode.toUpperCase()).single()`
  - Use `game.id` for subsequent queries
  - Update error messages

**Dependencies:** Story 1.1 (needed for client to call function)

---

#### Story 1.3: Fix process-votes API to Use gameCode
**Priority:** CRITICAL  
**Story Points:** 3

**As a** developer  
**I want** `process-votes` to accept `gameCode` instead of `gameId`  
**So that** API is consistent across all Edge Functions

**Acceptance Criteria:**
- [ ] `process-votes` Edge Function accepts `gameCode` (string) instead of `gameId` (integer)
- [ ] Function queries game by `game_code` instead of `id`
- [ ] Function queries players by `game_id` (integer) after finding game
- [ ] Client calls function with `gameCode` parameter
- [ ] Fix undefined variable bug (`newDay` → `newNight`)

**Technical Details:**
- **File:** `supabase/functions/process-votes/index.ts`
- **Changes:**
  - Change request body from `{ gameId }` to `{ gameCode }`
  - Query game: `.eq('game_code', gameCode.toUpperCase()).single()`
  - Use `game.id` for subsequent queries
  - Fix line 126: `newDay` → `newNight`
  - Update error messages

**Dependencies:** Story 1.1 (needed for client to call function)

---

#### Story 1.4: Add phase_end_time Setting to All Phase Transitions
**Priority:** CRITICAL  
**Story Points:** 5

**As a** game player  
**I want** accurate phase timers displayed  
**So that** I know how much time remains in each phase

**Acceptance Criteria:**
- [ ] `start-game` sets `phase_end_time` when starting game
- [ ] `process-night` sets `phase_end_time` when transitioning to day
- [ ] `process-votes` sets `phase_end_time` when transitioning to night
- [ ] `phase_end_time` is calculated as `Date.now() + (phaseTimer * 1000)`
- [ ] Client timer displays correctly using `phase_end_time`
- [ ] Timer counts down accurately

**Technical Details:**
- **Files:**
  - `supabase/functions/start-game/index.ts`
  - `supabase/functions/process-night/index.ts`
  - `supabase/functions/process-votes/index.ts`
- **Implementation:**
  - Define phase timers: `{ night: 120, day: 180, voting: 120, role_reveal: 15 }`
  - Calculate `phase_end_time = new Date(Date.now() + phaseTimer * 1000)`
  - Include in database update: `phase_end_time: phaseEndTime`

**Dependencies:** Stories 1.2, 1.3 (need functions to set timers)

---

#### Story 1.5: Implement role_reveal Phase in start-game
**Priority:** HIGH  
**Story Points:** 5

**As a** game player  
**I want** to see my role revealed before the game starts  
**So that** I know what role I'm playing

**Acceptance Criteria:**
- [ ] `start-game` sets `current_phase: 'role_reveal'` instead of `'night'`
- [ ] `start-game` sets `phase_end_time` for role_reveal (15 seconds)
- [ ] Client displays role reveal overlay when phase is `role_reveal`
- [ ] After 15 seconds, phase automatically transitions to `night`
- [ ] Role reveal overlay shows player's assigned role

**Technical Details:**
- **File:** `supabase/functions/start-game/index.ts`
- **Changes:**
  - Set `current_phase: 'role_reveal'` instead of `'night'`
  - Set `phase_timer: 15` (role_reveal duration)
  - Set `phase_end_time` for role_reveal
  - Add client-side check: when `role_reveal` phase expires, call `process-night` or create `advance-role-reveal` function

**Alternative:** Create `advance-role-reveal` Edge Function that transitions from role_reveal → night

**Dependencies:** Story 1.4 (need phase_end_time support)

---

### Epic 2: Complete Night Action Processing

#### Story 2.1: Implement Complete Night Action Resolution Logic
**Priority:** HIGH  
**Story Points:** 13

**As a** game player  
**I want** all night actions to resolve in the correct priority order  
**So that** game mechanics work as designed

**Acceptance Criteria:**
- [ ] Night actions resolve in priority order:
  1. Shield (personal protection - highest priority)
  2. Doctor heal/save
  3. Bodyguard protection
  4. Werewolf kill (lowest priority)
- [ ] Shield prevents death even if targeted
- [ ] Doctor save prevents death if target is killed
- [ ] Bodyguard dies if protecting someone who is killed (unless shielded/healed)
- [ ] If bodyguard dies protecting someone, that person also dies (unless shielded/healed)
- [ ] Witch can save OR poison (one-time use each)
- [ ] Seer investigation results are stored and shown to seer
- [ ] All actions are logged in chat messages

**Technical Details:**
- **File:** `supabase/functions/process-night/index.ts`
- **Implementation:**
  - Query all night actions for the game
  - Query all players to check shields, roles, etc.
  - Process in priority order:
    1. Check shields first (has_shield = true)
    2. Process doctor saves
    3. Process bodyguard protections
    4. Process werewolf kills
    5. Apply bodyguard death mechanic
  - Update player `is_alive` status
  - Create chat messages for all events
  - Store seer investigation results

**Dependencies:** Story 1.2 (process-night must work)

---

#### Story 2.2: Add Bodyguard Protection Logic
**Priority:** HIGH  
**Story Points:** 8

**As a** bodyguard player  
**I want** my protection to work correctly with death mechanics  
**So that** I can protect other players as intended

**Acceptance Criteria:**
- [ ] Bodyguard can protect any player except themselves
- [ ] If protected player is attacked, bodyguard dies
- [ ] If bodyguard dies protecting someone, that person also dies (unless shielded/healed)
- [ ] Bodyguard death is logged in chat
- [ ] Protected player death (if bodyguard dies) is logged in chat

**Technical Details:**
- **File:** `supabase/functions/process-night/index.ts`
- **Implementation:**
  - After processing werewolf kill, check if target had bodyguard protection
  - If yes:
    - Set bodyguard `is_alive = false`
    - Check if protected player has shield or doctor save
    - If not, set protected player `is_alive = false`
    - Create chat messages for both deaths

**Dependencies:** Story 2.1 (part of night action resolution)

---

#### Story 2.3: Add Witch Save/Poison Actions
**Priority:** HIGH  
**Story Points:** 5

**As a** witch player  
**I want** to use my save and poison potions  
**So that** I can influence the game

**Acceptance Criteria:**
- [ ] Witch can save one player per game (one-time use)
- [ ] Witch can poison one player per game (one-time use)
- [ ] Save potion prevents death (processed before kill)
- [ ] Poison potion kills target (processed after kill)
- [ ] Witch actions tracked in database (`action_used` field)
- [ ] Chat messages show witch actions

**Technical Details:**
- **File:** `supabase/functions/process-night/index.ts`
- **Implementation:**
  - Query witch actions (action_type: 'save' or 'poison')
  - Process save before werewolf kill
  - Process poison after werewolf kill
  - Update `action_used` field for witch
  - Create chat messages

**Dependencies:** Story 2.1 (part of night action resolution)

---

### Epic 3: Complete Vote Processing

#### Story 3.1: Implement Sheriff Vote Bonus
**Priority:** HIGH  
**Story Points:** 5

**As a** sheriff player  
**I want** my vote to count as 2 votes  
**So that** I have more influence in eliminations

**Acceptance Criteria:**
- [ ] Sheriff's vote counts as 2 votes
- [ ] Vote counting logic checks if voter is sheriff
- [ ] Sheriff bonus is applied correctly
- [ ] Chat messages indicate sheriff voted
- [ ] Vote results show sheriff bonus

**Technical Details:**
- **File:** `supabase/functions/process-votes/index.ts`
- **Implementation:**
  - When counting votes, check `voter.is_sheriff`
  - If sheriff, add 2 to vote count instead of 1
  - Update vote counting logic to handle sheriff bonus

**Dependencies:** Story 1.3 (process-votes must work)

---

#### Story 3.2: Implement Tie Vote Handling
**Priority:** HIGH  
**Story Points:** 3

**As a** game player  
**I want** tie votes to result in no elimination  
**So that** game rules are followed correctly

**Acceptance Criteria:**
- [ ] If multiple players have same highest vote count, no one is eliminated
- [ ] Chat message indicates tie vote and no elimination
- [ ] Game continues to next phase (night)
- [ ] Vote counts are displayed correctly

**Technical Details:**
- **File:** `supabase/functions/process-votes/index.ts`
- **Implementation:**
  - After counting votes, check if multiple players have max votes
  - If tie, don't eliminate anyone
  - Create chat message: "Tie vote - no one eliminated"
  - Continue to next phase

**Dependencies:** Story 1.3 (process-votes must work)

---

#### Story 3.3: Fix day_count Increment
**Priority:** HIGH  
**Story Points:** 2

**As a** game player  
**I want** day count to increment correctly  
**So that** I know which day of the game it is

**Acceptance Criteria:**
- [ ] When transitioning from voting to night, `day_count` is incremented
- [ ] Day count displays correctly in UI
- [ ] Day count starts at 0 and increments after each voting phase

**Technical Details:**
- **File:** `supabase/functions/process-votes/index.ts`
- **Implementation:**
  - When transitioning to night phase, increment `day_count`
  - Update: `day_count: (game.day_count || 0) + 1`

**Dependencies:** Story 1.3 (process-votes must work)

---

### Epic 4: Validation and Security

#### Story 4.1: Validate Player is Alive Before Vote/Action
**Priority:** MEDIUM  
**Story Points:** 3

**As a** game system  
**I want** to prevent dead players from voting or performing actions  
**So that** game integrity is maintained

**Acceptance Criteria:**
- [ ] `submit-vote` checks if player is alive before accepting vote
- [ ] `submit-night-action` checks if player is alive before accepting action
- [ ] Dead players receive error message if they try to vote/act
- [ ] Error is logged for debugging

**Technical Details:**
- **Files:**
  - `supabase/functions/submit-vote/index.ts`
  - `supabase/functions/submit-night-action/index.ts`
- **Implementation:**
  - Query player by `player_id`
  - Check `is_alive` field
  - Return error if `is_alive === false`

**Dependencies:** None (can be done independently)

---

#### Story 4.2: Validate Phase Before Accepting Actions
**Priority:** MEDIUM  
**Story Points:** 3

**As a** game system  
**I want** to prevent actions in wrong phases  
**So that** game rules are enforced

**Acceptance Criteria:**
- [ ] `submit-night-action` only accepts actions when phase is `night`
- [ ] `submit-vote` only accepts votes when phase is `voting`
- [ ] Wrong phase actions return error message
- [ ] Error is logged for debugging

**Technical Details:**
- **Files:**
  - `supabase/functions/submit-night-action/index.ts`
  - `supabase/functions/submit-vote/index.ts`
- **Implementation:**
  - Query game by `game_code`
  - Check `current_phase`
  - Return error if phase doesn't match action type

**Dependencies:** None (can be done independently)

---

#### Story 4.3: Validate Role Before Accepting Actions
**Priority:** MEDIUM  
**Story Points:** 5

**As a** game system  
**I want** to prevent players from submitting actions for roles they don't have  
**So that** cheating is prevented

**Acceptance Criteria:**
- [ ] Werewolf can only submit `kill` actions
- [ ] Doctor can only submit `save` actions
- [ ] Seer can only submit `investigate` actions
- [ ] Bodyguard can only submit `protect` actions
- [ ] Witch can submit `save` or `poison` actions
- [ ] Wrong role actions return error message
- [ ] Error is logged for debugging

**Technical Details:**
- **File:** `supabase/functions/submit-night-action/index.ts`
- **Implementation:**
  - Query player by `player_id` to get role
  - Define role-to-action mapping:
    - `werewolf`: ['kill']
    - `doctor`: ['save']
    - `seer`: ['investigate']
    - `bodyguard`: ['protect']
    - `witch`: ['save', 'poison']
  - Check if action_type is allowed for player's role
  - Return error if not allowed

**Dependencies:** None (can be done independently)

---

### Epic 5: State Management and Race Conditions

#### Story 5.1: Implement Request Debouncing for fetchGameState
**Priority:** MEDIUM  
**Story Points:** 5

**As a** game player  
**I want** game state to update smoothly without race conditions  
**So that** I see consistent game state

**Acceptance Criteria:**
- [ ] `fetchGameState` calls are debounced (max 1 per 500ms)
- [ ] Multiple rapid Realtime events don't cause multiple simultaneous fetches
- [ ] State updates are consistent
- [ ] No race conditions where state is overwritten

**Technical Details:**
- **File:** `client/src/hooks/useGameState.ts`
- **Implementation:**
  - Use `useRef` to track last fetch time
  - Check if 500ms have passed since last fetch
  - Only fetch if enough time has passed
  - Or use `useDebouncedCallback` from a library

**Dependencies:** None (can be done independently)

---

#### Story 5.2: Add Error Handling for Empty Arrays
**Priority:** MEDIUM  
**Story Points:** 3

**As a** game system  
**I want** to handle edge cases gracefully  
**So that** game doesn't crash in unusual situations

**Acceptance Criteria:**
- [ ] All Edge Functions handle empty player arrays
- [ ] Win condition check handles edge cases
- [ ] Error messages are clear and helpful
- [ ] Game state remains consistent

**Technical Details:**
- **Files:** All Edge Functions
- **Implementation:**
  - Check if arrays are empty before processing
  - Return appropriate error messages
  - Handle win conditions when no players left

**Dependencies:** None (can be done independently)

---

### Epic 6: Client-Side Improvements

#### Story 6.1: Clear Game State on Game End
**Priority:** LOW  
**Story Points:** 2

**As a** game player  
**I want** game state to clear when game ends  
**So that** I can start a new game cleanly

**Acceptance Criteria:**
- [ ] When game phase is `game_over`, show game over overlay
- [ ] Option to return to initial screen
- [ ] Game state is cleared when leaving game over screen
- [ ] Player can create/join new game

**Technical Details:**
- **File:** `client/src/hooks/useGameState.ts`
- **Implementation:**
  - Detect `game_over` phase
  - Show game over overlay
  - Add "Return to Menu" button
  - Clear game state on button click

**Dependencies:** None (can be done independently)

---

#### Story 6.2: Add Retry Logic for Failed Edge Function Calls
**Priority:** LOW  
**Story Points:** 3

**As a** game player  
**I want** failed network requests to retry automatically  
**So that** temporary network issues don't break the game

**Acceptance Criteria:**
- [ ] Failed Edge Function calls retry up to 3 times
- [ ] Exponential backoff between retries (1s, 2s, 4s)
- [ ] User sees loading indicator during retries
- [ ] Error shown if all retries fail

**Technical Details:**
- **File:** `client/src/hooks/useGameState.ts`
- **Implementation:**
  - Wrap Edge Function calls in retry logic
  - Use exponential backoff
  - Show toast notifications for retries

**Dependencies:** None (can be done independently)

---

## 📊 Implementation Order

### Phase 1: Critical Foundation (Must Do First)
1. Story 1.2: Fix process-night API
2. Story 1.3: Fix process-votes API
3. Story 1.4: Add phase_end_time setting
4. Story 1.1: Implement client-side phase timer checking
5. Story 1.5: Implement role_reveal phase

### Phase 2: Complete Game Mechanics (High Priority)
6. Story 2.1: Complete night action resolution
7. Story 2.2: Add bodyguard protection logic
8. Story 2.3: Add witch save/poison actions
9. Story 3.1: Implement sheriff vote bonus
10. Story 3.2: Implement tie vote handling
11. Story 3.3: Fix day_count increment

### Phase 3: Validation and Security (Medium Priority)
12. Story 4.1: Validate player is alive
13. Story 4.2: Validate phase before actions
14. Story 4.3: Validate role before actions
15. Story 5.1: Implement request debouncing
16. Story 5.2: Add error handling for empty arrays

### Phase 4: Polish (Low Priority)
17. Story 6.1: Clear game state on game end
18. Story 6.2: Add retry logic for failed calls

---

## ✅ Definition of Done

Each story is considered complete when:
- [ ] All acceptance criteria are met
- [ ] Code is written and tested
- [ ] Edge Functions are deployed to Supabase
- [ ] Client code is deployed to Netlify
- [ ] Manual testing confirms functionality
- [ ] No lint errors
- [ ] Error logging works correctly
- [ ] Documentation updated if needed

---

## 🧪 Testing Checklist

After all stories are complete, verify:
- [ ] Game starts → role reveal → night → day → voting → repeat
- [ ] Phases transition automatically after timers expire
- [ ] All night actions resolve in correct priority order
- [ ] Bodyguard protection works with death mechanics
- [ ] Witch save/poison work correctly
- [ ] Sheriff vote counts as 2 votes
- [ ] Tie votes result in no elimination
- [ ] Dead players cannot vote or act
- [ ] Wrong phase actions are rejected
- [ ] Wrong role actions are rejected
- [ ] Day count increments correctly
- [ ] Timers display correctly
- [ ] Game over condition triggers correctly
- [ ] Multiple players can play simultaneously
- [ ] State updates via Realtime work correctly

---

**End of Comprehensive Fix Stories**
