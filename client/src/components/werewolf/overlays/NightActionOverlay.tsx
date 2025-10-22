import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Check, X } from "lucide-react";

interface NightActionOverlayProps {
  gameState: any;
}

export default function NightActionOverlay({
  gameState,
}: NightActionOverlayProps) {
  const [killConfirmation, setKillConfirmation] = useState("");
  const [actionType, setActionType] = useState<
    "kill" | "save" | "poison" | "protect" | "investigate" | null
  >(null);
  const game = gameState.gameState;
  const playerRole = gameState.getPlayerRole();

  // Calculate night action progress
  const nightActions = game?.nightActions || [];
  const rolesWithActions = ["werewolf", "seer", "doctor", "witch", "bodyguard"];
  const playersWithRoles =
    game?.players?.filter(
      (p: any) => p.isAlive && rolesWithActions.includes(p.role)
    ) || [];
  const actorsWhoActed = nightActions.map((a: any) => a.actorId);
  const totalActors = playersWithRoles.length;
  const actedCount = actorsWhoActed.length;
  const actorsNeeded = Math.ceil(totalActors * 0.7); // 70% threshold

  const getActionConfig = () => {
    switch (playerRole) {
      case "werewolf":
        return {
          title: "Choose Your Victim",
          description:
            "Select a player to eliminate tonight. Type their name exactly to confirm.",
          targets:
            game?.alivePlayers?.filter((p: any) => p.role !== "werewolf") || [],
          actionTypes: ["kill"],
          requiresConfirmation: true,
        };
      case "seer":
        const investigationsLeft =
          game?.seerInvestigationsLeft?.[gameState.playerId] || 0;
        return {
          title: "Divine a Player",
          description: `Choose a player to learn their role. Investigations remaining: ${investigationsLeft}`,
          targets:
            investigationsLeft > 0
              ? game?.alivePlayers?.filter(
                  (p: any) => p.playerId !== gameState.playerId
                ) || []
              : [],
          actionTypes: ["investigate"],
          requiresConfirmation: false,
        };
      case "doctor":
        return {
          title: "Protect a Player",
          description:
            "Choose a player to protect from werewolf attacks. You can save yourself or others.",
          targets: game?.alivePlayers || [],
          actionTypes: ["save"],
          requiresConfirmation: false,
        };
      case "witch":
        return {
          title: "Use Your Potions",
          description: "Choose to save or poison a player.",
          targets: game?.alivePlayers || [],
          actionTypes: ["save", "poison"],
          requiresConfirmation: false,
        };
      case "bodyguard":
        return {
          title: "Guard a Player",
          description:
            "Choose a player to protect. You will die if they are attacked.",
          targets:
            game?.alivePlayers?.filter(
              (p: any) => p.playerId !== gameState.playerId
            ) || [],
          actionTypes: ["protect"],
          requiresConfirmation: false,
        };
      default:
        return {
          title: "Night Action",
          description: "Perform your night action.",
          targets: [],
          actionTypes: [],
          requiresConfirmation: false,
        };
    }
  };

  const actionConfig = getActionConfig();

  const handleAction = (targetId?: string) => {
    if (playerRole === "werewolf" && targetId) {
      const target = actionConfig.targets.find(
        (p: any) => p.playerId === targetId
      );
      if (target && killConfirmation !== target.name) {
        return; // Don't proceed if name confirmation doesn't match
      }
    }
    gameState.performNightAction(targetId, actionType);
  };

  const handleSelectPlayer = (player: any) => {
    gameState.setSelectedPlayer(player);
    setKillConfirmation(""); // Reset confirmation when selecting new player
  };

  const isActionValid = () => {
    if (!gameState.selectedPlayer) return false;
    if (playerRole === "werewolf") {
      const target = actionConfig.targets.find(
        (p: any) => p.playerId === gameState.selectedPlayer.playerId
      );
      return target && killConfirmation === target.name;
    }
    return true;
  };

  const renderActionResult = () => {
    if (playerRole !== "seer" || !gameState.selectedPlayer) return null;

    const target = actionConfig.targets.find(
      (p: any) => p.playerId === gameState.selectedPlayer.playerId
    );
    if (!target) return null;

    const isWerewolf = target.role === "werewolf";
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        {isWerewolf ? (
          <Check className="w-6 h-6 text-green-500" />
        ) : (
          <X className="w-6 h-6 text-red-500" />
        )}
        <span className={isWerewolf ? "text-green-500" : "text-red-500"}>
          {isWerewolf ? "Werewolf Found!" : "Not a Werewolf"}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4">
      <Card className="panel max-w-2xl w-full bg-blue-950/95 border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="font-cinzel text-3xl text-center text-blue-300">
            🌙 {actionConfig.title}
          </CardTitle>
          <p className="text-lg text-center text-gray-300">
            {actionConfig.description}
          </p>

          {/* Night Action Progress */}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400 mb-2">
              Actions: {actedCount}/{totalActors} • Need {actorsNeeded} to end
              early
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(actedCount / totalActors) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selected Player Indicator */}
          {gameState.selectedPlayer && (
            <div className="mb-4 p-3 bg-blue-900/30 border-2 border-blue-500 rounded-lg text-center">
              <p className="text-white">
                Target:{" "}
                <strong className="text-blue-300">
                  {gameState.selectedPlayer.name}
                </strong>
              </p>
            </div>
          )}

          {actionConfig.actionTypes.length > 1 && (
            <div className="flex justify-center gap-4 mb-6">
              {actionConfig.actionTypes.map((type) => (
                <Button
                  key={type}
                  onClick={() => setActionType(type as any)}
                  variant={actionType === type ? "default" : "secondary"}
                  className={`capitalize ${
                    actionType === type
                      ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {type === "save" && "💊 "}
                  {type === "poison" && "☠️ "}
                  {type === "kill" && "🗡️ "}
                  {type === "protect" && "🛡️ "}
                  {type === "investigate" && "🔍 "}
                  {type}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {actionConfig.targets.map((player: any) => {
              const isSelected =
                gameState.selectedPlayer?.playerId === player.playerId;
              return (
                <Button
                  key={player.playerId}
                  onClick={() => handleSelectPlayer(player)}
                  variant={isSelected ? "default" : "secondary"}
                  disabled={!actionType && actionConfig.actionTypes.length > 1}
                  className={`p-4 h-auto flex flex-col items-center transition-all ${
                    isSelected
                      ? "ring-4 ring-blue-400 scale-105 bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="font-bold text-lg">{player.name}</span>
                  {player.isSheriff && (
                    <span className="text-xs">⭐ Sheriff</span>
                  )}
                  {player.hasShield && (
                    <span className="text-xs">🛡️ Shielded</span>
                  )}
                  {isSelected && (
                    <span className="text-xs mt-1">✓ SELECTED</span>
                  )}
                </Button>
              );
            })}
          </div>

          {playerRole === "werewolf" && gameState.selectedPlayer && (
            <div className="mb-6">
              <p className="text-sm text-red-300 mb-2 text-center">
                Type "{gameState.selectedPlayer.name}" to confirm kill
              </p>
              <Input
                type="text"
                placeholder={`Type: ${gameState.selectedPlayer.name}`}
                value={killConfirmation}
                onChange={(e) => setKillConfirmation(e.target.value)}
                className="text-center text-lg bg-red-950/30 border-red-500 focus:border-red-400"
              />
              {killConfirmation &&
                killConfirmation !== gameState.selectedPlayer.name && (
                  <p className="text-xs text-red-400 mt-1 text-center">
                    Name doesn't match. Type exactly:{" "}
                    {gameState.selectedPlayer.name}
                  </p>
                )}
            </div>
          )}

          {renderActionResult()}

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => handleAction(gameState.selectedPlayer?.playerId)}
              disabled={
                !isActionValid() ||
                (!actionType && actionConfig.actionTypes.length > 1)
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg"
            >
              {gameState.selectedPlayer
                ? `Confirm ${actionType || "Action"}`
                : "Select a Target"}
            </Button>
            <Button
              onClick={() => handleAction()}
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
