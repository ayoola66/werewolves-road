---
title: "API Contract Standardisation - Fix Stories"
date: 2026-01-14
project: "werewolveshx"
status: "Ready for Implementation"
epics: 2
stories: 6
priority: "P0 - Blocking"
---

# API Contract Standardisation Stories

## 📋 Overview

**Problem Statement:** Multiple Edge Functions have parameter mismatches with client code, causing game-breaking failures. The system uses inconsistent identifiers (some use `gameId` numbers, others use `gameCode` strings).

**HX Policy Alignment:** Per our REST API Style Policy, we should use "stable identifiers: opaque strings like `bk_123`, not DB integers". This means standardising on `gameCode` (string) and `playerId` (string) throughout.

**Business Impact:** Games cannot start, chat doesn't work - core functionality is broken.

---

## Epic 1: Fix Critical Edge Function Contracts

**Epic Goal:** Standardise all Edge Functions to accept `gameCode` (string) and `playerId` (string) parameters, matching the client's expectations and HX API standards.

**Business Value:** Enables core game functionality - starting games, sending chat messages.

**Technical Context:** Edge Functions currently expect numeric database IDs but clients send human-readable string identifiers.

---

### Story 1.1: Fix `start-game` Edge Function Contract

**As a** game host  
**I want** to successfully start the game when I click "Start Game"  
**So that** the game can proceed from lobby to role assignment.

#### Bug References:
- Bug #20: Parameter mismatch (expects `gameId` number, receives `gameCode` string)
- Bug #21: Wrong player lookup field (`id` vs `player_id`)

#### Acceptance Criteria:
- [ ] Edge Function accepts `{ gameCode: string, playerId: string }` in request body
- [ ] Function looks up game by `game_code` field, not `id`
- [ ] Function validates player using `player_id` field, not `id`
- [ ] Function validates player is the host (`is_host = true`)
- [ ] Function validates game is in `waiting` status
- [ ] Function validates minimum player count met (from settings)
- [ ] Function assigns roles to all players
- [ ] Function updates game status to `in_progress` and phase to `role_reveal`
- [ ] Function returns `{ success: true, game: {...} }`
- [ ] Function returns appropriate error messages for validation failures
- [ ] CORS headers included for Netlify client

#### Technical Details:

**File:** `supabase/functions/start-game/index.ts`

**Current (Broken):**
```typescript
const { gameId, playerId } = await req.json() as { gameId: number; playerId: number }
// ...
const { data: player } = await supabase
  .from('players')
  .select('*')
  .eq('id', playerId)  // ❌ Wrong field
  .single()
```

**Required (Fixed):**
```typescript
const { gameCode, playerId } = await req.json() as { gameCode: string; playerId: string }

if (!gameCode || !playerId) {
  return new Response(
    JSON.stringify({ error: 'Missing required fields: gameCode and playerId' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Look up game by game_code
const { data: game, error: gameError } = await supabase
  .from('games')
  .select('*')
  .eq('game_code', gameCode)
  .single()

// Validate player by player_id field
const { data: player, error: playerError } = await supabase
  .from('players')
  .select('*')
  .eq('game_id', game.id)
  .eq('player_id', playerId)
  .single()
```

#### Definition of Done:
- ✅ Edge Function accepts string parameters
- ✅ Game lookup uses `game_code` field
- ✅ Player lookup uses `player_id` field
- ✅ Host validation works correctly
- ✅ Role assignment logic unchanged
- ✅ Deployed to Supabase and tested end-to-end

---

### Story 1.2: Update Client `startGame` Method

**As a** developer  
**I want** the client to send the correct parameters when starting a game  
**So that** the Edge Function receives what it expects.

#### Acceptance Criteria:
- [ ] `startGame()` method sends `{ gameCode, playerId }` (both strings)
- [ ] Method reads `playerId` from hook state
- [ ] Method reads `gameCode` from `gameState.game.gameCode`
- [ ] Error handling shows user-friendly messages
- [ ] Success triggers navigation to role reveal phase

#### Technical Details:

**File:** `client/src/hooks/useGameState.ts`

**Current (Broken):**
```typescript
const startGame = async () => {
  // ...
  body: JSON.stringify({ gameCode: gameState.game.gameCode })  // Missing playerId!
}
```

