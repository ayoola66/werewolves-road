import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  const [shieldActivated, setShieldActivated] = useState(false);
  const [hasEndedNight, setHasEndedNight] = useState(false); // Tracks if player clicked "End Night"

  const game = gameState.gameState;
  const currentPlayer = gameState.getCurrentPlayer();
  const playerRole = gameState.getPlayerRole();

  // Safe array access
  const allAlivePlayers = Array.isArray(game?.alivePlayers) ? game.alivePlayers : [];
  const nightActions = Array.isArray(game?.nightActions) ? game.nightActions : [];

  // Check if player has shield available and hasn't used it yet
  const hasShieldAvailable = currentPlayer?.hasShield && !shieldActivated;
  
  // Check if shield was already activated this night
  const shieldActionThisNight = nightActions.find(
    (a: any) => a.playerId === gameState.playerId && a.actionType === 'shield'
  );

  // Check if current player has acted
  const currentPlayerAction = nightActions.find(
    (a: any) => a.playerId === gameState.playerId
  );
  
  // Check if player has already ended their night
  const endNightAction = nightActions.find(
    (a: any) => a.playerId === gameState.playerId && a.actionType === 'end_night'
  );

  useEffect(() => {
    if (currentPlayerAction) {
      setHasActed(true);
    }
    if (shieldActionThisNight) {
      setShieldActivated(true);
    }
    if (endNightAction) {
      setHasEndedNight(true);
    }
  }, [currentPlayerAction, shieldActionThisNight, endNightAction]);
  
  // Handle shield activation
  const handleUseShield = async () => {
    if (!hasShieldAvailable || shieldActivated) return;
    
    try {
      await gameState.useShield();
      setShieldActivated(true);
      // Using shield also marks as ready for night end
      setHasEndedNight(true);
    } catch (error) {
      console.error('Failed to activate shield:', error);
    }
  };
  
  // Handle "Don't Use Shield" - marks player as ready without using shield
  const handleDontUseShield = async () => {
    try {
      // Submit a "skip_shield" action to mark player as ready
      await gameState.performNightAction(null, 'skip_shield');
      setHasEndedNight(true);
    } catch (error) {
      console.error('Failed to skip shield:', error);
      setHasEndedNight(true); // Still mark locally
    }
  };
  
  // Handle "End Night" button - marks player as ready to proceed
  const handleEndNight = async () => {
    try {
      await gameState.performNightAction(null, 'end_night');
      setHasEndedNight(true);
    } catch (error) {
      console.error('Failed to end night:', error);
      setHasEndedNight(true); // Still mark locally
    }
  };

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
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-600",
          selectedBg: "bg-red-600",
          borderColor: "border-red-600",
          hoverBorder: "hover:border-red-400",
          buttonClass: "bg-red-600 hover:bg-red-700",
          action: "Kill",
        };
      case "doctor":
        return {
          title: "💊 Protect a Player",
          subtitle: "Choose a player to protect from werewolf attacks tonight.",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-600",
          selectedBg: "bg-green-600",
          borderColor: "border-green-600",
          hoverBorder: "hover:border-green-400",
          buttonClass: "bg-green-600 hover:bg-green-700",
          action: "Protect",
        };
      case "seer":
        return {
          title: "🔮 Divine a Player",
          subtitle: "Choose a player to learn their true role.",
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-600",
          selectedBg: "bg-purple-600",
          borderColor: "border-purple-600",
          hoverBorder: "hover:border-purple-400",
          buttonClass: "bg-purple-600 hover:bg-purple-700",
          action: "Investigate",
        };
      case "bodyguard":
        return {
          title: "🛡️ Guard a Player",
          subtitle:
            "Choose a player to protect. You will die if they are attacked.",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-600",
          selectedBg: "bg-blue-600",
          borderColor: "border-blue-600",
          hoverBorder: "hover:border-blue-400",
          buttonClass: "bg-blue-600 hover:bg-blue-700",
          action: "Guard",
        };
      default:
        return {
          title: "Night Time",
          subtitle: "Wait for other players to complete their actions.",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-600",
          selectedBg: "bg-gray-600",
          borderColor: "border-gray-600",
          hoverBorder: "hover:border-gray-400",
          buttonClass: "bg-gray-600 hover:bg-gray-700",
          action: "Act",
        };
    }
  };

  const roleConfig = getRoleConfig();
  const isWerewolf = playerRole === "werewolf" || playerRole === "minion";
  const hasNightAction = ["werewolf", "doctor", "seer", "bodyguard"].includes(
    playerRole || ""
  );

  // Get the action type based on the player's role for the edge function
  const getActionType = () => {
    switch (playerRole) {
      case "werewolf":
        return "kill";
      case "doctor":
        return "protect";
      case "seer":
        return "investigate";
      case "bodyguard":
        return "protect";
      default:
        return "skip";
    }
  };

  const handleAction = () => {
    if (selectedPlayerId && !hasActed) {
      const actionType = getActionType();
      gameState.performNightAction(selectedPlayerId, actionType);
      setHasActed(true);
    }
  };

  const handleSkip = () => {
    // Skip action - just mark as acted without performing any action
    setHasActed(true);
    // Optionally notify the server about skipping (no target, no actual action)
    // For now, we just update local state - the timer will handle phase transition
  };

  // Calculate action progress - ALL alive players must act/end night
  const totalAlivePlayers = allAlivePlayers.length;
  
  // Count unique players who have submitted any night action (action, shield, skip, end_night)
  const uniqueActedPlayerIds = new Set(nightActions.map((a: any) => a.playerId));
  const actedCount = uniqueActedPlayerIds.size;
  
  // Legacy: roles with special actions (for display purposes)
  const rolesWithActions = ["werewolf", "seer", "doctor", "bodyguard"];
  const playersWithRoles = allAlivePlayers.filter((p: any) => rolesWithActions.includes(p.role));
  const totalActors = playersWithRoles.length;

  // Shield Button Component (reusable)
  const ShieldButton = () => {
    if (!hasShieldAvailable && !shieldActivated) return null;
    
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border-2 border-cyan-500/50">
        {shieldActivated ? (
          <div className="text-center">
            <div className="text-3xl mb-2">🛡️✨</div>
            <p className="text-cyan-300 font-bold">Shield Active!</p>
            <p className="text-cyan-400 text-sm">You are protected tonight</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <p className="text-cyan-300 font-bold mb-2">One-Time Shield Available</p>
            <p className="text-cyan-400 text-sm mb-3">
              Activate to protect yourself from ALL attacks tonight. Once used, it's gone forever!
            </p>
            <Button
              onClick={handleUseShield}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-2"
            >
              🛡️ Activate Shield
            </Button>
          </div>
        )}
      </div>
    );
  };

  // If player has no night action, show waiting screen WITH chat (Bug #3 fix)
  if (!hasNightAction) {
    return (
      <div className="flex-grow flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 overflow-hidden">
        {/* Village Chat Panel - ALL players must have chat during night to avoid unfair lightning strikes */}
        <div className="flex-1 min-h-[200px] md:min-h-0 max-h-[350px] md:max-h-full">
          <Card className="h-full bg-indigo-900/10 border-2 border-indigo-600 flex flex-col">
            <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-3 md:p-4">
              <CardTitle className="font-cinzel text-sm sm:text-base md:text-lg lg:text-xl text-indigo-400 flex items-center gap-2">
                🌙 Village Chat
                <span className="text-xs font-normal text-indigo-300">(Scrambled)</span>
              </CardTitle>
              <p className="text-xs text-indigo-300 mt-1">
                Type to blend in - all messages appear scrambled to hide werewolf activity!
              </p>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-hidden">
              <Chat gameState={gameState} channel="player" />
            </CardContent>
          </Card>
        </div>

        {/* Waiting Info Panel */}
        <div className="flex-1 max-w-xl">
          <Card className="h-full bg-gray-900/90 border-2 border-gray-600 flex flex-col">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center flex-grow flex flex-col justify-center">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-4">🌙</div>
              <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-gray-300 mb-2">
                Night Time
              </h3>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-4">
                The night is dark and full of secrets. Wait while others perform
                their actions.
              </p>
              
              {/* Shield Button */}
              <ShieldButton />
              
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
                      width: `${totalActors > 0 ? (actedCount / totalActors) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4">
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
      {/* Chat Panel - Different for werewolves vs villagers */}
      <div className="flex-1 min-h-[180px] md:min-h-0 max-h-[300px] md:max-h-full flex flex-col gap-2">
        {/* Werewolf Private Chat - Only visible to werewolves */}
        {isWerewolf && (
          <Card className="flex-1 bg-red-900/10 border-2 border-red-600">
            <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-3 md:p-4">
              <CardTitle className="font-cinzel text-sm sm:text-base md:text-lg lg:text-xl text-red-400 flex items-center gap-2">
                🐺 Werewolf Chat
                <span className="text-xs font-normal text-red-300">(Private)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Chat gameState={gameState} channel="werewolf" />
            </CardContent>
          </Card>
        )}
        
        {/* Village Chat - Visible to ALL players during night (scrambled for non-werewolves) */}
        <Card className={`flex-1 ${isWerewolf ? 'max-h-[150px]' : ''} bg-indigo-900/10 border-2 border-indigo-600`}>
          <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-3 md:p-4">
            <CardTitle className="font-cinzel text-sm sm:text-base md:text-lg lg:text-xl text-indigo-400 flex items-center gap-2">
              🌙 Village Chat
              <span className="text-xs font-normal text-indigo-300">(Scrambled)</span>
            </CardTitle>
            <p className="text-xs text-indigo-300 mt-1">
              {isWerewolf 
                ? "Type here to blend in with villagers - your messages are scrambled to them!"
                : "Type to blend in - all messages appear scrambled to hide werewolf activity!"
              }
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Chat gameState={gameState} channel="player" />
          </CardContent>
        </Card>
      </div>

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
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-center text-gray-700 dark:text-gray-300 mt-1 sm:mt-2">
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
                  className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${roleConfig.bgColor}`}
                  style={{
                    width: `${(actedCount / totalActors) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 flex-grow overflow-hidden flex flex-col">
            {/* Simple 2-column tap-to-select grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-y-auto pr-1">
              {availableTargets.map((player: any) => (
                <button
                  key={player.playerId}
                  onClick={() => setSelectedPlayerId(player.playerId)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlayerId === player.playerId
                      ? `${roleConfig.selectedBg} border-${roleConfig.borderColor} text-white ring-2 ring-offset-1`
                      : `bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${roleConfig.hoverBorder} text-gray-900 dark:text-white`
                  }`}
                >
                  <div className="font-bold text-sm sm:text-base md:text-lg truncate">
                    {player.name}
                  </div>
                  <div className="text-xs sm:text-sm mt-1 opacity-90">
                    {player.isHost && "👑 "}
                    {player.isSheriff && "⭐ Sheriff"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                onClick={handleAction}
                disabled={!selectedPlayerId}
                className={`${roleConfig.buttonClass} disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 sm:py-3 px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base lg:text-lg`}
              >
                {selectedPlayerId
                  ? `Confirm ${roleConfig.action}`
                  : "Select Player"}
              </Button>
              <Button
                onClick={handleSkip}
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
