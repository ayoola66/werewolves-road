import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function assignRoles(playerCount: number, settings: any) {
  const roles = []
  const werewolfCount = settings.werewolfCount || Math.floor(playerCount / 3)
  
  for (let i = 0; i < werewolfCount; i++) {
    roles.push('werewolf')
  }
  
  if (settings.hasSeer) roles.push('seer')
  if (settings.hasDoctor) roles.push('doctor')
  
  while (roles.length < playerCount) {
    roles.push('villager')
  }
  
  return shuffleArray(roles)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, playerId } = await req.json()
    
    if (!gameId || !playerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: player } = await supabase
      .from('players')
      .select('is_host')
      .eq('id', playerId)
      .eq('game_id', gameId)
      .single()

    if (!player?.is_host) {
      return new Response(
        JSON.stringify({ error: 'Only host can start the game' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)

    if (!players || players.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 players to start' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const roles = assignRoles(players.length, game.settings)
    
    for (let i = 0; i < players.length; i++) {
      await supabase
        .from('players')
        .update({ role: roles[i] })
        .eq('id', players[i].id)
    }

    await supabase
      .from('games')
      .update({ 
        status: 'in_progress',
        phase: 'night',
        current_day: 1
      })
      .eq('id', gameId)

    await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        message: '🎮 The game has started! Roles are being revealed...',
        type: 'system'
      })

    await supabase
      .from('chat_messages')
      .insert({
        game_id: gameId,
        message: '🌙 Night falls... Werewolves, choose your target.',
        type: 'system'
      })

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
