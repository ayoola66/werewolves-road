# 🎮 Game Rules Implementation Stories

## Summary of Required Changes

Based on the user's detailed game rules explanation, the following features need to be implemented or fixed:

---

## Epic 1: Night Phase Chat System

### Story 1.1: Enable Chat for ALL Players During Night Phase
**Priority:** Critical
**Status:** Not Started

**Current Behaviour:**
Chat is completely HIDDEN during night phase in `GameScreen.tsx`

**Required Behaviour:**
- ALL players can chat during night phase
- Werewolves see each other's messages CLEARLY (private werewolf channel)
- Villagers can chat but their messages appear SCRAMBLED to everyone

**Why This Matters:**
If players are in the same physical room, hiding chat would reveal who the werewolves are (they're the only ones typing). By having EVERYONE chat (but villagers' messages scrambled), it hides who is actually communicating.

**Acceptance Criteria:**
- [ ] Night phase shows chat interface for ALL players
- [ ] Werewolves have separate "Werewolf Chat" channel with clear messages
- [ ] Villagers have "Village Chat" with scrambled messages
- [ ] All players appear to be typing/chatting to mask werewolf activity

**Technical Tasks:**
1. Modify `GameScreen.tsx` to show chat during night phase
2. Implement message scrambling in `send-chat` Edge Function
3. Store scrambled version for villagers, clear version for werewolves

---

### Story 1.2: Implement Message Scrambling Algorithm
**Priority:** Critical
**Status:** Not Started

**Description:**
Create an algorithm that scrambles villager chat messages during night to make them unreadable while maintaining the appearance of active chatting.

**Scrambling Approach:**
- Keep message length similar (so typing activity looks normal)
- Randomise characters/words
- Keep punctuation patterns
- Example: "I think John is suspicious" → "Zk vlpqw Xmnt ps uwlqpcnmw"

**Acceptance Criteria:**
- [ ] Scrambled messages are unreadable but look like real messages
- [ ] Scrambling is deterministic per game (same input = same output)
- [ ] Original message stored for game history/debug
- [ ] Scrambled version displayed to all non-werewolves

**Technical Tasks:**
1. Create scrambling function in `supabase/functions/send-chat/index.ts`
2. Store both `message` and `scrambled_message` in database
3. Client displays appropriate version based on player role

---

## Epic 2: Day Phase - No Chat

### Story 2.1: Disable Chat During Day Phase
**Priority:** High
**Status:** Not Started

**Current Behaviour:**
Chat is shown during day and voting phases

**Required Behaviour:**
- NO chat during day phase - discussion happens physically/verbally
- Voting interface shown during voting phase
- System messages still appear

**Acceptance Criteria:**
- [ ] Chat input disabled during day phase
- [ ] Message explaining "Discuss verbally with other players"
- [ ] System messages still visible
- [ ] Chat re-enabled when night falls

**Technical Tasks:**
1. Modify `GameScreen.tsx` to hide chat input during day
2. Show informational message instead
3. Keep system message area visible

---

## Epic 3: Shield Power - Player Choice

### Story 3.1: Add Shield Usage Interface During Night
**Priority:** High
**Status:** Not Started

**Current Behaviour:**
Shield is automatically used when player is attacked

**Required Behaviour:**
- Shield is a ONE-TIME use power available to ALL players (if enabled in settings)
- During ANY night phase, player can CHOOSE to activate their shield
- Once used, shield is gone forever
- Protects against all attacks that night (werewolves, witch poison)
- Werewolves can also use shield

**Acceptance Criteria:**
- [ ] Shield button visible during night if player has shield available
- [ ] Player can click to activate shield for that night
- [ ] Shield remains active until morning (protects all attacks)
- [ ] Shield marked as used after activation
- [ ] Visual indicator shows shield is active

**Technical Tasks:**
1. Add "Use Shield" action in `NightActionInterface.tsx`
2. Create `use-shield` Edge Function
3. Modify `process-night` to check for active shields
4. Update player UI to show shield status

---

## Epic 4: Anti-AFK Typing Rule (NEW)

### Story 4.1: Implement Minimum Typing Requirement During Night
**Priority:** High
**Status:** Not Started

**Description:**
To prevent players from staying silent to detect who the werewolves are (by watching who's typing), ALL players must type minimum 3 words every 5 seconds during night phase.

**Game Rule:**
- During night phase, every player must type at least 3 words every 5 seconds
- A countdown warning appears if they haven't typed enough
- If they fail to meet requirement, they are AUTO-KILLED by "lightning"
- This death CANNOT be prevented by any power (doctor, shield, etc.)
- Fun flavour: "Struck down by the Grand Wizard for failing to follow the rules of the land!"

**Acceptance Criteria:**
- [ ] Word counter tracks words typed in current 5-second window
- [ ] Warning appears when < 3 words typed and time running out
- [ ] Countdown timer visible when player is at risk
- [ ] Auto-elimination triggers if requirement not met
- [ ] Death message shows "⚡ [Player] was struck by lightning! The Grand Wizard does not tolerate silence!"
- [ ] This death bypasses all protections

**Technical Tasks:**
1. Add word tracking state in `Chat.tsx` component
2. Add 5-second interval timer during night phase
3. Show warning UI with countdown
4. Create `lightning-strike` Edge Function for auto-elimination
5. Add special death type in database
6. Display fun death message in chat

---

### Story 4.2: Lightning Strike Death UI/UX
**Priority:** Medium
**Status:** Not Started

**Description:**
Create dramatic visual feedback when a player is struck by lightning.

**Acceptance Criteria:**
- [ ] Lightning animation/visual effect on elimination
- [ ] Unique death message with Grand Wizard lore
- [ ] Eliminated player sees explanation of why they were killed
- [ ] Other players see public death announcement

---

## Epic 5: Voting Phase Improvements

### Story 5.1: Voting Timer (2 Minutes) and Auto-Transition
**Priority:** Medium
**Status:** Partially Implemented

**Current State:**
Timer is 120 seconds (correct), needs verification of auto-transition on no majority

**Required Behaviour:**
- 2 minute (120 second) voting countdown
- If no majority when timer expires, night phase starts automatically
- No elimination occurs if tie/no majority

**Acceptance Criteria:**
- [ ] Verify 2-minute voting timer
- [ ] Auto-transition to night if no majority
- [ ] System message: "No majority reached. Night falls without an elimination."
- [ ] Clear vote results display

---

## Implementation Order

1. **Story 1.1 & 1.2** - Night Chat System (enables core gameplay)
2. **Story 2.1** - Day Phase No Chat
3. **Story 3.1** - Shield Player Choice
4. **Story 4.1 & 4.2** - Anti-AFK Lightning Rule
5. **Story 5.1** - Voting Timer Verification

---

## Database Changes Required

### Table: `chat_messages`
Add column: `scrambled_message TEXT` - stores scrambled version for villagers

### Table: `players`
Add column: `shield_active BOOLEAN DEFAULT FALSE` - tracks if shield is activated this night
Existing: `has_shield BOOLEAN` - tracks if shield is available (not used yet)

### Table: `games`  
No changes needed

---

## Notes

- The anti-AFK rule is unique and adds a fun strategic element
- The Grand Wizard flavour text adds personality to the game
- These changes significantly alter the night phase gameplay
- Testing with real players in the same room is essential
