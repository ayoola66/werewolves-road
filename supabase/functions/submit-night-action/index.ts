import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCode, playerId, targetId, action } = await req.json() as { gameCode: string; playerId: string; targetId: string; action: string }
    
    if (!gameCode || !playerId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gameCode, playerId, and action' }),
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

    // Verify game is in night phase
    if (game.current_phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Can only perform night actions during night phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate player is alive
    const { data: player } = await supabase
      .from('players')
      .select('is_alive, role')
      .eq('player_id', playerId)
      .eq('game_id', game.id)
      .single()

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in game' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!player.is_alive) {
      return new Response(
        JSON.stringify({ error: 'Dead players cannot perform actions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role can perform this action
    const roleActionMap: Record<string, string[]> = {
      werewolf: ['kill'],
      doctor: ['save', 'protect'],
      seer: ['investigate'],
      bodyguard: ['protect'],
      witch: ['save', 'poison']
    }

    const allowedActions = roleActionMap[player.role || ''] || []
    if (!allowedActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Role '${player.role}' cannot perform action '${action}'. Allowed actions: ${allowedActions.join(', ')}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if action already exists
    const { data: existing } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', game.id)
      .eq('player_id', playerId)
      .eq('action_type', action)

    if (existing && existing.length > 0) {
      // Update existing action
      await supabase
        .from('night_actions')
        .update({ target_id: targetId })
        .eq('id', existing[0].id)
    } else {
      // Create new action
      await supabase
        .from('night_actions')
        .insert({
          game_id: game.id,
          player_id: playerId,
          target_id: targetId,
          action_type: action,
          phase: 'night'
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
