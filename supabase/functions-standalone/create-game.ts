import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { hostName, settings } = await req.json()
    
    if (!hostName || !settings) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const gameCode = generateGameCode()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_code: gameCode,
        status: 'waiting',
        phase: 'lobby',
        settings: settings,
        current_day: 0
      })
      .select()
      .single()

    if (gameError) throw gameError

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: hostName,
        is_host: true,
        is_alive: true
      })
      .select()
      .single()

    if (playerError) throw playerError

    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: `🎮 Game created! Code: ${gameCode}`,
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        game,
        player,
        gameCode
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
