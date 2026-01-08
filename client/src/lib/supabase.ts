import { createClient } from '@supabase/supabase-js'

// Supabase configuration for realtime features
// This can be used as an alternative to WebSockets on Netlify

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Subscribe to game updates
export function subscribeToGameUpdates(gameCode: string, callback: (payload: any) => void) {
  return supabase
    .channel(`game:${gameCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `game_code=eq.${gameCode}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to player updates
export function subscribeToPlayerUpdates(gameCode: string, callback: (payload: any) => void) {
  return supabase
    .channel(`players:${gameCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameCode}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to chat messages
export function subscribeToChatMessages(gameCode: string, callback: (payload: any) => void) {
  return supabase
    .channel(`chat:${gameCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `game_id=eq.${gameCode}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to votes
export function subscribeToVotes(gameCode: string, callback: (payload: any) => void) {
  return supabase
    .channel(`votes:${gameCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `game_id=eq.${gameCode}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to night actions
export function subscribeToNightActions(gameCode: string, callback: (payload: any) => void) {
  return supabase
    .channel(`night_actions:${gameCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'night_actions',
        filter: `game_id=eq.${gameCode}`
      },
      callback
    )
    .subscribe()
}

// Unsubscribe from all channels
export function unsubscribeAll() {
  supabase.removeAllChannels()
}
