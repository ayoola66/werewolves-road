import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

/**
 * Lightning Strike - Auto-eliminate a player who failed to type during night phase.
 * 
 * Game Rule:
 * - During night phase, ALL players must type minimum 3 words every 5 seconds
 * - This prevents players from staying silent to detect werewolves by watching who types
 * - If a player fails this requirement, they are struck by lightning
 * - This death CANNOT be prevented by ANY power (shield, doctor, etc.)
 * - Flavour: "The Grand Wizard does not tolerate silence in his realm!"
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerId, reason } = await req.json() as { 
      gameCode: string; 
      playerId: string;
      reason?: string;
    }
    
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

    // Verify game is in night phase (lightning only strikes at night)
    if (game.current_phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Lightning can only strike during night phase' }),
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
        JSON.stringify({ error: 'Player is already dead' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kill the player - NO protection can save them from the Grand Wizard!
    await supabase
      .from('players')
      .update({ is_alive: false })
      .eq('player_id', playerId)

    // Remove shield if they had one (it didn't help!)
    if (player.has_shield) {
      await supabase
        .from('players')
        .update({ has_shield: false })
        .eq('player_id', playerId)
    }

    // Add dramatic system message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `⚡ LIGHTNING STRIKE! ⚡ ${player.name} was struck down by the Grand Wizard for failing to follow the ancient laws of the realm! The Grand Wizard demands all voices be heard during the night - silence is not permitted!`,
        type: 'death'
      })

    // Optional: Send private message to the eliminated player
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        player_id: playerId,
        player_name: player.name,
        message: `⚡ You have been eliminated by the Grand Wizard! You failed to type the minimum 3 words within the required time. The ancient laws demand participation from all villagers, lest the werewolves go undetected. Better luck next time, mortal!`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Player struck by lightning!',
        playerName: player.name
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
