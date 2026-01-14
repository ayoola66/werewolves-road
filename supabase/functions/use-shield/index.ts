import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

/**
 * Activates a player's shield for the current night.
 * 
 * Shield Rules:
 * - One-time use per game (if enabled in settings)
 * - Available to ALL players including werewolves
 * - Must be activated BEFORE attacks are processed
 * - Protects against werewolf kill, witch poison, etc.
 * - Cannot be used once has_shield is false
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerId } = await req.json() as { gameCode: string; playerId: string }
    
    if (!gameCode || !playerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gameCode and playerId' }),
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

    // Verify game is in night phase
    if (game.current_phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Shield can only be activated during night phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify player exists and is alive
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
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
        JSON.stringify({ error: 'Dead players cannot use shield' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if player has shield available
    if (!player.has_shield) {
      return new Response(
        JSON.stringify({ error: 'You have already used your shield' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Activate shield - mark it as used
    // The shield is checked in process-night when resolving kills
    // We don't remove has_shield yet - process-night will do that when the shield actually blocks an attack
    // For now, we record this as a night action of type 'shield'
    
    // Check if player already submitted a shield action this night
    const { data: existingAction } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_id', playerId)
      .eq('action_type', 'shield')
      .eq('night_number', game.night_count)
      .single()

    if (existingAction) {
      return new Response(
        JSON.stringify({ error: 'Shield already activated for this night' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record shield activation as a night action
    await supabase
      .from('night_actions')
      .insert({
        game_id: game.id,
        player_id: playerId,
        action_type: 'shield',
        target_id: playerId, // Target self
        night_number: game.night_count
      })

    // Add system message (only visible to this player in logs)
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        player_id: playerId,
        player_name: player.name,
        message: `🛡️ You have activated your shield. You are protected tonight!`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Shield activated! You are protected tonight.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
