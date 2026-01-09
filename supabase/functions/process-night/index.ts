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

    if (game?.phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Not in night phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all night actions
    const { data: actions } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', gameId)

    // Get all alive players
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
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

    // Clear night actions
    await supabase
      .from('night_actions')
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
      // Transition to day phase
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
