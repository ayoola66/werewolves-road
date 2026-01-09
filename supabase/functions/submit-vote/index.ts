import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, voterId, targetId } = await req.json()
    
    const supabase = createSupabaseClient(req)

    // Verify game is in voting phase
    const { data: game } = await supabase
      .from('games')
      .select('phase')
      .eq('id', gameId)
      .single()

    if (game?.phase !== 'voting') {
      return new Response(
        JSON.stringify({ error: 'Can only vote during voting phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if vote already exists
    const { data: existing } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', gameId)
      .eq('voter_id', voterId)

    if (existing && existing.length > 0) {
      // Update existing vote
      await supabase
        .from('votes')
        .update({ target_id: targetId })
        .eq('id', existing[0].id)
    } else {
      // Create new vote
      await supabase
        .from('votes')
        .insert({
          game_id: gameId,
          voter_id: voterId,
          target_id: targetId
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
