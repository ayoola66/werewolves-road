import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, checkWinCondition } from '../_shared/utils.ts'

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

    // Allow processing if in night phase OR role_reveal phase (transition role_reveal → night)
    if (game.current_phase !== 'night' && game.current_phase !== 'role_reveal') {
      return new Response(
        JSON.stringify({ error: 'Not in night or role_reveal phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If in role_reveal phase, just transition to night without processing actions
    if (game.current_phase === 'role_reveal') {
      const PHASE_TIMERS = {
        role_reveal: 15,
        night: 120,
        day: 180,
        voting: 120,
        voting_results: 15
      }

      const phaseTimer = PHASE_TIMERS.night
      const phaseEndTime = new Date(Date.now() + phaseTimer * 1000)
      
      await supabase
        .from('games')
        .update({ 
          current_phase: 'night',
          phase_timer: phaseTimer,
          phase_end_time: phaseEndTime.toISOString(),
          night_count: 1,
          last_phase_change: new Date().toISOString()
        })
        .eq('id', game.id)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: '🌙 Night falls... Werewolves, choose your target.',
          type: 'system'
        })

      return new Response(
        JSON.stringify({ success: true, phase: 'night' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all night actions
    const { data: actions } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', game.id)

    // Get all alive players
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_alive', true)

    // Process actions
    let killedPlayerId: string | null = null
    let protectedPlayerId: string | null = null
    let investigationResult: string | null = null

    // Find werewolf kill
    const killAction = actions?.find(a => a.action_type === 'kill')
    if (killAction) {
      killedPlayerId = killAction.target_id
    }

    // Find doctor protection
    const protectAction = actions?.find(a => a.action_type === 'protect')
    if (protectAction) {
      protectedPlayerId = protectAction.target_id
    }

    // Find seer investigation
    const investigateAction = actions?.find(a => a.action_type === 'investigate')
    if (investigateAction) {
      const target = players?.find(p => p.player_id === investigateAction.target_id)
      investigationResult = target?.role === 'werewolf' ? 'werewolf' : 'not werewolf'
    }

    // Apply kill if not protected
    if (killedPlayerId && killedPlayerId !== protectedPlayerId) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('player_id', killedPlayerId)

      const killedPlayer = players?.find(p => p.player_id === killedPlayerId)
      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: `💀 ${killedPlayer?.name} was killed during the night!`,
          type: 'system'
        })
    } else if (killedPlayerId && killedPlayerId === protectedPlayerId) {
      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: `🛡️ The doctor saved someone from death!`,
          type: 'system'
        })
    }

    // Clear night actions
    await supabase
      .from('night_actions')
      .delete()
      .eq('game_id', game.id)

    // Check win condition
    const { data: alivePlayers } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_alive', true)

    const winCheck = checkWinCondition(alivePlayers || [])

    if (winCheck.gameOver) {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          current_phase: 'game_over'
        })
        .eq('id', gameId)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: `🎉 Game Over! ${winCheck.winner === 'villagers' ? 'Villagers' : 'Werewolves'} win!`,
          type: 'system'
        })
    } else {
      // Phase timers (in seconds)
      const PHASE_TIMERS = {
        role_reveal: 15,
        night: 120,
        day: 180,
        voting: 120,
        voting_results: 15
      }

      // Transition to day phase
      const phaseTimer = PHASE_TIMERS.day
      const phaseEndTime = new Date(Date.now() + phaseTimer * 1000)
      const newDayCount = (game.day_count || 0) + 1
      
      await supabase
        .from('games')
        .update({ 
          current_phase: 'day',
          phase_timer: phaseTimer,
          phase_end_time: phaseEndTime.toISOString(),
          day_count: newDayCount,
          last_phase_change: new Date().toISOString()
        })
        .eq('id', game.id)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: '☀️ Day breaks. Discuss and vote to eliminate a suspect.',
          type: 'system'
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        investigationResult
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
