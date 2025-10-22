import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chat from "./Chat";

interface NightActionInterfaceProps {
  gameState: any;
}

export default function NightActionInterface({
  gameState,
}: NightActionInterfaceProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [hasActed, setHasActed] = useState(false);

  const game = gameState.gameState;
  const currentPlayer = gameState.getCurrentPlayer();
  const playerRole = gameState.getPlayerRole();

  // Get alive players
  const allAlivePlayers = game?.alivePlayers || [];

  // Get night actions data
  const nightActions = game?.nightActions || [];

  // Check if current player has acted
  const currentPlayerAction = nightActions.find(
    (a: any) => a.playerId === gameState.playerId
  );

  useEffect(() => {
    if (currentPlayerAction) {
      setHasActed(true);
    }
  }, [currentPlayerAction]);

  // Filter available targets based on role
  const getAvailableTargets = () => {
    switch (playerRole) {
      case "werewolf":
        return allAlivePlayers.filter(
          (p: any) => p.role !== "werewolf" && p.role !== "minion"
        );
      case "doctor":
        return allAlivePlayers; // Can save anyone including themselves
      case "seer":
        return allAlivePlayers.filter(
          (p: any) => p.playerId !== gameState.playerId
        );
      case "bodyguard":
        return allAlivePlayers.filter(
          (p: any) => p.playerId !== gameState.playerId
        );
      default:
        return [];
    }
  };

  const availableTargets = getAvailableTargets();

  const getRoleConfig = () => {
    switch (playerRole) {
      case "werewolf":
        return {
          title: "🐺 Choose Your Victim",
          subtitle:
            "Select a player to eliminate tonight. Coordinate with other werewolves in the chat.",
          color: "text-red-400",
          bgColor: "bg-red-900/20",
          borderColor: "border-red-600",
        };
      case "doctor":
        return {
          title: "💊 Protect a Player",
          subtitle: "Choose a player to protect from werewolf attacks tonight.",
          color: "text-green-400",
          bgColor: "bg-green-900/20",
          borderColor: "border-green-600",
        };
      case "seer":
        return {
          title: "🔮 Divine a Player",
          subtitle: "Choose a player to learn their true role.",
          color: "text-purple-400",
          bgColor: "bg-purple-900/20",
          borderColor: "border-purple-600",
        };
      case "bodyguard":
        return {
          title: "🛡️ Guard a Player",
          subtitle:
            "Choose a player to protect. You will die if they are attacked.",
          color: "text-blue-400",
          bgColor: "bg-blue-900/20",
          borderColor: "border-blue-600",
        };
      default:
        return {
          title: "Night Time",
          subtitle: "Wait for other players to complete their actions.",
          color: "text-gray-400",
          bgColor: "bg-gray-900/20",
          borderColor: "border-gray-600",
        };
    }
  };

  const roleConfig = getRoleConfig();
  const isWerewolf = playerRole === "werewolf" || playerRole === "minion";
  const hasNightAction = ["werewolf", "doctor", "seer", "bodyguard"].includes(
    playerRole || ""
  );

  const handleAction = () => {
    if (selectedPlayerId && !hasActed) {
      gameState.performNightAction(selectedPlayerId);
      setHasActed(true);
    }
  };

  // Calculate action progress
  const rolesWithActions = ["werewolf", "seer", "doctor", "bodyguard"];
  const playersWithRoles =
    game?.alivePlayers?.filter((p: any) => rolesWithActions.includes(p.role)) ||
    [];
  const totalActors = playersWithRoles.length;
  const actedCount = nightActions.length;

  // If player has no night action, show waiting screen
  if (!hasNightAction) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <Card className="w-full max-w-xl bg-gray-900/90 border-2 border-gray-600">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🌙</div>
            <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-gray-300 mb-2">
              Night Time
            </h3>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-4">
              The night is dark and full of secrets. Wait while others perform
              their actions.
            </p>
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700">
              <p className="text-blue-800 dark:text-blue-300 font-semibold text-sm sm:text-base mb-2">
                Night Progress
              </p>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                {actedCount}/{totalActors} players have acted
              </p>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(actedCount / totalActors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If player has acted, show waiting screen
  if (hasActed) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <Card
          className={`w-full max-w-xl bg-white dark:bg-gray-900/90 border-2 ${roleConfig.borderColor}`}
        >
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4">✅</div>
            <h3
              className={`text-xl sm:text-2xl font-cinzel font-bold ${roleConfig.color} mb-2`}
            >
              Action Complete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4">
              You have completed your night action. Wait for others to finish.
            </p>
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
              <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm sm:text-base mb-2">
                Night Progress
              </p>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                {actedCount}/{totalActors} players have acted
              </p>
              <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2 mt-3">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(actedCount / totalActors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main night action interface
  return (
    <div className="flex-grow flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 overflow-hidden">
      {/* Werewolf Chat - Only visible to werewolves */}
      {isWerewolf && (
        <div className="flex-1 min-h-[180px] md:min-h-0 max-h-[300px] md:max-h-full">
          <Card className="h-full bg-red-900/10 border-2 border-red-600">
            <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-3 md:p-4">
              <CardTitle className="font-cinzel text-sm sm:text-base md:text-lg lg:text-xl text-red-400 flex items-center gap-2">
                🐺 Werewolf Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Chat gameState={gameState} channel="werewolf" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Selection Panel */}
      <div className={isWerewolf ? "flex-1" : "flex-1 max-w-3xl mx-auto"}>
        <Card
          className={`h-full bg-white dark:bg-gray-900/90 border-2 ${roleConfig.borderColor} flex flex-col`}
        >
          <CardHeader className="p-2 sm:p-3 md:p-4 lg:p-6 flex-shrink-0">
            <CardTitle
              className={`font-cinzel text-lg sm:text-xl md:text-2xl lg:text-3xl text-center ${roleConfig.color}`}
            >
              {roleConfig.title}
            </CardTitle>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-center text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
              {roleConfig.subtitle}
            </p>

            {/* Action Progress */}
            <div className="mt-2 sm:mt-3 md:mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                <span>
                  Actions: {actedCount}/{totalActors}
                </span>
                <span>{totalActors - actedCount} remaining</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div
                  className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                    playerRole === "werewolf"
                      ? "bg-red-600"
                      : playerRole === "doctor"
                      ? "bg-green-600"
                      : playerRole === "seer"
                      ? "bg-purple-600"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${(actedCount / totalActors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 flex-grow overflow-hidden flex flex-col">
            <RadioGroup
              value={selectedPlayerId}
              onValueChange={setSelectedPlayerId}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-y-auto pr-2"
            >
              {availableTargets.map((player: any) => (
                <div
                  key={player.playerId}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedPlayerId === player.playerId
                      ? `${roleConfig.borderColor} ${roleConfig.bgColor} ring-2 ${
                          playerRole === "werewolf"
                            ? "ring-red-500"
                            : playerRole === "doctor"
                            ? "ring-green-500"
                            : playerRole === "seer"
                            ? "ring-purple-500"
                            : "ring-blue-500"
                        }`
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                  onClick={() => setSelectedPlayerId(player.playerId)}
                >
                  <RadioGroupItem
                    value={player.playerId}
                    id={player.playerId}
                    className={`flex-shrink-0 ${
                      playerRole === "werewolf"
                        ? "text-red-600"
                        : playerRole === "doctor"
                        ? "text-green-600"
                        : playerRole === "seer"
                        ? "text-purple-600"
                        : "text-blue-600"
                    }`}
                  />
                  <Label
                    htmlFor={player.playerId}
                    className="flex-grow cursor-pointer text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate"
                  >
                    {player.name}
                    {player.isHost && " 👑"}
                    {player.isSheriff && " ⭐"}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                onClick={handleAction}
                disabled={!selectedPlayerId}
                className={`${
                  playerRole === "werewolf"
                    ? "bg-red-600 hover:bg-red-700"
                    : playerRole === "doctor"
                    ? "bg-green-600 hover:bg-green-700"
                    : playerRole === "seer"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 sm:py-3 px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base lg:text-lg`}
              >
                {selectedPlayerId
                  ? `Confirm ${
                      playerRole === "werewolf"
                        ? "Kill"
                        : playerRole === "doctor"
                        ? "Protect"
                        : playerRole === "seer"
                        ? "Investigate"
                        : "Guard"
                    }`
                  : "Select Player"}
              </Button>
              <Button
                onClick={() => gameState.performNightAction()}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base lg:text-lg"
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
