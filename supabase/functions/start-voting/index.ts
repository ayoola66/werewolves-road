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

    // Validate game is in "day" phase
    if (game.phase !== 'day') {
      return new Response(
        JSON.stringify({ error: 'Voting can only be started during the day phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate game status is "playing"
    if (game.status !== 'playing') {
      return new Response(
        JSON.stringify({ error: 'Game is not in playing status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify player exists and is alive
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

    if (!player.is_alive) {
      return new Response(
        JSON.stringify({ error: 'Only alive players can start voting' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get vote duration from settings or use default (300 seconds = 5 minutes)
    const voteDuration = game.settings?.voteDuration || game.settings?.dayDuration || 300
    const phaseEndTime = new Date(Date.now() + voteDuration * 1000).toISOString()

    // Transition to voting phase
    const { error: updateError } = await supabase
      .from('games')
      .update({
        phase: 'voting',
        phase_timer: voteDuration,
        phase_end_time: phaseEndTime
      })
      .eq('id', game.id)

    if (updateError) {
      throw updateError
    }

    // Add phase change message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `⚖️ Voting phase has begun! Cast your votes.`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Voting phase started',
        phase: 'voting',
        timer: voteDuration
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
