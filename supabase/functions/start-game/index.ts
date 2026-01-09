import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, assignRoles } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, playerId } = await req.json() as { gameId: number; playerId: number }
    
    if (!gameId || !playerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)

    // Verify player is host
    const { data: player } = await supabase
      .from('players')
      .select('is_host')
      .eq('id', playerId)
      .eq('game_id', gameId)
      .single()

    if (!player?.is_host) {
      return new Response(
        JSON.stringify({ error: 'Only host can start the game' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get game and players
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)

    if (!players || players.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 players to start' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign roles
    const roles = assignRoles(players.length, game.settings)
    
    for (let i = 0; i < players.length; i++) {
      await supabase
        .from('players')
        .update({ role: roles[i] })
        .eq('id', players[i].id)
    }

    // Update game status
    await supabase
      .from('games')
      .update({ 
        status: 'in_progress',
        phase: 'night',
        current_day: 1
      })
      .eq('id', gameId)

    // Add system message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        message: '🎮 The game has started! Roles are being revealed...',
        type: 'system'
      })

    await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        message: '🌙 Night falls... Werewolves, choose your target.',
        type: 'system'
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
