import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, voterId, targetId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    const { data: existing } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', gameId)
      .eq('voter_id', voterId)

    if (existing && existing.length > 0) {
      await supabase
        .from('votes')
        .update({ target_id: targetId })
        .eq('id', existing[0].id)
    } else {
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
