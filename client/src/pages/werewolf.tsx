import { useGameState } from '@/hooks/useGameState';
import InitialScreen from '@/components/werewolf/InitialScreen';
import GameSettings from '@/components/werewolf/GameSettings';
import Lobby from '@/components/werewolf/Lobby';
import GameScreen from '@/components/werewolf/GameScreen';

export default function WerewolfGame() {
  const gameState = useGameState();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1520637836862-4d197d17c23a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 z-0" />
      
      {/* Ghost animation container */}
      <div className="ghost-container fixed inset-0 pointer-events-none overflow-hidden z-50" />
      
      {/* Main content */}
      <div className="relative z-10 text-white flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl mx-auto">
          {gameState.currentScreen === 'initial' && <InitialScreen gameState={gameState} />}
          {gameState.currentScreen === 'settings' && <GameSettings gameState={gameState} />}  
          {gameState.currentScreen === 'lobby' && <Lobby gameState={gameState} />}
          {gameState.currentScreen === 'game' && <GameScreen gameState={gameState} />}
        </div>
      </div>
    </div>
  );
}
