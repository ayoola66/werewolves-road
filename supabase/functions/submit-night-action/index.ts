import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, actorId, targetId, actionType } = await req.json()
    
    const supabase = createSupabaseClient(req)

    // Verify game is in night phase
    const { data: game } = await supabase
      .from('games')
      .select('phase')
      .eq('id', gameId)
      .single()

    if (game?.phase !== 'night') {
      return new Response(
        JSON.stringify({ error: 'Can only perform night actions during night phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if action already exists
    const { data: existing } = await supabase
      .from('night_actions')
      .select('*')
      .eq('game_id', gameId)
      .eq('actor_id', actorId)
      .eq('action_type', actionType)

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
          game_id: gameId,
          actor_id: actorId,
          target_id: targetId,
          action_type: actionType
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
