import { useState, useEffect, useRef } from "react";
import PlayerSidebar from "./PlayerSidebar";
import Chat from "./Chat";
import RoleReveal from "./overlays/RoleReveal";
import GameOverOverlay from "./overlays/GameOverOverlay";
import EliminatedOverlay from "./overlays/EliminatedOverlay";
import VotingInterface from "./VotingInterface";
import NightActionInterface from "./NightActionInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { LogOut, User, Award } from "lucide-react";

interface GameScreenProps {
  gameState: any;
}

export default function GameScreen({ gameState }: GameScreenProps) {
  const [timer, setTimer] = useState<string>("0:00");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState("");
  const [prevPhase, setPrevPhase] = useState("");
  const [showEliminatedOverlay, setShowEliminatedOverlay] = useState(false);
  const wasAliveRef = useRef<boolean | null>(null);
  const { setTheme } = useTheme();
  
  // gameState prop is the hook return value, so access gameState.gameState
  const game = gameState?.gameState;

  // Show loading state if game state is not available
  if (!game) {
    console.error("GameScreen: No game state available", {
      gameStateExists: !!gameState,
      gameStateKeys: gameState ? Object.keys(gameState) : [],
      gameStateGameState: gameState?.gameState,
    });
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game state...</p>
          <p className="text-sm text-gray-400 mt-2">If this persists, check console for errors</p>
        </div>
      </div>
    );
  }

  // Phase change detection and transition animation
  useEffect(() => {
    if (!game) return;

    const currentPhase =
      game.game?.currentPhase || game.game?.phase || game.phase;

    // Detect phase change and trigger transition
    if (
      prevPhase &&
      prevPhase !== currentPhase &&
      currentPhase !== "role_reveal"
    ) {
      setTransitionPhase(currentPhase);
      setShowPhaseTransition(true);

      // Hide transition after 3 seconds
      const timeout = setTimeout(() => {
        setShowPhaseTransition(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }

    setPrevPhase(currentPhase);
  }, [game?.game?.currentPhase, game?.game?.phase, game?.phase, prevPhase]);

  // Detect when current player is eliminated
  useEffect(() => {
    const currentPlayer = gameState.getCurrentPlayer();
    const isCurrentlyAlive = currentPlayer?.isAlive;

    // If player was alive and is now dead, show eliminated overlay
    if (wasAliveRef.current === true && isCurrentlyAlive === false) {
      setShowEliminatedOverlay(true);
    }

    // Update the ref for next comparison
    wasAliveRef.current = isCurrentlyAlive ?? null;
  }, [gameState]);

  // Theme and timer updates
  useEffect(() => {
    if (!game) return;

    const currentPhase =
      game.game?.currentPhase || game.game?.phase || game.phase;

    // Set theme based on phase
    if (currentPhase === "night") {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    // Phase default timers (fallback when phaseEndTime not yet set)
    const PHASE_DEFAULTS: Record<string, number> = {
      role_reveal: 15,
      night: 120,
      day: 180,
      voting: 120,
      voting_results: 10,
    };

    // Calculate timer immediately on mount
    const calculateTimer = () => {
      const phaseEndTime = game.game?.phaseEndTime || game.phaseEndTime;

      if (phaseEndTime) {
        const endTime = new Date(phaseEndTime).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        // Fallback to phase default or phaseTimer
        const phaseTimer = game.game?.phaseTimer || game.phaseTimer || PHASE_DEFAULTS[currentPhase] || 120;
        const minutes = Math.floor(phaseTimer / 60);
        const seconds = phaseTimer % 60;
        setTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    // Calculate immediately
    calculateTimer();

    // Then update every second
    const interval = setInterval(calculateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    game?.game?.phaseEndTime,
    game?.phaseEndTime,
    game?.game?.phaseTimer,
    game?.phaseTimer,
    game?.game?.currentPhase,
    game?.game?.phase,
    game?.phase,
    setTheme,
  ]);

  const getPhaseInfo = () => {
    const currentPhase =
      game?.game?.currentPhase || game?.game?.phase || game?.phase;
    const nightCount = game?.game?.nightCount || game?.nightCount || 1;
    const dayCount = game?.game?.dayCount || game?.dayCount || 1;

    switch (currentPhase) {
      case "night":
        return {
          title: `Night ${nightCount}`,
          subtitle: "The village sleeps while evil stirs...",
          color: "text-blue-400",
          bgColor: "bg-gray-900",
        };
      case "day":
        return {
          title: `Day ${dayCount}`,
          subtitle: "Discuss and find the werewolves",
          color: "text-yellow-400",
          bgColor: "bg-gray-100",
        };
      case "voting":
        return {
          title: "Voting Phase",
          subtitle: "Vote to eliminate a player",
          color: "text-red-400",
          bgColor: "bg-gray-100",
        };
      case "voting_results":
        return {
          title: "Voting Results",
          subtitle: "The village has decided...",
          color: "text-orange-400",
          bgColor: "bg-gray-100",
        };
      default:
        return {
          title: "Game Phase",
          subtitle: "",
          color: "text-gray-400",
          bgColor: "bg-gray-100",
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  const handleLeaveGame = () => {
    gameState.leaveGame();
    setShowLeaveConfirm(false);
  };

  const getTransitionContent = () => {
    const nightCount = game?.game?.nightCount || game?.nightCount || 1;
    const dayCount = game?.game?.dayCount || game?.dayCount || 1;

    switch (transitionPhase) {
      case "night":
        return {
          emoji: "🌙",
          title: `Night ${nightCount} Falls`,
          subtitle: "The village sleeps... darkness descends",
          bgGradient: "from-indigo-950 via-blue-950 to-black",
          textColor: "text-blue-200",
        };
      case "day":
        return {
          emoji: "☀️",
          title: `Day ${dayCount} Breaks`,
          subtitle: "Dawn arrives... the village awakens",
          bgGradient: "from-amber-300 via-orange-200 to-yellow-100",
          textColor: "text-amber-900",
        };
      case "voting":
        return {
          emoji: "⚖️",
          title: "Voting Time",
          subtitle: "Make your choice... who shall be eliminated?",
          bgGradient: "from-red-900 via-red-700 to-orange-600",
          textColor: "text-red-100",
        };
      case "voting_results":
        return {
          emoji: "📊",
          title: "The Votes Are In",
          subtitle: "The village has spoken...",
          bgGradient: "from-orange-900 via-red-800 to-red-900",
          textColor: "text-orange-100",
        };
      default:
        return {
          emoji: "🎮",
          title: "Phase Change",
          subtitle: "",
          bgGradient: "from-gray-900 to-gray-700",
          textColor: "text-gray-100",
        };
    }
  };

  const transitionContent = getTransitionContent();

  return (
    <>
      {/* Phase Transition Overlay */}
      {showPhaseTransition && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br ${transitionContent.bgGradient} animate-in fade-in duration-500`}
        >
          <div className="text-center animate-in zoom-in duration-700">
            <div className="text-9xl mb-6 animate-bounce">
              {transitionContent.emoji}
            </div>
            <h1
              className={`font-cinzel text-6xl font-bold mb-4 ${transitionContent.textColor} drop-shadow-2xl`}
            >
              {transitionContent.title}
            </h1>
            <p
              className={`text-2xl ${transitionContent.textColor} opacity-90 italic`}
            >
              {transitionContent.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Overlays */}
      {gameState.showRoleReveal && <RoleReveal gameState={gameState} />}
      {gameState.showGameOverOverlay && (
        <GameOverOverlay gameState={gameState} />
      )}
      {showEliminatedOverlay && (
        <EliminatedOverlay 
          gameState={gameState} 
          onContinueWatching={() => setShowEliminatedOverlay(false)} 
        />
      )}

      {/* Leave Game Confirmation Dialog */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent className="bg-gray-900 border-2 border-red-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-red-400 font-cinzel">
              Leave Game?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-base">
              Are you sure you want to leave the game? This action cannot be
              undone and will remove you from the current game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGame}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Leave Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`min-h-screen transition-colors duration-500 ${phaseInfo.bgColor} relative flex`}
      >
        {/* Player Sidebar - Collapsible on mobile */}
        <PlayerSidebar
          alivePlayers={game?.alivePlayers || []}
          deadPlayers={game?.deadPlayers || []}
          currentPlayerId={gameState.playerId}
          gamePhase={game?.game?.currentPhase || game?.phase}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Leave Game Button - Top Right */}
          <Button
            onClick={() => setShowLeaveConfirm(true)}
            variant="outline"
            className="absolute top-4 right-4 bg-red-600/90 hover:bg-red-700 text-white border-red-700 font-semibold shadow-lg z-10 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Game
          </Button>

          {/* Main Game Panel */}
          <div className="flex-1 p-4 sm:p-6 pt-16 overflow-hidden">
            <Card
              className={`h-full rounded-lg shadow-2xl ${
                game?.phase === "night" ? "bg-gray-900/90" : "bg-white/90"
              }`}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                {/* Player Info Banner */}
                {gameState.getCurrentPlayer() && (
                  <div className="mb-4 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-gray-800 dark:to-gray-700 border-2 border-amber-600/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                          <User className="w-5 h-5" />
                          <span className="font-bold text-lg">
                            {gameState.playerName}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-amber-600/30"></div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-600" />
                          <span className="font-cinzel font-semibold text-base text-amber-800 dark:text-amber-200 capitalize">
                            {gameState.getPlayerRole() || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          gameState.getCurrentPlayer()?.isAlive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {gameState.getCurrentPlayer()?.isAlive
                          ? "✓ Alive"
                          : "✗ Dead"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase Display */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2
                      className={`font-cinzel text-4xl font-bold ${phaseInfo.color}`}
                    >
                      {phaseInfo.title}
                    </h2>
                    <p className="text-gray-400">{phaseInfo.subtitle}</p>
                  </div>
                  <div
                    className={`text-2xl font-bold text-gray-300 bg-gray-900/50 px-4 py-2 rounded-lg ${
                      game?.phaseTimer <= 10
                        ? "timer-warning text-red-400 animate-pulse"
                        : ""
                    }`}
                  >
                    {timer}
                  </div>
                </div>

                {/* Day Phase - No Chat, Physical Discussion Only */}
                {(game?.game?.currentPhase === "day" ||
                  game?.game?.phase === "day" ||
                  game?.phase === "day") && (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center p-8 bg-amber-50 dark:bg-gray-800 rounded-lg border-2 border-amber-600/30 max-w-md">
                      <div className="text-6xl mb-4">🗣️</div>
                      <h3 className="font-cinzel text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3">
                        Discussion Time
                      </h3>
                      <p className="text-amber-800 dark:text-amber-200 text-lg mb-4">
                        Chat is disabled during the day. Discuss with other players verbally to find the werewolves!
                      </p>
                      <div className="text-sm text-amber-600 dark:text-amber-400 italic">
                        "The wise villagers speak face to face, for the written word may be intercepted..."
                      </div>
                    </div>
                  </div>
                )}

                {/* Voting Interface - Shown during voting and voting_results phases */}
                {(game?.game?.currentPhase === "voting" ||
                  game?.game?.phase === "voting" ||
                  game?.phase === "voting" ||
                  game?.game?.currentPhase === "voting_results" ||
                  game?.game?.phase === "voting_results" ||
                  game?.phase === "voting_results") && (
                  <VotingInterface gameState={gameState} />
                )}

                {/* Night Action Interface - Shown during night phase */}
                {(game?.game?.currentPhase === "night" ||
                  game?.game?.phase === "night" ||
                  game?.phase === "night") && (
                  <NightActionInterface gameState={gameState} />
                )}

                {/* Start Voting Button - During Day Phase */}
                {(game?.game?.currentPhase === "day" ||
                  game?.game?.phase === "day" ||
                  game?.phase === "day") &&
                  gameState.getCurrentPlayer()?.isAlive && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() => gameState.startVoting()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 text-lg shadow-lg"
                      >
                        🗳️ Start Voting Now
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
