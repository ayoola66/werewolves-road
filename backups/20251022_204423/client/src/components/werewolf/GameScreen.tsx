import { useState, useEffect } from "react";
import PlayerList from "./PlayerList";
import Chat from "./Chat";
import RoleReveal from "./overlays/RoleReveal";
import NightActionOverlay from "./overlays/NightActionOverlay";
import GameOverOverlay from "./overlays/GameOverOverlay";
import VotingInterface from "./VotingInterface";
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
import { Shield, LogOut, User, Award } from "lucide-react";

interface GameScreenProps {
  gameState: any;
}

export default function GameScreen({ gameState }: GameScreenProps) {
  const [timer, setTimer] = useState<string>("0:00");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState("");
  const [prevPhase, setPrevPhase] = useState("");
  const { setTheme } = useTheme();
  const game = gameState.gameState;

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

    // Calculate timer from phaseEndTime for real countdown
    const interval = setInterval(() => {
      const phaseEndTime = game.game?.phaseEndTime || game.phaseEndTime;

      if (!phaseEndTime) {
        // Fallback to static timer if no end time
        const phaseTimer = game.game?.phaseTimer || game.phaseTimer || 0;
        const minutes = Math.floor(phaseTimer / 60);
        const seconds = phaseTimer % 60;
        setTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        return;
      }

      const endTime = new Date(phaseEndTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimer(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

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

  const handleShieldAction = () => {
    gameState.performNightAction(gameState.playerId, "shield");
  };

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
      {gameState.showNightActionOverlay && (
        <NightActionOverlay gameState={gameState} />
      )}
      {gameState.showGameOverOverlay && (
        <GameOverOverlay gameState={gameState} />
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
        className={`min-h-screen transition-colors duration-500 ${phaseInfo.bgColor} relative`}
      >
        {/* Leave Game Button - Bottom Left */}
        <Button
          onClick={() => setShowLeaveConfirm(true)}
          variant="outline"
          className="fixed bottom-6 left-6 bg-red-600/90 hover:bg-red-700 text-white border-red-700 font-semibold shadow-lg z-10 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Leave Game
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Players Panel */}
          <div className="lg:col-span-1">
            <PlayerList gameState={gameState} />
          </div>

          {/* Main Game Panel */}
          <div className="lg:col-span-2">
            <Card
              className={`panel rounded-lg shadow-2xl ${
                game?.phase === "night" ? "bg-gray-900/90" : "bg-white/90"
              }`}
            >
              <CardContent className="p-6 flex flex-col h-full">
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

                {/* Chat - Hidden during voting, voting_results and day phase */}
                {!(
                  game?.game?.currentPhase === "voting" ||
                  game?.game?.phase === "voting" ||
                  game?.phase === "voting" ||
                  game?.game?.currentPhase === "voting_results" ||
                  game?.game?.phase === "voting_results" ||
                  game?.phase === "voting_results" ||
                  game?.game?.currentPhase === "day" ||
                  game?.game?.phase === "day" ||
                  game?.phase === "day"
                ) && (
                  <div className="flex-grow">
                    <Chat gameState={gameState} />
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

                {/* Day Phase Message */}
                {(game?.game?.currentPhase === "day" ||
                  game?.game?.phase === "day" ||
                  game?.phase === "day") && (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center p-8">
                      <h3 className="text-3xl font-cinzel font-bold text-amber-600 mb-4">
                        Discussion Time
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        Discuss with other players and share your suspicions.
                        Voting phase will begin soon.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(game?.game?.currentPhase === "night" ||
                      game?.game?.phase === "night" ||
                      game?.phase === "night") && (
                      <>
                        {gameState.hasNightAction() &&
                          !gameState.hasPerformedNightAction && (
                            <Button
                              onClick={() =>
                                gameState.setShowNightActionOverlay(true)
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                            >
                              Night Action
                            </Button>
                          )}
                        {gameState.getCurrentPlayer()?.hasShield && (
                          <Button
                            onClick={handleShieldAction}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Use Shield
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
