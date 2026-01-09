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

    if (game?.phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Not in night phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: actions } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', gameId)

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_alive', true)

    let killedPlayerId: number | null = null
    let protectedPlayerId: number | null = null
    let investigationResult: string | null = null

    const killAction = actions?.find((a: any) => a.action_type === 'kill')
    if (killAction) {
      killedPlayerId = killAction.target_id
    }

    const protectAction = actions?.find((a: any) => a.action_type === 'protect')
    if (protectAction) {
      protectedPlayerId = protectAction.target_id
    }

    const investigateAction = actions?.find((a: any) => a.action_type === 'investigate')
    if (investigateAction) {
      const target = players?.find((p: any) => p.id === investigateAction.target_id)
      investigationResult = target?.role === 'werewolf' ? 'werewolf' : 'not werewolf'
    }

    if (killedPlayerId && killedPlayerId !== protectedPlayerId) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('id', killedPlayerId)

      const killedPlayer = players?.find((p: any) => p.id === killedPlayerId)
      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          message: `💀 ${killedPlayer?.name} was killed during the night!`,
          type: 'system'
        })
    } else if (killedPlayerId && killedPlayerId === protectedPlayerId) {
      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          message: `🛡️ The doctor saved someone from death!`,
          type: 'system'
        })
    }

    await supabase
      .from('night_actions')
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
      await supabase
        .from('games')
        .update({ phase: 'day' })
        .eq('id', gameId)

      await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
