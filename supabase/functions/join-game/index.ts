import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerName } = await req.json() as { gameCode: string; playerName: string }
    
    if (!gameCode || !playerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    if (game.status !== 'waiting') {
      return new Response(
        JSON.stringify({ error: 'Game already started' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if name is taken
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('name')
      .eq('game_id', game.id)

    if (existingPlayers?.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Name already taken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a unique player_id
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Create player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        player_id: playerId,
        name: playerName,
        is_host: false,
        is_alive: true
      })
      .select()
      .single()

    if (playerError) throw playerError

    // Add join message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `👋 ${playerName} joined the game`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        game,
        player,
        playerId: playerId
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
