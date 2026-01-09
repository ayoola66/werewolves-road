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
  
  // Add werewolves
  const werewolfCount = settings.werewolfCount || Math.floor(playerCount / 3)
  for (let i = 0; i < werewolfCount; i++) {
    roles.push('werewolf')
  }
  
  // Add special roles
  if (settings.hasSeer) roles.push('seer')
  if (settings.hasDoctor) roles.push('doctor')
  
  // Fill remaining with villagers
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
    const { gameCode, playerId } = await req.json() as { gameCode: string; playerId: string }
    
    if (!gameCode || !playerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: gameCode and playerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Verify player is host - use player_id field (text) not id (integer)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('is_host')
      .eq('player_id', playerId)
      .eq('game_id', game.id)
      .single()

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in game' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!player.is_host) {
      return new Response(
        JSON.stringify({ error: 'Only host can start the game' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all players for the game
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)

    if (!players || players.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 players to start' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign roles
    const roles = assignRoles(players.length, game.settings)
    
    for (let i = 0; i < players.length; i++) {
      await supabase
        .from('players')
        .update({ role: roles[i] })
        .eq('id', players[i].id)
    }

    // Update game status
    const { error: updateError } = await supabase
      .from('games')
      .update({ 
        status: 'playing',
        phase: 'night',
        current_day: 1
      })
      .eq('id', game.id)

    if (updateError) throw updateError

    // Add system message
    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: '🎮 The game has started! Roles are being revealed...',
        type: 'system'
      })

    await supabase
      .from('chat_messages')
      .insert({
        game_id: game.id,
        message: '🌙 Night falls... Werewolves, choose your target.',
        type: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        gameCode: game.game_code,
        gameId: game.id
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
