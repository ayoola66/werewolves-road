# GameWorldQuest - Werewolf Game

A real-time multiplayer Werewolf (Mafia) game built with React, TypeScript, Express, and PostgreSQL.

## Features

- Real-time multiplayer gameplay with WebSocket support
- Multiple game roles: Werewolf, Seer, Doctor, Sheriff, and more
- Interactive chat system
- Responsive UI built with Tailwind CSS and Radix UI
- Secure game sessions with proper state management

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS + Radix UI components
- WebSocket client for real-time updates

**Backend:**
- Express.js + TypeScript
- WebSocket server (ws library)
- Drizzle ORM with PostgreSQL
- Session-based authentication

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL database
- npm or yarn

## Local Development

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd GameWorldQuest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database URL:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/gameworldquest
   NODE_ENV=development
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Deployment

### Railway (Recommended - Free Tier Available)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up/in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your GameWorldQuest repository
   - Railway will auto-detect the Node.js app

3. **Add PostgreSQL Database**
   - In your Railway project, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically set DATABASE_URL environment variable

4. **Configure Environment Variables**
   - Go to your app service → "Variables"
   - Ensure these are set:
     - `DATABASE_URL` (auto-set by Railway)
     - `NODE_ENV=production`
     - `PORT` (auto-set by Railway)

5. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app-name.railway.app`

### Alternative Deployment Options

#### Render.com
The project includes a `render.yaml` for Render deployment (currently configured).

#### Docker Deployment
A Dockerfile is included for container deployment:
```bash
docker build -t gameworldquest .
docker run -p 3000:3000 -e DATABASE_URL=your_db_url gameworldquest
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database

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
