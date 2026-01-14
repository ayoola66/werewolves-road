import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_INFO } from '@/lib/gameTypes';

interface EliminatedOverlayProps {
  gameState: any;
  onContinueWatching: () => void;
}

export default function EliminatedOverlay({ gameState, onContinueWatching }: EliminatedOverlayProps) {
  const currentPlayer = gameState.getCurrentPlayer();
  const playerRole = gameState.getPlayerRole();
  const roleInfo = playerRole ? ROLE_INFO[playerRole as keyof typeof ROLE_INFO] : null;

  // Determine how the player was eliminated
  const getEliminationMessage = () => {
    const game = gameState.gameState;
    const currentPhase = game?.game?.currentPhase || game?.phase;
    
    // If we're coming from voting_results, they were voted out
    // If we're coming from night/day transition, they were killed by werewolves
    if (currentPhase === 'day' || currentPhase === 'voting_results') {
      return {
        title: '⚖️ You Have Been Eliminated',
        subtitle: 'The village has spoken...',
        description: 'You were voted out by the village.',
        bgGradient: 'from-orange-950 via-red-950 to-black',
      };
    } else {
      return {
        title: '💀 You Have Been Eliminated',
        subtitle: 'The night was not kind to you...',
        description: 'You were killed during the night.',
        bgGradient: 'from-gray-950 via-blue-950 to-black',
      };
    }
  };

  const eliminationInfo = getEliminationMessage();

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${eliminationInfo.bgGradient} flex flex-col items-center justify-center z-[60] p-4`}>
      <div className="text-center animate-in fade-in zoom-in duration-700">
        {/* Skull/Death Icon */}
        <div className="text-8xl sm:text-9xl mb-6 animate-pulse">
          💀
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-bold text-red-400 mb-4 drop-shadow-2xl">
          {eliminationInfo.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-gray-300 mb-8 italic">
          {eliminationInfo.subtitle}
        </p>

        {/* Role Reveal Card */}
        <Card className="max-w-md mx-auto bg-black/50 border-2 border-gray-600 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-400">Your Role Was</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl mb-4">
              {roleInfo?.emoji || '❓'}
            </div>
            <h2 className={`text-3xl font-cinzel font-bold mb-2 ${roleInfo?.color || 'text-gray-400'}`}>
              {roleInfo?.name || playerRole || 'Unknown'}
            </h2>
            <p className="text-gray-400 text-sm">
              {roleInfo?.description || 'Your role has been revealed to the other players.'}
            </p>
          </CardContent>
        </Card>

        {/* Description */}
        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          {eliminationInfo.description}
          <br />
          <span className="text-gray-500 text-sm">
            You may continue to watch the game unfold.
          </span>
        </p>

        {/* Continue Button */}
        <Button
          onClick={onContinueWatching}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 text-lg rounded-lg shadow-lg"
        >
          👻 Continue Watching
        </Button>
      </div>
    </div>
  );
}
