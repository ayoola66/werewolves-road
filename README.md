# Werewolves Road - Real-Time Multiplayer Werewolf Game

A real-time multiplayer Werewolf (Mafia) game built with React, TypeScript, Supabase Edge Functions, and Supabase PostgreSQL.

**Live Demo**: [https://werewolves-road.netlify.app](https://werewolves-road.netlify.app)

## Features

- Real-time multiplayer gameplay with Supabase Realtime subscriptions
- Multiple game roles: Werewolf, Seer, Doctor, Bodyguard, Witch, Sheriff, Minion, Jester, and Villager
- Interactive chat system with scrambled messages for villagers during night
- Anti-AFK lightning strike system
- Protective shields for players
- Responsive UI built with Tailwind CSS and shadcn/ui components
- Secure game sessions with proper state management
- Custom error logging and monitoring dashboard

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI), wouter (routing), Framer Motion |
| **Backend** | Supabase Edge Functions (Deno/TypeScript) |
| **Database** | Supabase PostgreSQL with Drizzle ORM |
| **Real-time** | Supabase Realtime subscriptions |
| **Auth** | Simple player/session-based (game codes + player IDs) |
| **Hosting** | Netlify (frontend) + Supabase (backend/database) |
| **Observability** | Custom error logging to Supabase `error_logs` table |

## Prerequisites

- Node.js 20.x or higher
- Supabase project (free tier works)
- npm or yarn

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayoola66/werewolves-road.git
   cd werewolves-road
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://username:password@db.your-project.supabase.co:5432/postgres
   ```

4. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migrations in `db/migrations/` folder
   - Deploy Edge Functions from `supabase/functions/` folder

5. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Deployment

### Current Setup: Netlify + Supabase

The app is deployed with:
- **Frontend**: Netlify (auto-deploys from GitHub)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL

### Deploy to Netlify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```

