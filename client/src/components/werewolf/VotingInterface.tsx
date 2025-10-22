import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const votes = game?.votes || [];
  const allPlayers = game?.players || [];

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

  // Get timer from game state
  const phaseEndTime = game?.game?.phaseEndTime || game?.phaseEndTime;

  // Countdown timer for voting results phase
  useEffect(() => {
    if (isVotingResults && phaseEndTime) {
      const interval = setInterval(() => {
        const endTime = new Date(phaseEndTime).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setCountdown(remaining);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isVotingResults, phaseEndTime]);

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
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-3xl bg-gradient-to-br from-red-900/90 to-orange-900/90 border-2 border-red-500">
          <CardHeader>
            <CardTitle className="text-center font-cinzel text-3xl text-white">
              ⚖️ Voting Results
            </CardTitle>
            <p className="text-center text-red-200 text-lg mt-2">
              All votes have been cast. See who voted for whom below.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {sortedResults.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0
                      ? "bg-red-800/50 border-red-400"
                      : "bg-gray-800/50 border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-white">
                      {result.name}
                    </span>
                    <Badge
                      className={`text-lg px-3 py-1 ${
                        index === 0
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {result.totalVotes} vote
                      {result.totalVotes !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="font-semibold">Voted by:</span>{" "}
                    {result.voters.join(", ")}
                  </div>
                </div>
              ))}
              {sortedResults.length === 0 && (
                <div className="text-center text-gray-300 text-lg">
                  No votes were cast.
                </div>
              )}
            </div>

            {/* Countdown timer */}
            <div className="text-center">
              <div className="inline-block bg-gray-900/80 px-6 py-3 rounded-lg border-2 border-amber-500">
                <p className="text-gray-300 mb-1">Night begins in</p>
                <p className="text-4xl font-bold text-amber-400 font-mono">
                  {countdown}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not voted yet, show voting interface
  if (!hasVoted && currentPlayer?.isAlive) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-900/90 border-2 border-red-600">
          <CardHeader>
            <CardTitle className="text-center font-cinzel text-3xl text-red-600">
              ⚖️ Cast Your Vote
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-300 text-lg mt-2">
              Select a player to vote for elimination
            </p>
            {/* Vote Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  Votes Cast: {totalVotes}/{totalAlivePlayers}
                </span>
                <span>{totalAlivePlayers - totalVotes} votes remaining</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(totalVotes / totalAlivePlayers) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedPlayerId}
              onValueChange={setSelectedPlayerId}
              className="space-y-3 mb-6"
            >
              {alivePlayers.map((player: any) => (
                <div
                  key={player.playerId}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedPlayerId === player.playerId
                      ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
                  }`}
                  onClick={() => setSelectedPlayerId(player.playerId)}
                >
                  <RadioGroupItem
                    value={player.playerId}
                    id={player.playerId}
                    className="text-red-600"
                  />
                  <Label
                    htmlFor={player.playerId}
                    className="flex-grow cursor-pointer text-lg font-semibold"
                  >
                    {player.name}
                    {player.isSheriff && (
                      <Badge className="ml-2 bg-blue-600 hover:bg-blue-700">
                        SHERIFF ⭐
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleVote}
                disabled={!selectedPlayerId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 text-lg"
              >
                {selectedPlayerId
                  ? `Vote ${
                      alivePlayers.find(
                        (p: any) => p.playerId === selectedPlayerId
                      )?.name
                    }`
                  : "Select a Player First"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If voted, show waiting screen
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-white dark:bg-gray-900/90 border-2 border-green-600">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-cinzel font-bold text-green-600 mb-2">
            Vote Cast Successfully
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            You voted for:{" "}
            <span className="font-bold text-red-600">
              {
                allPlayers.find(
                  (p: any) => p.playerId === currentPlayerVote?.targetId
                )?.name
              }
            </span>
          </p>
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
            <p className="text-amber-800 dark:text-amber-300 font-semibold mb-2">
              Waiting for other players...
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
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