**Required (Fixed):**
```typescript
const startGame = async () => {
  if (!gameState?.game?.gameCode || !playerId) {
    toast({ title: "Error", description: "Missing game or player information", variant: "destructive" })
    return
  }
  
  const response = await fetch(`${FUNCTIONS_URL}/start-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ 
      gameCode: gameState.game.gameCode,
      playerId: playerId  // ✅ Include playerId
    })
  })
  // ...
}
```

#### Definition of Done:
- ✅ Client sends both `gameCode` and `playerId`
- ✅ Both are string types
- ✅ Error states handled gracefully
- ✅ Tested with fixed Edge Function

---

### Story 1.3: Fix `send-chat` Edge Function Contract

**As a** player  
**I want** to send chat messages during the game  
**So that** I can communicate with other players for social deduction.

#### Bug Reference:
- Bug #22: Parameter mismatch (expects `gameId` number, receives `gameCode` string)

#### Acceptance Criteria:
- [ ] Edge Function accepts `{ gameCode: string, playerId: string, message: string, channel?: string }`
- [ ] Function looks up game by `game_code` field
- [ ] Function validates player exists and is in the game
- [ ] Function validates player is alive (dead players can't chat in public channel)
- [ ] Function validates channel permissions (only werewolves can use werewolf channel)
- [ ] Function inserts message into `chat_messages` table
- [ ] Function returns `{ success: true, message: {...} }`
- [ ] CORS headers included

#### Technical Details:

**File:** `supabase/functions/send-chat/index.ts`

**Current (Broken):**
```typescript
const { gameId, playerId, message } = await req.json()  // gameId is number
```

**Required (Fixed):**
```typescript
const { gameCode, playerId, message, channel } = await req.json() as { 
  gameCode: string
  playerId: string
  message: string
  channel?: string 
}

// Look up game by game_code
const { data: game } = await supabase
  .from('games')
  .select('*')
  .eq('game_code', gameCode)
  .single()

// Validate player
const { data: player } = await supabase
  .from('players')
  .select('*')
  .eq('game_id', game.id)
  .eq('player_id', playerId)
  .single()
```

#### Definition of Done:
- ✅ Edge Function accepts string parameters
- ✅ Game lookup uses `game_code` field
- ✅ Player validation uses `player_id` field
- ✅ Channel permissions enforced
- ✅ Messages appear in real-time for recipients
- ✅ Deployed and tested end-to-end

---

### Story 1.4: Fix `process-votes` Edge Function Contract

**As a** game system  
**I want** to process votes correctly  
**So that** eliminations happen and the game can progress.

#### Bug References:
- Bug #5: `gameId` typo (undefined variable)
- Bug #23: Inconsistent parameter naming

#### Acceptance Criteria:
- [ ] Edge Function accepts `{ gameCode: string }` in request body
- [ ] Function looks up game by `game_code` field
- [ ] **Fix typo**: Use `game.id` not `gameId` on line 167
- [ ] Function tallies votes correctly
- [ ] Function handles tie votes (no elimination)
- [ ] Function updates eliminated player's `is_alive` to false
- [ ] Function checks win conditions after elimination
- [ ] Function transitions to correct next phase
- [ ] Function returns vote results summary

#### Technical Details:

**File:** `supabase/functions/process-votes/index.ts`

**Critical Typo Fix (line 167):**
```typescript
// BUGGY:
.eq('id', gameId)  // ❌ gameId is undefined!

// FIXED:
.eq('id', game.id)  // ✅ Use the game object's id
```

**Parameter Fix:**
```typescript
// CURRENT:
const { gameId } = await req.json() as { gameId: number }

// FIXED:
const { gameCode } = await req.json() as { gameCode: string }

const { data: game } = await supabase
  .from('games')
  .select('*')
  .eq('game_code', gameCode)
  .single()
```

#### Definition of Done:
- ✅ Typo fixed - uses `game.id` not `gameId`
- ✅ Accepts `gameCode` string parameter
- ✅ Vote tallying works correctly
- ✅ Win condition detection works
- ✅ Game over triggers when appropriate
- ✅ Deployed and tested end-to-end

---

### Story 1.5: Fix `process-night` Edge Function Contract

**As a** game system  
**I want** to process night actions correctly  
**So that** werewolf kills, doctor saves, and seer investigations work.

#### Bug Reference:
- Bug #23: Inconsistent parameter naming

#### Acceptance Criteria:
- [ ] Edge Function accepts `{ gameCode: string }` in request body
- [ ] Function looks up game by `game_code` field
- [ ] Function processes all night actions in correct priority order
- [ ] Function resolves werewolf kills (check for doctor protection)
- [ ] Function resolves seer investigations
- [ ] Function checks win conditions after kills
- [ ] Function transitions to day phase (or game_over)
- [ ] Function returns night results summary

#### Technical Details:

**File:** `supabase/functions/process-night/index.ts`

```typescript
// CURRENT:
const { gameId } = await req.json() as { gameId: number }

