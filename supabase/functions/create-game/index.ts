import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, generateGameCode } from '../_shared/utils.ts'
import { GameSettings } from '../_shared/types.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { playerName, hostName, settings } = await req.json() as { playerName?: string; hostName?: string; settings: GameSettings }
    
    // Support both playerName and hostName for backwards compatibility
    const name = playerName || hostName
    
    if (!name || !settings) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: playerName and settings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createSupabaseClient(req)
    const gameCode = generateGameCode()
    
    // Generate a unique player_id first (needed for host_id)
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Create game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_code: gameCode,
        host_id: playerId,
        status: 'waiting',
        current_phase: 'lobby',
        settings: settings,
        night_count: 0,
        day_count: 0
      })
      .select()
      .single()

    if (gameError) throw gameError

    // Create host player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        player_id: playerId,
        name: name,
        is_host: true,
        is_alive: true
      })
      .select()
      .single()

    if (playerError) throw playerError

    // Create welcome message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `🎮 Game created! Code: ${gameCode}`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        game,
        player,
        gameCode,
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
