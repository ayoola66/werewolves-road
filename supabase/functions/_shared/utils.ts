import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

export function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function assignRoles(playerCount: number, settings: any) {
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

export function checkWinCondition(alivePlayers: any[]) {
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf').length
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'werewolf').length
  
  if (aliveWerewolves === 0) {
    return { gameOver: true, winner: 'villagers' }
  }
  
  if (aliveWerewolves >= aliveVillagers) {
    return { gameOver: true, winner: 'werewolves' }
  }
  
  return { gameOver: false, winner: null }
}
