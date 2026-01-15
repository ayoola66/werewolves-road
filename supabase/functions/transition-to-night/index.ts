import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, checkWinCondition } from '../_shared/utils.ts'

// This function transitions from voting_results phase to night phase
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode } = await req.json() as { gameCode: string }
    
    if (!gameCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: gameCode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createSupabaseClient(req)

    // Get game by game_code
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

    // Only process if in voting_results phase
    if (game.current_phase !== 'voting_results') {
      return new Response(
        JSON.stringify({ error: 'Not in voting_results phase', currentPhase: game.current_phase }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check win condition first
    const { data: alivePlayers } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_alive', true)

    if (!alivePlayers || alivePlayers.length === 0) {
      // No players alive - game over
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          current_phase: 'game_over'
        })
        .eq('id', game.id)

      return new Response(
        JSON.stringify({ success: true, gameOver: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const winCheck = checkWinCondition(alivePlayers)

    if (winCheck.gameOver) {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          current_phase: 'game_over'
        })
        .eq('id', game.id)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: `🎉 Game Over! ${winCheck.winner === 'villagers' ? 'Villagers' : 'Werewolves'} win!`,
          type: 'system'
        })

      return new Response(
        JSON.stringify({ success: true, gameOver: true, winner: winCheck.winner }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No win condition - transition to night phase
    const PHASE_TIMERS = {
      night: 120
    }

    const newNight = (game.night_count || 0) + 1
    const phaseTimer = PHASE_TIMERS.night
    const phaseEndTime = new Date(Date.now() + phaseTimer * 1000)
    
    await supabase
      .from('games')
      .update({ 
        current_phase: 'night',
        phase_timer: phaseTimer,
        phase_end_time: phaseEndTime.toISOString(),
        night_count: newNight,
        last_phase_change: new Date().toISOString()
      })
      .eq('id', game.id)

    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `🌙 Night ${newNight} falls... Werewolves, choose your target.`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ success: true, phase: 'night', nightCount: newNight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
