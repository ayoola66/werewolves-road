import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`

// Helper to call Edge Functions
async function callEdgeFunction(functionName: string, body: any) {
  const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Function call failed')
  }

  return response.json()
}

// Game API functions using Edge Functions
export async function createGame(hostName: string, settings: any) {
  const result = await callEdgeFunction('create-game', { hostName, settings })
  return result
}

export async function joinGame(gameCode: string, playerName: string) {
  const result = await callEdgeFunction('join-game', { gameCode, playerName })
  return result
}

export async function startGame(gameCode: string, playerId: string) {
  const result = await callEdgeFunction('start-game', { gameCode, playerId })
  return result
}

export async function sendChatMessage(gameCode: string, playerId: string, message: string, channel?: string) {
  const result = await callEdgeFunction('send-chat', { gameCode, playerId, message, channel })
  return result
}

export async function submitVote(gameCode: string, playerId: string, targetId: string) {
  const result = await callEdgeFunction('submit-vote', { gameCode, playerId, targetId })
  return result
}

export async function submitNightAction(gameCode: string, playerId: string, targetId: string, action: string) {
  const result = await callEdgeFunction('submit-night-action', { gameCode, playerId, targetId, action })
  return result
}

export async function processNight(gameCode: string) {
  const result = await callEdgeFunction('process-night', { gameCode })
  return result
}

export async function processVotes(gameCode: string) {
  const result = await callEdgeFunction('process-votes', { gameCode })
  return result
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
