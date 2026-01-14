import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VotingInterfaceProps {
  gameState: any;
}

export default function VotingInterface({ gameState }: VotingInterfaceProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const game = gameState.gameState;
  const currentPlayer = gameState.getCurrentPlayer();

  // Get alive players excluding current player
  const alivePlayers =
    game?.alivePlayers?.filter((p: any) => p.playerId !== gameState.playerId) ||
    [];

  // Get votes data
  const votes = Array.isArray(game?.votes) ? game.votes : [];
  const allPlayers = Array.isArray(game?.players) ? game.players : [];

  // Check if current player has voted
  const currentPlayerVote = votes.find(
    (v: any) => v.voterId === gameState.playerId
  );

  useEffect(() => {
    if (currentPlayerVote) {
      setHasVoted(true);
    }
  }, [currentPlayerVote]);

  // Check phase
  const currentPhase =
    game?.game?.currentPhase || game?.game?.phase || game?.phase;
  const isVotingResults = currentPhase === "voting_results";

  // Get total alive players and votes
  const totalAlivePlayers = game?.alivePlayers?.length || 0;
  const totalVotes = votes.length;

  // SECRET VOTING: Check if all players have voted
  const allPlayersVoted = totalVotes >= totalAlivePlayers;

  // Get timer from game state
  const phaseEndTime = game?.game?.phaseEndTime || game?.phaseEndTime;
  const phaseTimer = game?.game?.phaseTimer || game?.phaseTimer;

  // Countdown timer for voting results phase
  useEffect(() => {
    if (isVotingResults) {
      console.log(
        "Voting results phase - phaseTimer:",
        phaseTimer,
        "phaseEndTime:",
        phaseEndTime
      );

      if (phaseEndTime) {
        // Calculate from phaseEndTime
        const interval = setInterval(() => {
          const endTime = new Date(phaseEndTime).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          console.log("Countdown remaining:", remaining);
          setCountdown(remaining);
        }, 100);
        return () => clearInterval(interval);
      } else if (phaseTimer) {
        // Fallback to phaseTimer
        console.log("Using phaseTimer fallback:", phaseTimer);
        setCountdown(phaseTimer);
      }
    } else {
      // Reset countdown when not in voting results
      setCountdown(15);
    }
  }, [isVotingResults, phaseEndTime, phaseTimer]);

  const handleVote = () => {
    if (selectedPlayerId && !hasVoted) {
      gameState.vote(selectedPlayerId);
      setHasVoted(true);
    }
  };

  // Calculate vote results
  const voteResults = votes.reduce((acc: any, vote: any) => {
    const voter = allPlayers.find((p: any) => p.playerId === vote.voterId);
    const target = allPlayers.find((p: any) => p.playerId === vote.targetId);

    if (voter && target) {
      if (!acc[target.playerId]) {
        acc[target.playerId] = {
          name: target.name,
          voters: [],
          totalVotes: 0,
        };
      }
      acc[target.playerId].voters.push(voter.name);
      // Sheriff vote counts as 2
      acc[target.playerId].totalVotes += voter.isSheriff ? 2 : 1;
    }
    return acc;
  }, {});

  // If in voting results phase, show the results
  if (isVotingResults) {
    const sortedResults = Object.values(voteResults).sort(
      (a: any, b: any) => b.totalVotes - a.totalVotes
    );

    return (
      <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <Card className="w-full max-w-3xl bg-gradient-to-br from-red-900/90 to-orange-900/90 border-2 border-red-500">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-center font-cinzel text-xl sm:text-2xl md:text-3xl text-white">
              ⚖️ Voting Results
            </CardTitle>
            <p className="text-center text-red-200 text-sm sm:text-base md:text-lg mt-2">
              All votes have been cast. See who voted for whom below.
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 max-h-[40vh] overflow-y-auto">
              {sortedResults.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 ${
                    index === 0
                      ? "bg-red-800/50 border-red-400"
                      : "bg-gray-800/50 border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                      {result.name}
                    </span>
                    <Badge
                      className={`text-xs sm:text-sm md:text-lg px-2 sm:px-3 py-1 flex-shrink-0 ml-2 ${
                        index === 0
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {result.totalVotes} vote
                      {result.totalVotes !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 truncate">
                    <span className="font-semibold">Voted by:</span>{" "}
                    {result.voters.join(", ")}
                  </div>
                </div>
              ))}
              {sortedResults.length === 0 && (
                <div className="text-center text-gray-300 text-sm sm:text-base md:text-lg">
                  No votes were cast.
                </div>
              )}
            </div>

            {/* Countdown timer */}
            <div className="text-center">
              <div className="inline-block bg-gray-900/80 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-amber-500">
                <p className="text-gray-300 text-xs sm:text-sm mb-1">
                  Night begins in
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-400 font-mono">
                  {countdown}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not voted yet, show voting interface with radio buttons
  if (!hasVoted && currentPlayer?.isAlive) {
    return (
      <div className="flex-grow flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
        <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900/90 border-2 border-red-600 flex flex-col max-h-full">
          <CardHeader className="p-3 sm:p-4 md:p-6 flex-shrink-0">
            <CardTitle className="text-center font-cinzel text-lg sm:text-xl md:text-2xl lg:text-3xl text-red-600 dark:text-red-400">
              ⚖️ Cast Your Vote
            </CardTitle>
            <p className="text-center text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">
              Select a player to vote for elimination
            </p>
            {/* Secret Voting Notice */}
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700">
              <p className="text-center text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                🔒 <strong>Secret Voting:</strong> Votes are hidden until all players have voted
              </p>
            </div>
            {/* Vote Progress */}
            <div className="mt-2 sm:mt-3 md:mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                <span>
                  Votes: {totalVotes}/{totalAlivePlayers}
                </span>
                <span>{totalAlivePlayers - totalVotes} remaining</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div
                  className="bg-red-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(totalVotes / totalAlivePlayers) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 flex-grow overflow-hidden flex flex-col">
            {/* Radio button selection list */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 overflow-y-auto pr-1">
              {alivePlayers.map((player: any) => (
                <label
                  key={player.playerId}
                  className={`flex items-center p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedPlayerId === player.playerId
                      ? "bg-red-100 dark:bg-red-900/30 border-red-600 ring-2 ring-red-500"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="vote-selection"
                    value={player.playerId}
                    checked={selectedPlayerId === player.playerId}
                    onChange={() => setSelectedPlayerId(player.playerId)}
                    className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500 mr-3 sm:mr-4"
                  />
                  <div className="flex-grow">
                    <div className="font-bold text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">
                      {player.name}
                    </div>
                    {player.isSheriff && (
                      <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                        ⭐ Sheriff
                      </div>
                    )}
                  </div>
                  {selectedPlayerId === player.playerId && (
                    <div className="text-red-600 dark:text-red-400 text-lg">✓</div>
                  )}
                </label>
              ))}
            </div>

            {/* Confirm Vote Button */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0">
              {selectedPlayerId && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  You are voting to eliminate:{" "}
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {alivePlayers.find((p: any) => p.playerId === selectedPlayerId)?.name}
                  </span>
                </p>
              )}
              <Button
                onClick={handleVote}
                disabled={!selectedPlayerId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-8 sm:px-12 text-sm sm:text-base md:text-lg lg:text-xl shadow-lg"
              >
                {selectedPlayerId ? "✓ Confirm Vote" : "Select a Player"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If voted, show waiting screen
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-xl bg-white dark:bg-gray-900/90 border-2 border-green-600">
        <CardContent className="p-4 sm:p-6 md:p-8 text-center">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4">✅</div>
          <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-green-600 dark:text-green-400 mb-2">
            Vote Cast Successfully
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4">
            You voted for:{" "}
            <span className="font-bold text-red-600 dark:text-red-400">
              {
                allPlayers.find(
                  (p: any) => p.playerId === currentPlayerVote?.targetId
                )?.name
              }
            </span>
          </p>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
            <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm sm:text-base mb-2">
              Waiting for other players...
            </p>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
              {totalVotes}/{totalAlivePlayers} players have voted
            </p>
            <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2 mt-3">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(totalVotes / totalAlivePlayers) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
