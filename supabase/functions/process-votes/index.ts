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

    if (game.current_phase !== 'voting') {
      return new Response(
        JSON.stringify({ error: 'Not in voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all votes
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', game.id)

    // Get all players to check for sheriff bonus
    const { data: allPlayers } = await supabase
      .from('players')
      .select('player_id, is_sheriff')
      .eq('game_id', game.id)

    // Count votes with sheriff bonus - target_id is TEXT (player_id string), not integer
    const voteCounts = new Map<string, number>()
    votes?.forEach(vote => {
      const currentCount = voteCounts.get(vote.target_id) || 0
      // Check if voter is sheriff - sheriff vote counts as 2
      const voter = allPlayers?.find(p => p.player_id === vote.voter_id)
      const voteWeight = voter?.is_sheriff ? 2 : 1
      voteCounts.set(vote.target_id, currentCount + voteWeight)
    })

    // Find player(s) with most votes - check for ties
    let eliminatedPlayerId: string | null = null
    let maxVotes = 0
    const playersWithMaxVotes: string[] = []
    
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count
        playersWithMaxVotes.length = 0
        playersWithMaxVotes.push(playerId)
      } else if (count === maxVotes && maxVotes > 0) {
        playersWithMaxVotes.push(playerId)
      }
    })

    // If tie (multiple players with same max votes), no elimination
    if (playersWithMaxVotes.length > 1) {
      eliminatedPlayerId = null
    } else if (playersWithMaxVotes.length === 1) {
      eliminatedPlayerId = playersWithMaxVotes[0]
    }

    if (eliminatedPlayerId && maxVotes > 0) {
      // Eliminate player - use player_id field (text) not id (integer)
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('player_id', eliminatedPlayerId)

      const { data: eliminatedPlayer } = await supabase
        .from('players')
        .select('name, role')
        .eq('player_id', eliminatedPlayerId)
        .single()

      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: `⚖️ ${eliminatedPlayer?.name} was eliminated! They were a ${eliminatedPlayer?.role}.`,
          type: 'system'
        })
    } else {
      // Tie vote or no votes - no elimination
      const tieMessage = maxVotes > 0 
        ? `🤷 No one was eliminated (tie vote - ${playersWithMaxVotes.length} players tied with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}).`
        : `🤷 No one was eliminated (no votes cast).`
      
      await supabase
        .from('chat_messages')
        .insert({
          game_id: game.id,
          message: tieMessage,
          type: 'system'
        })
    }

    // Clear votes
    await supabase
      .from('votes')
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
        voting_results: 10  // Changed from 15 to 10 seconds
      }

      // Transition to night phase
      const newNight = (game.night_count || 0) + 1
      const newDayCount = (game.day_count || 0) + 1
      const phaseTimer = PHASE_TIMERS.night
      const phaseEndTime = new Date(Date.now() + phaseTimer * 1000)
      
      await supabase
        .from('games')
        .update({ 
          current_phase: 'night',
          phase_timer: phaseTimer,
          phase_end_time: phaseEndTime.toISOString(),
          night_count: newNight,
          day_count: newDayCount,
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
    }

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
