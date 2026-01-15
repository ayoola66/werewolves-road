import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users, Crown, ArrowLeft, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LobbyProps {
  gameState: any;
}

export default function Lobby({ gameState }: LobbyProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const game = gameState?.gameState;
  console.log('Rendering lobby with game state:', { game, players: game?.players });

  const copyGameCode = async () => {
    if (game?.game.gameCode) {
      try {
        await navigator.clipboard.writeText(game.game.gameCode);
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Game code copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Could not copy game code",
          variant: "destructive",
        });
      }
    }
  };

  const playerCount = Array.isArray(game?.players) ? game.players.length : 0;
  const canStart = gameState.isHost() && playerCount >= 4;
  const playersNeeded = Math.max(0, 4 - playerCount);

  return (
    <Card className="panel-stone rounded shadow-2xl max-w-3xl mx-auto">
      <CardHeader className="text-center pb-4 border-b border-iron-gray/50">
        {/* Small logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/Werewolves-Village-t1-logo-sq-nobg.png" 
            alt="Werewolves Village" 
            className="h-16 w-auto moon-glow"
          />
        </div>
        
        <CardTitle className="font-cinzel text-3xl md:text-4xl font-bold text-chiselled mb-4">
          THE GATHERING
        </CardTitle>
        
        {/* Game Code Display */}
        <div className="space-y-2">
          <p className="text-parchment/60 text-sm uppercase tracking-wider">
            Share this code with your allies
          </p>
          <button
            onClick={copyGameCode}
            className="inline-flex items-center gap-3 bg-deep-slate border-2 border-iron-gray hover:border-ember rounded px-6 py-3 transition-all group"
          >
            <span className="text-3xl font-bold text-ember tracking-[0.3em] font-cinzel">
              {game?.game.gameCode || 'LOADING'}
            </span>
            {copied ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <Copy className="w-6 h-6 text-parchment/60 group-hover:text-ember transition-colors" />
            )}
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Players Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-iron-gray/30">
            <h3 className="font-cinzel text-xl text-parchment flex items-center gap-2">
              <Users className="w-5 h-5 text-ember" />
              Hunters Assembled
            </h3>
            <span className="text-ember font-bold">
              {playerCount}/16
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.isArray(game?.players) && game.players.map((player: any) => (
              <div 
                key={player.playerId} 
                className="player-card bg-iron-gray/30 p-4 rounded text-center relative group hover:bg-iron-gray/50 transition-all"
              >
                {player.isHost && (
                  <Crown className="absolute -top-2 -right-2 w-5 h-5 text-ember" />
                )}
                <span className="font-semibold text-parchment block truncate">
                  {player.name}
                </span>
                {player.isHost && (
                  <Badge className="badge-host text-xs mt-2">
                    HOST
                  </Badge>
                )}
              </div>
            ))}
            
            {/* Empty slots indicator */}
            {playerCount < 4 && Array.from({ length: 4 - playerCount }).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="border-2 border-dashed border-iron-gray/40 p-4 rounded text-center opacity-40"
              >
                <span className="text-parchment/40 text-sm">Awaiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Medieval Divider */}
        <div className="divider-medieval w-full my-6"></div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            onClick={gameState.leaveGame}
            className="btn-iron py-3 px-6 rounded font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave Game
          </Button>
          
          {gameState.isHost() ? (
            <Button
              onClick={gameState.startGame}
              disabled={!canStart}
              className="btn-ember py-3 px-8 rounded font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              {canStart ? 'Begin the Hunt' : `Need ${playersNeeded} More`}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-parchment/60">
              <div className="w-2 h-2 bg-ember rounded-full animate-pulse"></div>
              <span>Awaiting the host...</span>
            </div>
          )}
        </div>
        
        {/* Status Message */}
        <p className="text-center text-parchment/50 mt-4 text-sm">
          {gameState.isHost() 
            ? !canStart 
              ? `${playersNeeded} more villagers must join before the hunt can begin`
              : 'All hunters assembled. The village awaits your command.'
            : 'The hunt begins when the host gives the signal...'
          }
        </p>
      </CardContent>
    </Card>
  );
}
