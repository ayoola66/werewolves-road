# Werewolves Road - Multiplayer Social Deduction Game

## Overview

This is a real-time multiplayer Werewolf (Mafia) game built with React and Supabase. Players can create or join games, receive role assignments, and participate in day/night phases with voting mechanics. The application features a modern UI with a dark theme and atmospheric styling.

**Live Demo**: [https://werewolves-road.netlify.app](https://werewolves-road.netlify.app)

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **shadcn/ui** component library with Radix UI primitives
- **TailwindCSS** for styling with custom werewolf-themed design
- **Wouter** for client-side routing
- **Framer Motion** for animations

### Backend Architecture
- **Supabase Edge Functions** (Deno/TypeScript) for serverless API
- **Supabase Realtime** for real-time game state synchronisation
- **Drizzle ORM** for database operations
- **Supabase PostgreSQL** for data persistence

### Data Storage
- **Supabase PostgreSQL** database with the following main tables:
  - `games` - Game state and configuration
  - `players` - Player information and roles
  - `game_actions` - Voting and night actions
  - `chat_messages` - In-game chat system
  - `error_logs` - Client-side error tracking
- **Drizzle ORM** for type-safe database queries

## Key Components

### Edge Functions
| Function | Purpose |
|----------|---------|
| `create-game` | Creates a new game lobby with settings |
| `join-game` | Joins an existing game by code |
| `start-game` | Starts game, assigns roles, begins role reveal |
| `submit-night-action` | Submits werewolf/seer/doctor/witch actions |
| `process-night` | Resolves night actions, transitions to day |
| `submit-vote` | Submits a vote during voting phase |
| `process-votes` | Resolves votes, eliminates player |
| `use-shield` | Activates player's protective shield |
| `lightning-strike` | Eliminates AFK players |
| `get-game-state` | Fetches current game state |
| `log-error` | Logs client-side errors for debugging |

### Game Logic
- Role assignment and game state management
- Phase transitions (role_reveal → night → day → voting → voting_results)
- Victory condition checking
- Timer management for phases (auto-transitions)
- Shield and protection mechanics
- Anti-AFK lightning strike system

### Real-time Communication
- Supabase Realtime subscriptions for game state updates
- Chat messaging (public and werewolf-only channels)
- Player actions synchronisation
- Automatic reconnection handling

### UI Components
- **InitialScreen** - Game creation/joining interface
- **GameSettings** - Role configuration before game start
- **Lobby** - Player waiting room with game code sharing
- **GameScreen** - Main game interface with phase overlays
- **Chat** - Real-time messaging system with scrambling for villagers
- **ErrorLogs** - Admin dashboard for error monitoring

## Data Flow

1. **Game Creation**: Host creates game with settings → generates unique game code
2. **Player Joining**: Players join via game code → added to lobby
3. **Game Start**: Host starts game → roles assigned → role reveal phase begins
4. **Phase Management**: Game cycles through phases with timers (auto-transitions via Edge Functions)
5. **Real-time Updates**: Supabase Realtime broadcasts keep all players synchronised
6. **Victory Check**: Game ends when win conditions are met

## External Dependencies

### Core Dependencies
- `@supabase/supabase-js` - Supabase client for database and realtime
- `drizzle-orm` - Type-safe database ORM
- `wouter` - Lightweight React router

### UI Dependencies
- `@radix-ui/*` - Accessible UI component primitives
- `class-variance-authority` - Styling utilities
- `tailwindcss` - Utility-first CSS framework
- `framer-motion` - Animation library

### Development Tools
- `tsx` - TypeScript execution for development
- `vite` - Frontend build tool and dev server
- `drizzle-kit` - Database migration tools

## Deployment

### Current Stack
- **Frontend**: Netlify (auto-deploys from GitHub)
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...
```

### Deploy Edge Functions
```bash
supabase functions deploy
```

## Game Roles

### Village Team
- **Villager** - No special abilities
- **Seer** - Investigates one player each night
- **Doctor** - Protects one player from attack
- **Bodyguard** - Protects a player, may sacrifice self
- **Sheriff** - Gets 2 votes during voting phase

### Werewolf Team
- **Werewolf** - Kills one villager each night
- **Minion** - Knows werewolves, no special ability

### Neutral
- **Witch** - Has heal and kill potions (one use each)
- **Jester** - Wins if voted out during day

## Changelog

```
Changelog:
- June 25, 2025: Initial setup
- June 25, 2025: Transformed basic HTML into complete multiplayer Werewolf game
- June 25, 2025: Added medieval theming with castle background and golden effects
- June 25, 2025: Implemented Seer investigation limits (30% of werewolf count, min 3)
- June 25, 2025: Added custom Seer investigation count option in Game Settings
- June 25, 2025: Integrated PostgreSQL database for persistent multiplayer sessions
- June 25, 2025: Enhanced game flow with role reveal countdown, day/night visuals
- June 25, 2025: Implemented advanced bodyguard mechanics and majority voting system
- July 2, 2025: Added comprehensive player disconnection handling system
- July 2, 2025: Created complete README.md documentation with setup and gameplay guides
- October 2025: Migrated from Express.js/WebSockets to Supabase Edge Functions/Realtime
- October 2025: Added anti-AFK lightning strike system
- October 2025: Implemented player shields and scrambled villager chat
- January 2026: Added comprehensive error logging dashboard
- January 2026: Bug fixes for phase transitions and timer display
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
British English spelling and grammar throughout.
```
