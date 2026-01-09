export interface GameSettings {
  werewolfCount?: number
  hasSeer: boolean
  hasDoctor: boolean
  dayDuration: number
  nightDuration: number
}

export interface Player {
  id: number
  game_id: number
  name: string
  role?: string
  is_alive: boolean
  is_host: boolean
  created_at: string
}

export interface Game {
  id: number
  game_code: string
  status: 'waiting' | 'in_progress' | 'finished'
  phase: 'lobby' | 'night' | 'day' | 'voting' | 'game_over'
  settings: GameSettings
  current_day: number
  created_at: string
}

export interface Vote {
  id: number
  game_id: number
  voter_id: number
  target_id: number
  created_at: string
}

export interface NightAction {
  id: number
  game_id: number
  actor_id: number
  target_id: number
  action_type: 'kill' | 'investigate' | 'protect'
  created_at: string
}

export interface ChatMessage {
  id: number
  game_id: number
  player_id?: number
  message: string
  type: 'player' | 'system'
  created_at: string
}