2. **Connect to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Set Environment Variables** in Netlify:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Deploy Edge Functions to Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all Edge Functions
supabase functions deploy
```

### Edge Functions Available

| Function | Purpose |
|----------|---------|
| `create-game` | Creates a new game lobby |
| `join-game` | Joins an existing game |
| `start-game` | Starts the game and assigns roles |
| `submit-night-action` | Submits werewolf/seer/doctor actions |
| `process-night` | Resolves night actions and transitions to day |
| `submit-vote` | Submits a vote during voting phase |
| `process-votes` | Resolves votes and eliminates player |
| `use-shield` | Activates player's protective shield |
| `lightning-strike` | Eliminates AFK players |
| `log-error` | Logs client-side errors |
| `get-game-state` | Fetches current game state |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server (port 5173) |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |
| `npm run migrate` | Run Drizzle database migrations |
| `npm run db:push` | Push schema changes to Supabase |

## Project Structure

```
werewolves-road/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   └── werewolf/   # Game-specific components
│   │   ├── hooks/          # React hooks (useGameState, etc.)
│   │   ├── lib/            # Utilities and types
│   │   └── pages/          # Page components
│   └── public/             # Static assets
├── supabase/
│   └── functions/          # Edge Functions (Deno)
├── db/
│   └── migrations/         # SQL migrations
├── shared/
│   └── schema.ts           # Drizzle schema definitions
└── _bmad-output/           # Planning artifacts and docs
```

## 🎮 How to Play

### Game Objective

**🏘️ Village Team (Villagers):**  
Eliminate all werewolves to win

**🐺 Werewolf Team:**  
Eliminate villagers until werewolves equal or outnumber them

### 📋 Roles & Abilities

#### Village Team
- **👤 Villager** - No special abilities, relies on discussion and voting
- **🔮 Seer** - Investigates one player each night to learn their true identity
- **⚕️ Doctor** - Protects one player each night from werewolf attacks
- **🎖️ Sheriff** - Gains an extra vote during day phase voting (elected during game)

#### Werewolf Team
- **🐺 Werewolf** - Kills one villager each night; can communicate with other werewolves during night phase
- **😈 Minion** - Knows who the werewolves are but has no special abilities; wins with werewolves

### 🌙 Game Phases Explained

#### 1️⃣ Role Reveal Phase (15 seconds)
- Game starts and all players privately see their assigned role
- **Werewolves** see who their fellow werewolves are
- **Minion** (if present) learns who the werewolves are
- **Seer** and **Doctor** learn their special abilities
- **Villagers** learn they're on the village team

#### 2️⃣ First Night Phase (60 seconds)
**What Happens:**
- 🌙 The village sleeps - general chat is **DISABLED**
- 🐺 **Werewolves** can chat privately amongst themselves to plan their attack
- 🐺 **Werewolves** collectively choose one villager to eliminate
- 🔮 **Seer** investigates one player to learn if they're a werewolf or villager
- ⚕️ **Doctor** protects one player from werewolf attack
- 👤 **Villagers** and **Minion** wait for morning

**Night Actions:**
- All special role actions are submitted privately
- Players cannot see what others are doing
- The phase automatically ends when the timer expires

#### 3️⃣ Morning/Day Phase (180 seconds)
**What Happens:**
- ☀️ Results of the night are announced:
  - If a player was eliminated by werewolves (and not saved by doctor)
  - The eliminated player's role is revealed
- 💬 **Chat is ENABLED** - all living players can discuss freely
- 🕵️ Players share information, suspicions, and defend themselves
- 🔮 **Seer** may choose to reveal information (risky!)
- 🐺 **Werewolves** must blend in and deflect suspicion

**Strategy Tips:**
- Pay attention to voting patterns
- Watch for players who are too quiet or too aggressive
- Seer should be careful about revealing - werewolves will target them!
- Build alliances but don't trust everyone

#### 4️⃣ Voting Phase (120 seconds)
**What Happens:**
- 🗳️ All living players must vote to eliminate one player
- 💬 Chat remains **ENABLED** for last-minute discussions
- 🎖️ **Sheriff** (if elected) gets 2 votes instead of 1
- The player with the most votes is eliminated
- Ties may result in no elimination (configurable)
- The eliminated player's role is revealed

**Voting Rules:**
- Each player gets one vote (Sheriff gets two)
- You cannot vote for yourself
- Dead players cannot vote
- Votes are shown after voting phase ends

#### 🔄 Cycle Repeats
The game alternates between **Night → Day → Voting** until one team wins

### 🏆 Win Conditions

**Village Team Wins When:**
- ✅ All werewolves are eliminated

**Werewolf Team Wins When:**
- ✅ Werewolves equal or outnumber villagers
- ✅ (They can then overpower the village)

### 💬 Chat System

**Public Chat:**
- Available during: Lobby, Role Reveal, Day Phase, Voting Phase
- All living players can participate
- Disabled during Night Phase for non-werewolves

**Werewolf Chat (Night Only):**
- Private channel only werewolves and minions can see
- Used to coordinate night kills
- Automatically available to werewolf team members

**Chat Rules:**
- 💀 Dead players cannot chat (the dead tell no tales!)
- 🌙 Non-werewolves cannot chat during night
- 📝 Messages are limited to 200 characters

### 🎯 Strategy Guide

**For Villagers:**
- 👂 Listen carefully to discussions
- 🔍 Look for inconsistencies in players' stories
- 🤝 Work together to find the werewolves
- ⚖️ Vote based on evidence, not emotions

**For Seer:**
- 🎭 Don't reveal yourself immediately!
- 📊 Investigate suspicious players
- 🗣️ Share information carefully (werewolves will target you)
- 💡 Consider revealing late-game when information is crucial

**For Doctor:**
- 🛡️ Protect players who seem important or threatened
- 🎯 Try to predict werewolf targets
- 🤫 Keep your role secret as long as possible
- 💊 You can protect yourself (usually once)

**For Werewolves:**
- 🎭 Blend in with villagers during day phase
- 🗣️ Participate in discussions but don't overdo it
- 🎯 Target power roles (Seer, Doctor) when identified
- 🤝 Coordinate with fellow werewolves during night
- 🃏 Create confusion and misdirect suspicion

**For Minion:**
- 🤐 Protect the werewolves without revealing yourself
- 🎯 Misdirect voting away from werewolves
- 🗣️ Create chaos and confusion
- ⚠️ You have no night action, but you know the werewolves

### ⚙️ Game Settings (Configurable)

When creating a game, the host can configure:
- **Number of Werewolves** (1-3)
- **Enable/Disable** special roles (Seer, Doctor, Minion)
- **Phase Timers** (can be adjusted)
- **Sheriff Election** (on/off)
- **Protective Shield** (for Doctor)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
