import { useGameState } from '@/hooks/useGameState';
import InitialScreen from '@/components/werewolf/InitialScreen';
import GameSettings from '@/components/werewolf/GameSettings';
import Lobby from '@/components/werewolf/Lobby';
import GameScreen from '@/components/werewolf/GameScreen';
import RoleRevealOverlay from '@/components/werewolf/overlays/RoleRevealOverlay';

export default function WerewolfGame() {
  const gameState = useGameState();

  return (
    <div className="min-h-screen relative overflow-hidden bg-deep-slate">
      {/* Layered Background - Dark Medieval Forest */}
      <div className="absolute inset-0">
        {/* Base dark stone texture */}
        <div className="absolute inset-0 bg-stone-texture" />
        
        {/* Atmospheric forest/night image overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        
        {/* Deep shadow gradients - Ember & Shadow palette */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-slate/80 via-transparent to-deep-slate/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-slate/60 via-transparent to-deep-slate/60" />
        
        {/* Subtle ember glow at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blood/10 via-transparent to-transparent" />
        
        {/* Moonlight effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-ember/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* Magical ember particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        <div className="sparkle" style={{ top: '15%', left: '10%', animationDelay: '0s' }}></div>
        <div className="sparkle" style={{ top: '25%', right: '15%', animationDelay: '0.8s' }}></div>
        <div className="sparkle" style={{ bottom: '35%', left: '20%', animationDelay: '1.6s' }}></div>
        <div className="sparkle" style={{ bottom: '20%', right: '10%', animationDelay: '2.4s' }}></div>
        <div className="sparkle" style={{ top: '50%', left: '5%', animationDelay: '3.2s' }}></div>
        <div className="sparkle" style={{ top: '40%', right: '25%', animationDelay: '4s' }}></div>
      </div>
      
      {/* Main content */}
      <div className={`relative z-20 text-parchment flex items-center justify-center min-h-screen p-4 transition-all duration-1000 ${
        gameState.gameState?.phase === 'night' ? 'brightness-75' : 
        gameState.gameState?.phase === 'day' ? 'brightness-105' : ''
      }`}>
        <div className="w-full max-w-5xl mx-auto">
          {gameState.currentScreen === 'initial' && <InitialScreen gameState={gameState} />}
          {gameState.currentScreen === 'settings' && <GameSettings gameState={gameState} />}  
          {gameState.currentScreen === 'lobby' && <Lobby gameState={gameState} />}
          {gameState.currentScreen === 'game' && <GameScreen gameState={gameState} />}
          
          {/* Role Reveal Overlay */}
          {gameState.currentScreen === 'game' && 
           gameState.gameState?.phase === 'role_reveal' && 
           gameState.getPlayerRole() && (
            <RoleRevealOverlay 
              role={gameState.getPlayerRole() || 'villager'}
              phaseTimer={gameState.gameState.phaseTimer || 10}
              gameState={gameState.gameState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
