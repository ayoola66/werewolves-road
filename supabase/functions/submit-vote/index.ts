import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerId, targetId } = await req.json() as { gameCode: string; playerId: string; targetId: string }
    
    if (!gameCode || !playerId || !targetId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gameCode, playerId, and targetId' }),
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

    // Verify game is in voting phase
    if (game.current_phase !== 'voting') {
      return new Response(
        JSON.stringify({ error: 'Can only vote during voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate player is alive
    const { data: player } = await supabase
      .from('players')
      .select('is_alive')
      .eq('player_id', playerId)
      .eq('game_id', game.id)
      .single()

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in game' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!player.is_alive) {
      return new Response(
        JSON.stringify({ error: 'Dead players cannot vote' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if vote already exists
    const { data: existing } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', game.id)
      .eq('voter_id', playerId)

    if (existing && existing.length > 0) {
      // Update existing vote
      await supabase
        .from('votes')
        .update({ target_id: targetId })
        .eq('id', existing[0].id)
    } else {
      // Create new vote
      await supabase
        .from('votes')
        .insert({
          game_id: game.id,
          voter_id: playerId,
          target_id: targetId,
          phase: 'voting'
        })
    }

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
