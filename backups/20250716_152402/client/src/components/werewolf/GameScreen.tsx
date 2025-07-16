import { useState, useEffect } from 'react';
import PlayerList from './PlayerList';
import Chat from './Chat';
import RoleReveal from './overlays/RoleReveal';
import VoteOverlay from './overlays/VoteOverlay';
import NightActionOverlay from './overlays/NightActionOverlay';
import GameOverOverlay from './overlays/GameOverOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GameScreenProps {
  gameState: any;
}

export default function GameScreen({ gameState }: GameScreenProps) {
  const [timer, setTimer] = useState<string>('0:00');
  const game = gameState.gameState;

  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const minutes = Math.floor(game.phaseTimer / 60);
      const seconds = game.phaseTimer % 60;
      setTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.phaseTimer]);

  const getPhaseInfo = () => {
    switch (game?.phase) {
      case 'night':
        return {
          title: 'Night Phase',
          subtitle: 'The village sleeps while evil stirs...',
          color: 'text-blue-400'
        };
      case 'day':
        return {
          title: 'Day Phase',
          subtitle: 'Discuss and find the werewolves',
          color: 'text-yellow-400'
        };
      case 'voting':
        return {
          title: 'Voting Phase',
          subtitle: 'Vote to eliminate a player',
          color: 'text-red-400'
        };
      default:
        return {
          title: 'Game Phase',
          subtitle: '',
          color: 'text-gray-400'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <>
      {/* Overlays */}
      {gameState.showRoleReveal && <RoleReveal gameState={gameState} />}
      {gameState.showVoteOverlay && <VoteOverlay gameState={gameState} />}
      {gameState.showNightActionOverlay && <NightActionOverlay gameState={gameState} />}
      {gameState.showGameOverOverlay && <GameOverOverlay gameState={gameState} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players Panel */}
        <div className="lg:col-span-1">
          <PlayerList gameState={gameState} />
        </div>

        {/* Main Game Panel */}
        <div className="lg:col-span-2">
          <Card className="panel rounded-lg shadow-2xl">
            <CardContent className="p-6 flex flex-col h-full">
              {/* Phase Display */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={`font-cinzel text-4xl font-bold ${phaseInfo.color}`}>
                    {phaseInfo.title}
                  </h2>
                  <p className="text-gray-400">{phaseInfo.subtitle}</p>
                </div>
                <div className={`text-2xl font-bold text-gray-300 bg-gray-900/50 px-4 py-2 rounded-lg ${
                  game?.phaseTimer <= 10 ? 'timer-warning text-red-400 animate-pulse' : ''
                }`}>
                  {timer}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-grow">
                <Chat gameState={gameState} />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {game?.phase === 'voting' && gameState.canVote() && (
                    <Button
                      onClick={() => gameState.setShowVoteOverlay(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Vote
                    </Button>
                  )}
                  
                  {game?.phase === 'night' && gameState.hasNightAction() && !gameState.hasPerformedNightAction && (
                    <Button
                      onClick={() => gameState.setShowNightActionOverlay(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Night Action
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
