import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

/**
 * Scrambles a message to make it unreadable while preserving length and structure.
 * Used for villager chat during night phase to hide who the werewolves are.
 * 
 * Algorithm:
 * - Replace letters with random letters (preserving case)
 * - Keep numbers, spaces, punctuation intact
 * - Keep word boundaries to make it look like real text
 */
function scrambleMessage(message: string, seed: number): string {
  const chars = message.split('')
  const scrambled: string[] = []
  
  // Use seeded random for deterministic scrambling per game
  let random = seed
  const nextRandom = () => {
    random = (random * 1103515245 + 12345) & 0x7fffffff
    return random / 0x7fffffff
  }
  
  for (const char of chars) {
    if (/[a-z]/.test(char)) {
      // Lowercase letter - replace with random lowercase
      const newChar = String.fromCharCode(97 + Math.floor(nextRandom() * 26))
      scrambled.push(newChar)
    } else if (/[A-Z]/.test(char)) {
      // Uppercase letter - replace with random uppercase
      const newChar = String.fromCharCode(65 + Math.floor(nextRandom() * 26))
      scrambled.push(newChar)
    } else {
      // Keep spaces, numbers, punctuation
      scrambled.push(char)
    }
  }
  
  return scrambled.join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerId, message, channel } = await req.json() as { gameCode: string; playerId: string; message: string; channel?: string }
    
    if (!gameCode || !playerId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gameCode, playerId, and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)

    // Find game by game_code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode.toUpperCase())
      .single()

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify player exists and is alive - use player_id field (text) not id (integer)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('is_alive, name, role')
      .eq('player_id', playerId)
      .eq('game_id', game.id)
      .single()

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in game' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!player.is_alive) {
      return new Response(
        JSON.stringify({ error: 'Dead players cannot send messages' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if chatting is allowed based on phase
    const currentPhase = game.current_phase
    const isWerewolf = player.role === 'werewolf' || player.role === 'minion'
    
    // Day phase: No chat allowed (physical discussion only)
    if (currentPhase === 'day') {
      return new Response(
        JSON.stringify({ error: 'Chat is disabled during day phase. Discuss verbally with other players!' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Voting phase: No chat allowed
    if (currentPhase === 'voting' || currentPhase === 'voting_results') {
      return new Response(
        JSON.stringify({ error: 'Chat is disabled during voting phase.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine message type and scrambling
    let messageType = 'player'
    let scrambledMessage: string | null = null
    
    if (currentPhase === 'night') {
      if (channel === 'werewolf' && isWerewolf) {
        // Werewolf channel - clear messages for werewolves only
        messageType = 'werewolf'
      } else {
        // Village channel during night - scramble messages
        messageType = 'scrambled'
        // Use game ID as seed for deterministic scrambling
        scrambledMessage = scrambleMessage(message, game.id)
      }
    }

    // Create chat message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        player_id: playerId,
        player_name: player.name,
        message: messageType === 'scrambled' ? scrambledMessage : message,
        original_message: messageType === 'scrambled' ? message : null,
        type: messageType
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
