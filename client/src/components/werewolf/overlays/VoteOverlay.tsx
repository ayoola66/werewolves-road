import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VoteOverlayProps {
  gameState: any;
}

export default function VoteOverlay({ gameState }: VoteOverlayProps) {
  const game = gameState.gameState;
  const alivePlayers =
    game?.alivePlayers?.filter((p: any) => p.playerId !== gameState.playerId) ||
    [];

  // Get list of players who have voted
  const votes = game?.votes || [];
  const voterIds = votes.map((v: any) => v.voterId);
  const playersWhoVoted =
    game?.players?.filter((p: any) => voterIds.includes(p.playerId)) || [];

  const totalAlivePlayers = game?.alivePlayers?.length || 0;
  const totalVotes = votes.length;
  const votesNeeded = Math.ceil(totalAlivePlayers / 2);

  const handleVote = (targetId: string) => {
    gameState.vote(targetId);
  };

  const handleSelectPlayer = (player: any) => {
    gameState.setSelectedPlayer(player);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4">
      <Card className="panel max-w-2xl w-full bg-gray-900/95 border-2 border-red-600">
        <CardHeader>
          <CardTitle className="font-cinzel text-3xl text-center text-red-400">
            ⚖️ Vote to Eliminate
          </CardTitle>
          <p className="text-lg text-center text-gray-300 mt-2">
            Choose a player to vote out. Click a name and confirm your vote.
          </p>

          {/* Vote Progress */}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400 mb-2">
              Votes: {totalVotes}/{totalAlivePlayers} • Need {votesNeeded} to
              end early
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(totalVotes / totalAlivePlayers) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Who has voted */}
          {playersWhoVoted.length > 0 && (
            <div className="mt-3 text-center text-sm">
              <span className="text-gray-400">Voted: </span>
              <span className="text-green-400">
                {playersWhoVoted.map((p: any) => p.name).join(", ")}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Selected Player Indicator */}
          {gameState.selectedPlayer && (
            <div className="mb-4 p-3 bg-red-900/30 border-2 border-red-600 rounded-lg text-center">
              <p className="text-white">
                You are voting for:{" "}
                <strong className="text-red-400">
                  {gameState.selectedPlayer.name}
                </strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {alivePlayers.map((player: any) => {
              const isSelected =
                gameState.selectedPlayer?.playerId === player.playerId;
              return (
                <Button
                  key={player.playerId}
                  onClick={() => handleSelectPlayer(player)}
                  variant={isSelected ? "destructive" : "secondary"}
                  className={`p-4 h-auto flex flex-col items-center transition-all ${
                    isSelected
                      ? "ring-4 ring-red-500 scale-105 bg-red-600 hover:bg-red-700"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="font-bold text-lg">{player.name}</span>
                  {player.isSheriff && (
                    <span className="text-xs">⭐ Sheriff</span>
                  )}
                  {isSelected && (
                    <span className="text-xs mt-1">✓ SELECTED</span>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() =>
                gameState.selectedPlayer &&
                handleVote(gameState.selectedPlayer.playerId)
              }
              disabled={!gameState.selectedPlayer}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg"
            >
              {gameState.selectedPlayer
                ? `Vote ${gameState.selectedPlayer.name}`
                : "Select a Player"}
            </Button>
            <Button
              onClick={() => gameState.setShowVoteOverlay(false)}
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
