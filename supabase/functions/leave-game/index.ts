import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

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

    // Find game
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

    // Verify player exists in game - check by player_id (text field)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_id', playerId)
      .single()

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in game' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Remove player from game
    const { error: deleteError } = await supabase
      .from('players')
      .delete()
      .eq('game_id', game.id)
      .eq('player_id', playerId)

    if (deleteError) {
      throw deleteError
    }

    // Add leave message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `👋 ${player.name || 'Player'} left the game`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Player removed from game'
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
