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

    // Handle empty actions array
    if (!actions || !Array.isArray(actions)) {
      // No actions submitted, just transition to day
      const PHASE_TIMERS = {
        role_reveal: 15,
        night: 120,
        day: 180,
        voting: 120,
        voting_results: 15
      }

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
          message: '☀️ Day breaks. No actions were taken during the night.',
          type: 'system'
        })

      return new Response(
        JSON.stringify({ success: true, phase: 'day' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all players (alive and dead) to check shields, roles, etc.
    const { data: allPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)

    // Handle empty players array
    if (!allPlayers || !Array.isArray(allPlayers) || allPlayers.length === 0) {
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

    // Filter alive players
    const players = allPlayers.filter(p => p.is_alive)

    // Process actions in priority order
    let killedPlayerId: string | null = null
    let doctorSaveTargetId: string | null = null
    let bodyguardProtectTargetId: string | null = null
    let bodyguardPlayerId: string | null = null
    let witchSaveTargetId: string | null = null
    let witchPoisonTargetId: string | null = null
    let investigationResult: string | null = null
    const deaths: string[] = []
    const messages: string[] = []

    // 1. Find werewolf kill
    const killAction = actions.find(a => a.action_type === 'kill')
    if (killAction) {
      killedPlayerId = killAction.target_id
    }

    // 2. Find witch save (processed before kill)
    const witchSaveAction = actions.find(a => a.action_type === 'save' && 
      allPlayers.find(p => p.player_id === a.player_id)?.role === 'witch')
    if (witchSaveAction) {
      witchSaveTargetId = witchSaveAction.target_id
      const witch = allPlayers.find(p => p.player_id === witchSaveAction.player_id)
      if (witch && !witch.action_used) {
        // Mark witch action as used
        await supabase
          .from('players')
          .update({ action_used: true })
          .eq('player_id', witch.player_id)
      }
    }

    // 3. Find doctor protection/save
    const doctorAction = actions.find(a => 
      (a.action_type === 'protect' || a.action_type === 'save') &&
      allPlayers.find(p => p.player_id === a.player_id)?.role === 'doctor')
    if (doctorAction) {
      doctorSaveTargetId = doctorAction.target_id
    }

    // 4. Find bodyguard protection
    const bodyguardAction = actions.find(a => a.action_type === 'protect' &&
      allPlayers.find(p => p.player_id === a.player_id)?.role === 'bodyguard')
    if (bodyguardAction) {
      bodyguardProtectTargetId = bodyguardAction.target_id
      bodyguardPlayerId = bodyguardAction.player_id
    }

    // 5. Find seer investigation
    const investigateAction = actions.find(a => a.action_type === 'investigate')
    if (investigateAction) {
      const target = allPlayers.find(p => p.player_id === investigateAction.target_id)
      investigationResult = target?.role === 'werewolf' ? 'werewolf' : 'not werewolf'
      const seer = allPlayers.find(p => p.player_id === investigateAction.player_id)
      if (seer && target) {
        messages.push(`🔮 The seer investigated ${target.name} and discovered they are ${investigationResult === 'werewolf' ? 'a werewolf' : 'not a werewolf'}!`)
      }
    }

    // 6. Find witch poison (processed after kill)
    const witchPoisonAction = actions.find(a => a.action_type === 'poison' &&
      allPlayers.find(p => p.player_id === a.player_id)?.role === 'witch')
    if (witchPoisonAction) {
      witchPoisonTargetId = witchPoisonAction.target_id
      const witch = allPlayers.find(p => p.player_id === witchPoisonAction.player_id)
      if (witch && !witch.action_used) {
        // Mark witch action as used
        await supabase
          .from('players')
          .update({ action_used: true })
          .eq('player_id', witch.player_id)
      }
    }

    // Process kills in priority order:
    // 1. Check shield (highest priority - personal protection)
    // 2. Check witch save
    // 3. Check doctor save
    // 4. Apply werewolf kill
    // 5. Apply bodyguard death mechanic
    // 6. Apply witch poison

    if (killedPlayerId) {
      const target = allPlayers.find(p => p.player_id === killedPlayerId)
      
      // Check if target has shield (personal protection - highest priority)
      if (target?.has_shield) {
        messages.push(`🛡️ ${target.name} used their shield and survived the attack!`)
        // Remove shield after use
        await supabase
          .from('players')
          .update({ has_shield: false })
          .eq('player_id', killedPlayerId)
      }
      // Check witch save (processed before kill)
      else if (killedPlayerId === witchSaveTargetId) {
        messages.push(`🧪 The witch saved ${target?.name || 'someone'} from death!`)
        killedPlayerId = null // Prevent kill
      }
      // Check doctor save
      else if (killedPlayerId === doctorSaveTargetId) {
        messages.push(`💊 The doctor saved ${target?.name || 'someone'} from death!`)
        killedPlayerId = null // Prevent kill
      }
      // Check bodyguard protection
      else if (killedPlayerId === bodyguardProtectTargetId && bodyguardPlayerId) {
        const bodyguard = allPlayers.find(p => p.player_id === bodyguardPlayerId)
        // Bodyguard dies protecting
        deaths.push(bodyguardPlayerId)
        messages.push(`🛡️ ${bodyguard?.name || 'The bodyguard'} died protecting ${target?.name || 'someone'}!`)
        
        // Check if protected player has shield or doctor save
        const protectedPlayer = allPlayers.find(p => p.player_id === bodyguardProtectTargetId)
        if (protectedPlayer?.has_shield) {
          messages.push(`🛡️ ${protectedPlayer.name} used their shield and survived!`)
          await supabase
            .from('players')
            .update({ has_shield: false })
            .eq('player_id', bodyguardProtectTargetId)
        } else if (bodyguardProtectTargetId === doctorSaveTargetId) {
          messages.push(`💊 The doctor saved ${protectedPlayer?.name || 'someone'}!`)
        } else {
          // Protected player also dies
          deaths.push(bodyguardProtectTargetId)
          messages.push(`💀 ${protectedPlayer?.name || 'Someone'} died alongside their bodyguard!`)
        }
        killedPlayerId = null // Werewolf kill prevented by bodyguard
      }
      // Apply werewolf kill
      else if (killedPlayerId) {
        deaths.push(killedPlayerId)
        messages.push(`💀 ${target?.name || 'Someone'} was killed during the night!`)
      }
    }

    // Apply witch poison (after kill processing)
    if (witchPoisonTargetId) {
      const poisonedPlayer = allPlayers.find(p => p.player_id === witchPoisonTargetId)
      if (poisonedPlayer && poisonedPlayer.is_alive) {
        deaths.push(witchPoisonTargetId)
        messages.push(`☠️ ${poisonedPlayer.name} was poisoned by the witch!`)
      }
    }

    // Update all deaths
    for (const deadPlayerId of deaths) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('player_id', deadPlayerId)
    }

    // Insert all chat messages
    for (const message of messages) {
      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message,
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

    // Handle empty array case
    if (!alivePlayers || !Array.isArray(alivePlayers) || alivePlayers.length === 0) {
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
          message: '🎉 Game Over! No players remaining.',
          type: 'system'
        })

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
