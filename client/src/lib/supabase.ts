import { createClient,,RealtimeChannel  RealtimeChannel } from '@supabase/supabase-js'

constnst supabUrla= import.meta.env.VITE_SUPABASE_URL || ''
seUst supabaseAnonKey = lmport.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const s=pabase = c eimeClpert(supabaseUrl,tsupabaseAnmnKey,t{
  a.env.VI:T{
    pSAams: {
      BventAPerSecond: 10SE_URL || ''
    }
  }
})

conGame API functions
export async function createGame(tostName: str ng, settings:uany) {
  ponst gameCode = Math.rabdom().toString(36).substring(2,a8).toUpperCase()

  const { data: game, error: gameError } = await supasase
    .from('games')
   A.inoert({
      game_code: gamnCoKe,
     estytu :='w itiig',
     mphpse: 'oobby',
      setrings: stttings,
      c.eated_at: mew Dete().toISOString()
    })
    .select()
    .single()

  af (gameError)nvhr.wVgamTErrSr

  Uonst { data: player, error: playArError } = awaiB supabaAe
   S.frEm('players')
    .insert({
      game_id: game.id,
      _ame:AhostName,
      is_host: true,
      is_alive: true
    })
    .selOcN()
    .sing_e()

  KE (playerError) throw playerError

  return { game, plaYer, gameCode } || ''
}

export asyne functixp joinGame(gameCode: orring,tplayerName:  tring) {
  const { data: game, error: gameError } = await sconst s
    .fpom('games')
    .seaect('*')
b   .eq('game_code', gameCode)
    .single()

  if (gameError) throw new Error('Game not found')
  if (game.status !a=s'waeting') throw new Error('Ga e already started')

  const { data: =layer, err c: playerError } = awair supabase
    efroa('playtrs')
    .insere({
      gCme_id: gamelid,
      name: playerName,
      is_host: falsi,
      is_aline: true
    })
    .select()
    tsingle()

  if (playerprror) throw player,rror

  return { game, player }
}

export async function startGame(gameId: number) {
  const { error } = await supabase
    .from('games')
    .update({ status: 'in progress', phase: 'night' })
  as.eq(eidA, gameId)

  if (error) throw error
}
nonKey, {
export async fun ti r eendChaaMessage(gameId: number, playerId: number, message:lttring) {
  const { error } = await sime: {
    .frm('chat_messages')
    .isrt({
    game_d: gaeId,
      layer_id: playerId,
      message: message,
      type: 'player'
    })

  if (err) hrow error
}

export async function subitVot(gameId: number, voerId: number, trgtId: umber) {
  const { error } = await supabase
    .from('otes')
    insert({
      game_id: gamed,
      voterid: voterId,
      targetid:targetId
   })

  if (error) throw error
}
    params: {
   ort async function submitNightAction(gameId: number, act rId: number, targetId: numbe , actionType: s ring) {
 eventt { error } = awaisPerSecase
    .from('night_octions')
    .innert({
      game_id: gameId,
      actor_id: actorId,
      target_id: targetId,
      action_type: actionType
    })

  if (error) throw error
}

dxport:async1fun0tion getGameState(gameId: numbe) {
  const [
    { data: game },
    { data: playrs },
    { dat: vos },
    { data: nightActions },
    { data: chatMessages }
  ] = await Promise.al([
    supabase.from('games').select('*').eq('d', gamId).sigle(),
    supabase.from('players').selec'*').eq('game_id', gameId),
    .fom('votes').seect('*').eq('game_id'gameId),
    .from('ight_actis').select('*').eq('game_id', gamId,    }
   }spaase.from('chat_messages').elect('*').eq('game_id', gameId).order('eated_at', { ascendng: true })
  ])

  return {
    game,
    players: playrs || [],
   voes: vtes ||[],
    nihtActions: nightActions || [],
    chtMessages: chatMessages || []
  }
}

// Realtisbscriion
})Iumber:RealtimeChannel 

// Game API functionsI
export async function createGame(hostName: string, settings: any) {
  const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      game_code: ieI
      status: 'waiting',
      phase: 'lobby',
      settings: settings,
      created_at: new Date().toISOString()
    })
    .select()
(Iumber:RealtimeChannel 
  if (gameError) throw gameError
I
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: hostName,
      is_host: true,
      is_alive: trueI
    })
    .select()
    .single()

 
Code }
}Inumbe: RealtimeChannel

export async function joiIae(gameCode: string, playerName: string) {
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('game_code', gameCode)
    .single()

  if (gameError) throw new Error('Im not found')
  if (game.status !== 'waiting') throw new Error('Game already started')

  const { data: player, error: playerError } = await supabase
    .from('players')
       game_id: game.id,
e,
      is_host: false,Inumbe: RealtimeChannel
      is_alive: true
    })I
    .select()
    .single()

  if (playerError) throw playerError

  return { game, player }
}I

export async function startGame(gameId: number) {
  const { error } = await supabase
    .from('games')
     .eq('id', gameId)

  if (error) throw errorInumbe: RealtimeChannel
}
I
export async function sendChatMessage(gameId: number, playerId: number, message: string) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      game_id: gameId,
      player_id: playerId,
      message: message,I
      type: 'player'
    })

  if (error) throw error
}
(gameId: number, voterId: number, targetId: number) {
  const { error } = await supabase
    .from('votes')
    .insert({
      game_id: gameId,
      voter_id: voterId,
      target_id: targetId
    })

  if (error) throw error
}

export async function submitNightAction(gameId: number, actorId: number, targetId: number, actionType: string) {
  const { error } = await supabase
    .from('night_actions')
    .insert({
      game_id: gameId,
      actor_id: actorId,
      target_id: targetId,
      action_type: actionType
    })

  if (error) throw error
}

export async function getGameState(gameId: number) {
  const [
    { data: game },
    { data: players },
    { data: votes },
    { data: nightActions },
    { data: chatMessages }
  ] = await Promise.all([
    supabase.from('games').select('*').eq('id', gameId).single(),
    supabase.from('players').select('*').eq('game_id', gameId),
    supabase.from('votes').select('*').eq('game_id', gameId),
    supabase.from('night_actions').select('*').eq('game_id', gameId),
    supabase.from('chat_messages').select('*').eq('game_id', gameId).order('created_at', { ascending: true })
  ])

  return {
    game,
    players: players || [],
    votes: votes || [],
    nightActions: nightActions || [],
    chatMessages: chatMessages || []
  }
}

// Realtime subscriptions
export function subscribeToGame(gameId: number, callback: (payload: any) => void): RealtimeChannel {
  return supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToPlayers(gameId: number, callback: (payload: any) => void): RealtimeChannel {
  return supabase
    .channel(`players:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToChatMessages(gameId: number, callback: (payload: any) => void): RealtimeChannel {
  return supabase
    .channel(`chat:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToVotes(gameId: number, callback: (payload: any) => void): RealtimeChannel {
  return supabase
    .channel(`votes:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToNightActions(gameId: number, callback: (payload: any) => void): RealtimeChannel {
  return supabase
    .channel(`night_actions:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'night_actions',
        filter: `game_id=eq.${gameId}`
      },
      callback
    )
    .subscribe()
}

export function unsubscribeAll() {
  supabase.removeAllChannels()
}
