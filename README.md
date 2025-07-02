# 🌙 Werewolf - Multiplayer Social Deduction Game

A real-time multiplayer implementation of the classic Werewolf (Mafia) social deduction game with medieval theming, advanced role mechanics, and seamless multiplayer experience.

## 🎮 Game Overview

Werewolf is a social deduction game where players are secretly assigned roles as either Werewolves or Villagers. The Werewolves know each other and eliminate Villagers during the night phase, while Villagers must identify and vote out the Werewolves during the day phase. Special roles add strategic depth and unique abilities to the gameplay.

## ✨ Features

### 🎭 Rich Role System
- **Werewolf** - Eliminates villagers at night, knows other werewolves
- **Villager** - Basic townsfolk trying to survive and find werewolves
- **Seer** - Can investigate players to learn their roles (limited investigations)
- **Doctor** - Can heal players from werewolf attacks (including themselves)
- **Bodyguard** - Dies protecting attacked players from werewolf elimination
- **Witch** - Has healing and poison potions for strategic gameplay
- **Hunter** - Takes someone down when eliminated
- **Minion** - Evil role that wins with werewolves
- **Jester** - Wins by getting voted out during the day

### 🌟 Advanced Game Mechanics
- **Role Reveal Phase** - 10-second countdown showing werewolf allies
- **Dynamic Seer Investigations** - Limited uses based on werewolf count (30% minimum 3)
- **Custom Investigation Settings** - Host can set specific seer investigation limits
- **Smart Voting System** - Ends early with majority consensus plus 10-second strategy delay
- **Advanced Protection** - Doctor self-healing and bodyguard sacrifice mechanics
- **Sheriff Election** - Optional leadership role for enhanced gameplay

### 🎨 Immersive Experience
- **Medieval Gothic Theme** - Castle backgrounds with atmospheric styling
- **Day/Night Visual Transitions** - Dynamic lighting and ambiance changes
- **Real-time Chat System** - In-game communication with system messages
- **Phase Timers** - Structured gameplay with automatic phase progression
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### 🔄 Robust Multiplayer
- **Real-time WebSocket Communication** - Instant game state synchronization
- **Disconnection Handling** - Game continues seamlessly when players drop out
- **Host Migration** - Automatic host transfer if original host disconnects
- **Smart Phase Acceleration** - Votes and actions resolve early when all players complete
- **Persistent Game State** - PostgreSQL database for reliable multiplayer sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (automatically provided on Replit)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd werewolf-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Automatically configured on Replit
   # For local development, set:
   DATABASE_URL=postgresql://user:password@localhost:5432/werewolf
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The game will be available at `http://localhost:5000`

## 🎯 How to Play

### Game Setup
1. **Create a Game** - Host creates a new game with custom role settings
2. **Join Game** - Players join using the 6-character game code
3. **Configure Roles** - Host selects which special roles to include
4. **Start Game** - Begin when 4-16 players have joined

### Game Flow
1. **Role Assignment** - Each player receives a secret role
2. **Role Reveal** - 10-second phase showing werewolf teammates
3. **Night Phase** - Werewolves eliminate, special roles act
4. **Day Phase** - Open discussion about suspicious behavior
5. **Voting Phase** - Players vote to eliminate someone
6. **Repeat** - Continue until victory condition is met

### Victory Conditions
- **Villagers Win** - All werewolves are eliminated
- **Werewolves Win** - Werewolves equal or outnumber villagers
- **Jester Wins** - Jester gets voted out during day phase

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for modern UI development
- **Vite** for fast development and optimized builds
- **shadcn/ui** component library with Radix UI primitives
- **TailwindCSS** for responsive styling and theming
- **TanStack Query** for efficient state management
- **Wouter** for lightweight client-side routing

### Backend Stack
- **Express.js** with TypeScript for REST API
- **WebSocket Server** for real-time game communication
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** for reliable data persistence
- **Session Management** for player identification

### Database Schema
```sql
-- Core game tables
games (id, gameCode, hostId, status, settings, currentPhase, phaseTimer)
players (id, gameId, playerId, name, role, isAlive, isHost, isSheriff)
gameActions (id, gameId, playerId, actionType, targetId, phase, data)
chatMessages (id, gameId, playerId, playerName, message, type)
```

## 🎮 Game Configuration

### Role Settings
- **Werewolves** - Number of werewolf players (1-4)
- **Special Roles** - Toggle individual roles on/off
- **Seer Investigations** - Custom investigation count (default: 30% of werewolves, min 3)
- **Sheriff Election** - Optional leadership voting

### Gameplay Settings
- **Phase Timers** - Configurable time limits for each phase
- **Player Limits** - 4-16 players per game
- **Auto-progression** - Phases advance when all actions complete

## 🌐 Deployment

### Replit Deployment (Recommended)
1. Fork the project on Replit
2. PostgreSQL database is automatically provisioned
3. Click "Run" to start the development server
4. Use Replit's deployment feature for production hosting

### Manual Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=production
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 🔧 Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and types
├── server/                # Express backend
│   ├── services/          # Business logic
│   ├── routes.ts          # API routes and WebSocket handlers
│   └── storage.ts         # Database operations
├── shared/                # Shared TypeScript types
└── README.md             # This file
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open database management interface

### WebSocket Events
```typescript
// Client to Server
{ type: 'create_game', playerName: string, settings: GameSettings }
{ type: 'join_game', gameCode: string, playerName: string }
{ type: 'start_game', gameCode: string }
{ type: 'vote', gameCode: string, targetId: string }
{ type: 'night_action', gameCode: string, targetId?: string }
{ type: 'chat_message', gameCode: string, message: string }

// Server to Client
{ type: 'game_state', gameState: GameState }
{ type: 'chat_update', messages: ChatMessage[] }
{ type: 'error', message: string }
```

## 🎨 Customization

### Theming
The game uses CSS custom properties for easy theming:
```css
:root {
  --background: hsl(224, 71%, 4%);
  --foreground: hsl(213, 31%, 91%);
  --primary: hsl(45, 100%, 51%);
  --accent: hsl(220, 14%, 96%);
}
```

### Role Modifications
Add new roles by:
1. Extending the `Role` type in `shared/schema.ts`
2. Adding role logic in `server/services/gameLogic.ts`
3. Creating role-specific UI in `client/src/components/werewolf/`

## 🐛 Known Issues & Limitations

- **Browser Compatibility** - Requires modern browsers with WebSocket support
- **Network Latency** - May affect real-time synchronization on slow connections
- **Mobile Experience** - Optimized for mobile but best on desktop for extended play

## 📝 Changelog

### Latest Updates
- **Enhanced Disconnection Handling** - Game continues seamlessly when players drop out
- **Smart Phase Acceleration** - Votes and night actions resolve early when complete
- **Host Migration** - Automatic host transfer prevents game abandonment
- **Win Condition Optimization** - Proper victory checks after player disconnections
- **Database Integration** - Persistent multiplayer sessions with PostgreSQL

### Version History
- **v1.3** - Advanced disconnection handling and game continuity
- **v1.2** - Custom seer investigations and bodyguard mechanics
- **v1.1** - Medieval theming and role reveal enhancements
- **v1.0** - Initial release with core gameplay mechanics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Support

- **Issues** - Report bugs or request features via GitHub Issues
- **Documentation** - Comprehensive guides in the `/docs` folder
- **Community** - Join discussions in the project's community channels

---

**Built with ❤️ using React, Express, and PostgreSQL**

*Enjoy your werewolf hunt under the moonlight!* 🌙🐺