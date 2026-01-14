import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, assignRoles } from '../_shared/utils.ts'

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

    // Get all players for debugging
    const { data: allPlayers } = await supabase
      .from('players')
      .select('player_id, name, is_host')
      .eq('game_id', game.id)

    // Verify player is host - use player_id field (text) not id (integer)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('is_host, player_id, name')
      .eq('player_id', playerId)
      .eq('game_id', game.id)
      .single()

    if (playerError || !player) {
      // Try alternative: check if host_id matches
      if (game.host_id === playerId) {
        // Find player by host_id
        const { data: hostPlayer, error: hostError } = await supabase
          .from('players')
          .select('is_host, player_id, name')
          .eq('player_id', game.host_id)
          .eq('game_id', game.id)
          .single()
        
        if (hostError || !hostPlayer) {
          const playerList = allPlayers?.map(p => `${p.name} (${p.player_id})`).join(', ') || 'none'
          return new Response(
            JSON.stringify({ 
              error: 'Player not found in game',
              debug: {
                requestedPlayerId: playerId,
                gameHostId: game.host_id,
                gameId: game.id,
                playersInGame: playerList
              }
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        // Use host player found by host_id
        if (!hostPlayer.is_host) {
          return new Response(
            JSON.stringify({ error: 'Player found but is not marked as host' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        // Assign hostPlayer to player variable
        player = hostPlayer
      } else {
        const playerList = allPlayers?.map(p => `${p.name} (${p.player_id})`).join(', ') || 'none'
        return new Response(
          JSON.stringify({ 
            error: 'Player not found in game',
            debug: {
              requestedPlayerId: playerId,
              gameHostId: game.host_id,
              gameId: game.id,
              playersInGame: playerList,
              playerError: playerError?.message
            }
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!player.is_host) {
      return new Response(
        JSON.stringify({ error: 'Only host can start the game' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all players for the game
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)

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

    // Phase timers (in seconds)
    const PHASE_TIMERS = {
      role_reveal: 15,
      night: 120,
      day: 180,
      voting: 120,
      voting_results: 15
    }

    // Update game status - start with role_reveal phase
    const phaseTimer = PHASE_TIMERS.role_reveal
    const phaseEndTime = new Date(Date.now() + phaseTimer * 1000)
    
    const { error: updateError } = await supabase
      .from('games')
      .update({ 
        status: 'playing',
        current_phase: 'role_reveal',
        phase_timer: phaseTimer,
        phase_end_time: phaseEndTime.toISOString(),
        night_count: 0,
        day_count: 0
      })
      .eq('id', game.id)

    if (updateError) throw updateError

    // Add system message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: '🎮 The game has started! Roles are being revealed...',
        type: 'system'
      })

    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: '🌙 Night falls... Werewolves, choose your target.',
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        gameCode: game.game_code,
        gameId: game.id
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
