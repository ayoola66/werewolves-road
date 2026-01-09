import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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
      .select('is_alive, name')
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

    // Create chat message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        player_id: playerId,
        player_name: player.name,
        message: message,
        type: channel === 'werewolf' ? 'werewolf' : 'player'
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
