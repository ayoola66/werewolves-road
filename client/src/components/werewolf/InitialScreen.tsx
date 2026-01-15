import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Copy, Users, UserPlus } from 'lucide-react';
import { useErrorLog } from '@/hooks/useErrorLog';

interface InitialScreenProps {
  gameState: any;
}

export default function InitialScreen({ gameState }: InitialScreenProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const { getNewErrorsCount } = useErrorLog();
  const newErrorsCount = getNewErrorsCount();

  const handleCreateGame = () => {
    if (!playerName.trim()) return;
    gameState.setPlayerName?.(playerName.trim());
    gameState.setCurrentScreen('settings');
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !gameCode.trim()) return;
    gameState.joinGame(gameCode, playerName);
  };

  return (
    <div className="text-center max-w-2xl mx-auto">
      {/* Hero Section with Logo */}
      <div className="mb-8">
        {/* Main Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/Werewolves-Village-t1-logo.png" 
            alt="Werewolves Village" 
            className="h-32 md:h-44 w-auto moon-glow drop-shadow-2xl"
          />
        </div>
        
        {/* Title with chiselled effect */}
        <h1 className="font-cinzel text-4xl md:text-6xl font-bold mb-3 tracking-wide">
          <span className="text-chiselled">WEREWOLVES</span>
          <span className="block text-2xl md:text-3xl mt-1 text-ember fire-flicker">VILLAGE</span>
        </h1>
        
        {/* Medieval divider */}
        <div className="divider-medieval w-64 mx-auto my-6"></div>
        
        {/* Tagline */}
        <p className="text-parchment/70 text-lg font-medium tracking-wide">
          Where trust is a luxury and survival demands deception
        </p>
      </div>

      {/* Main Action Buttons */}
      {!showCreateForm && !showJoinForm && (
        <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center mb-8">
          <Button
            onClick={() => {
              setShowJoinForm(false);
              setShowCreateForm(true);
            }}
            className="btn-ember w-full md:w-auto py-4 px-10 text-lg rounded font-bold flex items-center justify-center gap-3 group"
          >
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Create Game
          </Button>
          <Button
            onClick={() => {
              setShowCreateForm(false);
              setShowJoinForm(true);
            }}
            className="btn-iron w-full md:w-auto py-4 px-10 text-lg rounded font-bold flex items-center justify-center gap-3 group"
          >
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Join Game
          </Button>
        </div>
      )}

      {/* Join Game Form */}
      {showJoinForm && (
        <Card className="panel-stone max-w-md mx-auto border-iron-gray">
          <CardContent className="pt-8 pb-6 px-8 space-y-5">
            <h2 className="font-cinzel text-2xl text-ember mb-4">Join the Hunt</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-parchment/60 text-sm mb-2 text-left uppercase tracking-wider">
                  Game Code
                </label>
                <Input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="input-iron w-full text-center text-xl font-bold tracking-[0.3em] uppercase"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-parchment/60 text-sm mb-2 text-left uppercase tracking-wider">
                  Your Name
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-iron w-full text-center text-lg"
                  maxLength={20}
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowJoinForm(false)}
                className="btn-iron flex-1 py-3"
              >
                Back
              </Button>
              <Button
                onClick={handleJoinGame}
                disabled={!playerName.trim() || !gameCode.trim()}
                className="btn-ember flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enter Lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Game Form */}
      {showCreateForm && (
        <Card className="panel-stone max-w-md mx-auto border-iron-gray">
          <CardContent className="pt-8 pb-6 px-8 space-y-5">
            <h2 className="font-cinzel text-2xl text-ember mb-4">Begin the Hunt</h2>
            
            <div>
              <label className="block text-parchment/60 text-sm mb-2 text-left uppercase tracking-wider">
                Your Name
              </label>
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input-iron w-full text-center text-lg"
                maxLength={20}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowCreateForm(false)}
                className="btn-iron flex-1 py-3"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateGame}
                disabled={!playerName.trim()}
                className="btn-ember flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Up Game
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Section */}
      <div className="mt-12 pt-8 border-t border-iron-gray/30">
        {/* Decorative small logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/Werewolves-Village-t1-logo-sq-nobg.png" 
            alt="" 
            className="h-10 w-auto opacity-40"
          />
        </div>
        
        <p className="text-parchment/40 text-sm">
          Forged in Moonlight
        </p>
        
        {/* Error Logs Link - Developer tool, subtle placement */}
        {newErrorsCount > 0 && (
          <div className="mt-4">
            <Link href="/error-logs">
              <Button
                variant="ghost"
                size="sm"
                className="text-parchment/30 hover:text-ember hover:bg-iron-gray/20"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Error Logs
                <Badge variant="destructive" className="ml-2 bg-blood">
                  {newErrorsCount}
                </Badge>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
