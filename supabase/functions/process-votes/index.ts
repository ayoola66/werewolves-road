import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, checkWinCondition } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId } = await req.json()
    
    const supabase = createSupabaseClient(req)

    // Get game
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (game?.current_phase !== 'voting') {
      return new Response(
        JSON.stringify({ error: 'Not in voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all votes
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', gameId)

    // Count votes - target_id is TEXT (player_id string), not integer
    const voteCounts = new Map<string, number>()
    votes?.forEach(vote => {
      voteCounts.set(vote.target_id, (voteCounts.get(vote.target_id) || 0) + 1)
    })

    // Find player with most votes
    let eliminatedPlayerId: string | null = null
    let maxVotes = 0
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count
        eliminatedPlayerId = playerId
      }
    })

    if (eliminatedPlayerId) {
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
          game_id: gameId,
          message: `⚖️ ${eliminatedPlayer?.name} was eliminated! They were a ${eliminatedPlayer?.role}.`,
          type: 'system'
        })
    } else {
      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          message: `🤷 No one was eliminated (tie vote or no votes).`,
          type: 'system'
        })
    }

    // Clear votes
    await supabase
      .from('votes')
      .delete()
      .eq('game_id', gameId)

    // Check win condition
    const { data: alivePlayers } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_alive', true)

    const winCheck = checkWinCondition(alivePlayers || [])

    if (winCheck.gameOver) {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          phase: 'game_over'
        })
        .eq('id', gameId)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          message: `🎉 Game Over! ${winCheck.winner === 'villagers' ? 'Villagers' : 'Werewolves'} win!`,
          type: 'system'
        })
    } else {
      // Transition to night phase
      const newNight = (game.night_count || 0) + 1
      await supabase
        .from('games')
        .update({ 
          phase: 'night',
          night_count: newNight
        })
        .eq('id', gameId)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          message: `🌙 Night ${newDay} falls... Werewolves, choose your target.`,
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
