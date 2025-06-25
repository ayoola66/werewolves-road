import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NightActionOverlayProps {
  gameState: any;
}

export default function NightActionOverlay({ gameState }: NightActionOverlayProps) {
  const game = gameState.gameState;
  const playerRole = gameState.getPlayerRole();
  
  const getActionConfig = () => {
    switch (playerRole) {
      case 'werewolf':
        return {
          title: 'Choose Your Victim',
          description: 'Select a player to eliminate tonight. Type their name exactly to confirm.',
          targets: game?.alivePlayers?.filter((p: any) => p.role !== 'werewolf') || [],
          actionText: 'Kill'
        };
      case 'seer':
        const investigationsLeft = game?.seerInvestigationsLeft?.[gameState.playerId] || 0;
        return {
          title: 'Divine a Player',
          description: `Choose a player to learn their role. Investigations remaining: ${investigationsLeft}`,
          targets: investigationsLeft > 0 ? (game?.alivePlayers?.filter((p: any) => p.playerId !== gameState.playerId) || []) : [],
          actionText: 'Investigate'
        };
      case 'healer':
        return {
          title: 'Protect a Player',
          description: 'Choose a player to protect from werewolf attacks.',
          targets: game?.alivePlayers || [],
          actionText: 'Heal'
        };
      case 'witch':
        return {
          title: 'Use Your Potions',
          description: 'Choose to save or poison a player (if you have potions left).',
          targets: game?.alivePlayers || []
        };
      case 'bodyguard':
        return {
          title: 'Guard a Player',
          description: 'Choose a player to protect. You will die if they are attacked.',
          targets: game?.alivePlayers?.filter((p: any) => p.playerId !== gameState.playerId) || [],
          actionText: 'Protect'
        };
      default:
        return {
          title: 'Night Action',
          description: 'Perform your night action.',
          targets: []
        };
    }
  };

  const actionConfig = getActionConfig();

  const handleAction = (targetId?: string) => {
    gameState.performNightAction(targetId);
  };

  const handleSelectPlayer = (player: any) => {
    gameState.setSelectedPlayer(player);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4">
      <Card className="panel max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="font-cinzel text-3xl text-center">{actionConfig.title}</CardTitle>
          <p className="text-lg text-center">{actionConfig.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {actionConfig.targets.map((player: any) => (
              <Button
                key={player.playerId}
                onClick={() => handleSelectPlayer(player)}
                variant={gameState.selectedPlayer?.playerId === player.playerId ? "default" : "secondary"}
                className="p-4 h-auto flex flex-col items-center"
              >
                <span className="font-bold">{player.name}</span>
                {player.isSheriff && <span className="text-xs">⭐ Sheriff</span>}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => handleAction(gameState.selectedPlayer?.playerId)}
              disabled={!gameState.selectedPlayer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Confirm Action
            </Button>
            <Button
              onClick={() => handleAction()}
              variant="secondary"
              className="text-white font-bold py-3 px-6 rounded-lg"
            >
              Skip Action
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