// FIXED:
const { gameCode } = await req.json() as { gameCode: string }

const { data: game } = await supabase
  .from('games')
  .select('*')
  .eq('game_code', gameCode)
  .single()
```

#### Definition of Done:
- ✅ Accepts `gameCode` string parameter
- ✅ Night action processing unchanged
- ✅ Win condition checks work
- ✅ Phase transitions correctly
- ✅ Deployed and tested end-to-end

---

## Epic 2: Standardise Shared Types

**Epic Goal:** Create consistent TypeScript types for API contracts across client and Edge Functions.

**Business Value:** Reduces future bugs, improves developer experience, catches type mismatches at compile time.

---

### Story 2.1: Create Shared API Contract Types

**As a** developer  
**I want** consistent type definitions for Edge Function requests/responses  
**So that** client and server contracts stay in sync.

#### Acceptance Criteria:
- [ ] Create `supabase/functions/_shared/api-types.ts`
- [ ] Define request types for all Edge Functions
- [ ] Define response types for all Edge Functions
- [ ] All Edge Functions import and use these types
- [ ] Types enforce `gameCode: string` and `playerId: string` convention

#### Technical Details:

**New File:** `supabase/functions/_shared/api-types.ts`

```typescript
// Standard request types - all use string identifiers
export interface StartGameRequest {
  gameCode: string
  playerId: string
}

export interface SendChatRequest {
  gameCode: string
  playerId: string
  message: string
  channel?: 'public' | 'werewolf'
}

export interface SubmitVoteRequest {
  gameCode: string
  playerId: string
  targetId: string
}

export interface ProcessPhaseRequest {
  gameCode: string
}

// Standard response types
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse
```

#### Definition of Done:
- ✅ Type file created
- ✅ All Edge Functions use shared types
- ✅ TypeScript compilation passes
- ✅ No `any` types in request handling

---

## 🎯 Implementation Plan

### Phase 0: Edge Function Fixes (Blocks Everything)

| Order | Story | Effort | Files Changed |
|-------|-------|--------|---------------|
| 1 | 1.1 - Fix `start-game` EF | 1hr | `supabase/functions/start-game/index.ts` |
| 2 | 1.2 - Fix client `startGame` | 30min | `client/src/hooks/useGameState.ts` |
| 3 | 1.3 - Fix `send-chat` EF | 1hr | `supabase/functions/send-chat/index.ts` |
| 4 | 1.4 - Fix `process-votes` EF | 1hr | `supabase/functions/process-votes/index.ts` |
| 5 | 1.5 - Fix `process-night` EF | 45min | `supabase/functions/process-night/index.ts` |
| 6 | 2.1 - Shared types | 30min | `supabase/functions/_shared/api-types.ts` |

**Total Estimated Effort:** ~5 hours

### Deployment Sequence:

1. Deploy fixed Edge Functions to Supabase (Stories 1.1, 1.3, 1.4, 1.5)
2. Deploy client changes to Netlify (Story 1.2)
3. End-to-end test: Create → Join → Start → Chat → Vote → Night → Win

---

## ✅ Testing Checklist

### Unit Tests:
- [ ] `start-game` validates missing `gameCode` returns 400
- [ ] `start-game` validates missing `playerId` returns 400
- [ ] `start-game` validates non-host player returns 403
- [ ] `send-chat` validates dead player in public channel returns 403
- [ ] `process-votes` handles tie correctly (no elimination)

### Integration Tests:
- [ ] Full game flow: lobby → role_reveal → night → day → voting → game_over
- [ ] Chat works during all phases
- [ ] Real-time updates received by all players

### Manual QA:
- [ ] 4-player test game completes successfully
- [ ] Error messages are user-friendly
- [ ] No console errors in browser

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Game start success rate | 0% | 100% |
| Chat message success rate | 0% | 100% |
| Games completing to win condition | 0% | 100% |
| API contract violations | 6 bugs | 0 bugs |

---

**Stories Created:** 2026-01-14  
**Created By:** Professor HX (BMAD Framework)  
**Status:** Ready for Implementation  
**Blocking:** All other bug fixes depend on Phase 0 completion
