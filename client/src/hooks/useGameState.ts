import { useState, useCallback } from "react";
import { GameState, GameSettings, Player, ChatMessage } from "@/lib/gameTypes";
import { useWebSocket } from "./useWebSocket";
import { useToast } from "./use-toast";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [currentScreen, setCurrentScreen] = useState<
    "initial" | "settings" | "lobby" | "game"
  >("initial");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [showVoteOverlay, setShowVoteOverlay] = useState(false);
  const [showNightActionOverlay, setShowNightActionOverlay] = useState(false);
  const [showGameOverOverlay, setShowGameOverOverlay] = useState(false);
  const [hasPerformedNightAction, setHasPerformedNightAction] = useState(false);

  const { sendMessage, onMessage, isConnected } = useWebSocket();
  const { toast } = useToast();

  // WebSocket message handlers
  onMessage("game_created", (message) => {
    setGameState(message.gameState);
    setPlayerId(message.playerId);
    setCurrentScreen("lobby");
    toast({
      title: "Game Created",
      description: `Game code: ${message.gameCode}`,
    });
  });

  onMessage("game_joined", (message) => {
    setGameState(message.gameState);
    setPlayerId(message.playerId);
    setCurrentScreen("lobby");
    toast({
      title: "Joined Game",
      description: `Welcome to the game!`,
    });
  });

  onMessage("game_started", () => {
    setCurrentScreen("game");
    setShowRoleReveal(true);
    toast({
      title: "Game Started",
      description: "The game has begun!",
    });
  });

  onMessage("game_state_update", (message) => {
    console.log("Received game state update:", message);
    if (!message.gameState) {
      console.error("Invalid game state update:", message);
      return;
    }

    // Preserve all server properties - don't restructure and lose data!
    const newGameState = {
      game: message.gameState.game,
      players: message.gameState.players || [],
      alivePlayers: message.gameState.alivePlayers || [],
      deadPlayers: message.gameState.deadPlayers || [],
      votes: message.gameState.votes || [],
      nightActions: message.gameState.nightActions || [],
      chatMessages: message.gameState.chatMessages || [],
      phase: message.gameState.phase,
      phaseTimer: message.gameState.phaseTimer,
      nightCount: message.gameState.nightCount,
      dayCount: message.gameState.dayCount,
      werewolfCount: message.gameState.werewolfCount,
      villagerCount: message.gameState.villagerCount,
      seerInvestigationsLeft: message.gameState.seerInvestigationsLeft,
    };

    console.log("Setting new game state:", newGameState);
    setGameState(newGameState);

    // Handle phase transitions
    const currentPhase = newGameState.phase;
    if (currentPhase === "night") {
      setHasPerformedNightAction(false); // Reset night action state
      const currentPlayer = message.gameState.alivePlayers?.find(
        (p: Player) => p.playerId === playerId
      );
      if (currentPlayer && hasNightAction(currentPlayer.role)) {
        setTimeout(() => {
          if (!showRoleReveal) {
            // Only show night action if role reveal is done
            setShowNightActionOverlay(true);
          }
        }, 2000);
      }
    } else if (currentPhase === "day") {
      setShowNightActionOverlay(false);
      setHasPerformedNightAction(false);
    } else if (currentPhase === "game_over") {
      setShowGameOverOverlay(true);
      setShowNightActionOverlay(false);
      setShowVoteOverlay(false);
    }
  });

  onMessage("player_joined", (message) => {
    console.log("Player joined:", message);
    toast({
      title: "Player Joined",
      description: `${message.playerName} joined the game`,
    });
  });

  onMessage("player_left", (message) => {
    toast({
      title: "Player Left",
      description: `${message.playerName} left the game`,
    });
  });

  onMessage("chat_message", (message) => {
    // Chat messages are handled in the GameState update
  });

  onMessage("vote_recorded", () => {
    setShowVoteOverlay(false);
    setSelectedPlayer(null);
    toast({
      title: "Vote Recorded",
      description: "Your vote has been recorded",
    });
  });

  onMessage("night_action_recorded", () => {
    setShowNightActionOverlay(false);
    setSelectedPlayer(null);
    setHasPerformedNightAction(true);
    toast({
      title: "Action Recorded",
      description: "Your night action has been recorded",
    });
  });

  onMessage("phase_change", (message) => {
    console.log("Phase changed:", message);

    // Show events (deaths, eliminations, etc.)
    if (message.events && message.events.length > 0) {
      message.events.forEach((event: any) => {
        toast({
          title:
            event.type === "death"
              ? "💀 Death"
              : event.type === "elimination"
              ? "⚖️ Elimination"
              : "Event",
          description: event.message,
        });
      });
    }

    // Reset overlays on phase change
    if (message.phase === "day") {
      setShowNightActionOverlay(false);
      setShowVoteOverlay(false);
    } else if (message.phase === "voting") {
      setShowNightActionOverlay(false);
    } else if (message.phase === "night") {
      setShowVoteOverlay(false);
      setHasPerformedNightAction(false);
    }
  });

  onMessage("game_over", (message) => {
    console.log("Game over:", message);
    setShowGameOverOverlay(true);
    toast({
      title: "Game Over!",
      description: message.message,
    });
  });

  onMessage("error", (message) => {
    toast({
      title: "Error",
      description: message.message,
      variant: "destructive",
    });
  });

  const createGame = useCallback(
    (name: string, settings: GameSettings) => {
      setPlayerName(name);
      sendMessage({
        type: "create_game",
        playerName: name,
        settings,
      });
    },
    [sendMessage]
  );

  const joinGame = useCallback(
    (gameCode: string, name: string) => {
      setPlayerName(name);
      sendMessage({
        type: "join_game",
        gameCode: gameCode.toUpperCase(),
        playerName: name,
      });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: "start_game",
        gameCode: gameState.game.gameCode,
      });
    }
  }, [sendMessage, gameState]);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (gameState) {
        sendMessage({
          type: "chat_message",
          gameCode: gameState.game.gameCode,
          message,
        });
      }
    },
    [sendMessage, gameState]
  );

  const vote = useCallback(
    (targetId: string) => {
      if (gameState) {
        sendMessage({
          type: "vote",
          gameCode: gameState.game.gameCode,
          targetId,
        });
      }
    },
    [sendMessage, gameState]
  );

  const performNightAction = useCallback(
    (targetId?: string, actionData?: any) => {
      if (gameState) {
        sendMessage({
          type: "night_action",
          gameCode: gameState.game.gameCode,
          targetId,
          actionData,
        });
      }
    },
    [sendMessage, gameState]
  );

  const startVoting = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: "start_voting",
        gameCode: gameState.game.gameCode,
      });
    }
  }, [sendMessage, gameState]);

  const leaveGame = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: "leave_game",
        gameCode: gameState.game.gameCode,
      });
    }

    // Reset local state
    setGameState(null);
    setPlayerId(null);
    setPlayerName("");
    setCurrentScreen("initial");
    setSelectedPlayer(null);
    setShowRoleReveal(false);
    setShowVoteOverlay(false);
    setShowNightActionOverlay(false);
    setShowGameOverOverlay(false);
    setHasPerformedNightAction(false);
  }, [sendMessage, gameState]);

  const hasNightAction = (role: string | null): boolean => {
    return role
      ? ["werewolf", "seer", "doctor", "witch", "bodyguard"].includes(role)
      : false;
  };

  const getCurrentPlayer = (): Player | undefined => {
    if (!gameState || !playerId) return undefined;
    return gameState.players.find((p) => p.playerId === playerId);
  };

  const getPlayerRole = (): string | null => {
    const player = getCurrentPlayer();
    return player?.role || null;
  };

  const isHost = (): boolean => {
    const player = getCurrentPlayer();
    return player?.isHost || false;
  };

  const isAlive = (): boolean => {
    const player = getCurrentPlayer();
    return player?.isAlive || false;
  };

  const canVote = (): boolean => {
    return gameState?.phase === "voting" && isAlive();
  };

  const canChat = (): boolean => {
    // Chat is always enabled for alive players
    // Server will scramble messages for non-werewolves during night
    return isAlive();
  };

  const canStartVoting = (): boolean => {
    return gameState?.phase === "day" && isAlive();
  };

  return {
    gameState,
    playerId,
    playerName,
    currentScreen,
    selectedPlayer,
    showRoleReveal,
    showVoteOverlay,
    showNightActionOverlay,
    showGameOverOverlay,
    hasPerformedNightAction,
    isConnected,

    // Actions
    createGame,
    joinGame,
    startGame,
    sendChatMessage,
    vote,
    performNightAction,
    startVoting,
    leaveGame,

    // UI Actions
    setCurrentScreen,
    setSelectedPlayer,
    setShowRoleReveal,
    setShowVoteOverlay,
    setShowNightActionOverlay,
    setShowGameOverOverlay,
    setHasPerformedNightAction,

    // Computed properties
    getCurrentPlayer,
    getPlayerRole,
    isHost,
    isAlive,
    canVote,
    canChat,
    canStartVoting,
    hasNightAction: () => hasNightAction(getPlayerRole()),
  };
}
