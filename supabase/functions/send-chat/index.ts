import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, playerId, message } = await req.json()
    
    const supabase = createSupabaseClient(req)

    // Verify player exists and is alive
    const { data: player } = await supabase
      .from('players')
      .select('is_alive, name')
      .eq('id', playerId)
      .eq('game_id', gameId)
      .single()

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!player.is_alive) {
      return new Response(
        JSON.stringify({ error: 'Dead players cannot send messages' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create chat message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        player_id: playerId,
        message: message,
        type: 'player'
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
