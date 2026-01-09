import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function checkWinCondition(alivePlayers: any[]) {
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf').length
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'werewolf').length
  
  if (aliveWerewolves === 0) {
    return { gameOver: true, winner: 'villagers' }
  }
  
  if (aliveWerewolves >= aliveVillagers) {
    return { gameOver: true, winner: 'werewolves' }
  }
  
  return { gameOver: false, winner: null }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (game?.phase !== 'voting') {
      return new Response(
        JSON.stringify({ error: 'Not in voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', gameId)

    const voteCounts = new Map<number, number>()
    votes?.forEach((vote: any) => {
      voteCounts.set(vote.target_id, (voteCounts.get(vote.target_id) || 0) + 1)
    })

    let eliminatedId: number | null = null
    let maxVotes = 0
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count
        eliminatedId = playerId
      }
    })

    if (eliminatedId) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('id', eliminatedId)

      const { data: eliminatedPlayer } = await supabase
        .from('players')
        .select('name, role')
        .eq('id', eliminatedId)
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

    await supabase
      .from('votes')
      .delete()
      .eq('game_id', gameId)

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
      const newDay = (game.current_day || 0) + 1
      await supabase
        .from('games')
        .update({ 
          phase: 'night',
          current_day: newDay
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
