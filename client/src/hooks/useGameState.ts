import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, GameSettings, Player } from "@/lib/gameTypes";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase";
import { useErrorLog } from "./useErrorLog";

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

  const { toast } = useToast();
  const { logError } = useErrorLog();

  // Debounce fetchGameState calls to prevent race conditions
  const lastFetchRef = useRef<number>(0);
  const DEBOUNCE_MS = 500;

  const debouncedFetchGameState = useCallback(async (gameCode: string) => {
    const now = Date.now();
    if (now - lastFetchRef.current < DEBOUNCE_MS) {
      return; // Skip if called too recently
    }
    lastFetchRef.current = now;
    await fetchGameState(gameCode);
  }, []);

  useEffect(() => {
    if (!gameState?.game?.gameCode) return;

    const channel = supabase
      .channel(`game:${gameState.game.gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `game_code=eq.${gameState.game.gameCode}`,
        },
        async () => {
          await debouncedFetchGameState(gameState.game.gameCode);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameState.game.id}`,
        },
        async () => {
          await debouncedFetchGameState(gameState.game.gameCode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameState?.game?.gameCode, debouncedFetchGameState]);

  const fetchGameState = async (gameCode: string) => {
    try {
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", gameCode)
        .single();

      if (!game) {
        console.error("Game not found:", gameCode);
        return;
      }

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", game.id);

      if (game && players && Array.isArray(players)) {
        const alivePlayers = players.filter((p) => p.is_alive);
        const deadPlayers = players.filter((p) => !p.is_alive);

        setGameState({
          game: {
            id: game.id,
            gameCode: game.game_code,
            hostId: game.host_id,
            status: game.status,
            currentPhase: game.current_phase || game.phase || "lobby",
            phaseTimer: game.phase_timer || 0,
            nightCount: game.night_count,
            dayCount: game.day_count,
            lastPhaseChange: game.last_phase_change,
            phaseEndTime: game.phase_end_time,
            createdAt: game.created_at,
            settings: game.settings,
          },
          players: players.map((p) => ({
            id: p.id,
            gameId: p.game_id,
            playerId: p.player_id,
            name: p.name || p.player_name,
            role: p.role,
            isAlive: p.is_alive,
            isHost: p.player_id === game.host_id,
            isSheriff: p.is_sheriff,
            joinedAt: p.joined_at,
            hasShield: p.has_shield,
            actionUsed: p.action_used,
          })),
          alivePlayers: alivePlayers.map((p) => ({
            id: p.id,
            gameId: p.game_id,
            playerId: p.player_id,
            name: p.name || p.player_name,
            role: p.role,
            isAlive: true,
            isHost: p.player_id === game.host_id,
            isSheriff: p.is_sheriff,
            joinedAt: p.joined_at,
            hasShield: p.has_shield,
            actionUsed: p.action_used,
          })),
          deadPlayers: deadPlayers.map((p) => ({
            id: p.id,
            gameId: p.game_id,
            playerId: p.player_id,
            name: p.name || p.player_name,
            role: p.role,
            isAlive: false,
            isHost: p.player_id === game.host_id,
            isSheriff: p.is_sheriff,
            joinedAt: p.joined_at,
            hasShield: p.has_shield,
            actionUsed: p.action_used,
          })),
          votes: {},
          nightActions: {},
          chatMessages: [],
          phase: game.current_phase || game.phase || "lobby",
          phaseTimer: 0,
          werewolfCount: Array.isArray(alivePlayers)
            ? alivePlayers.filter((p) => p.role === "werewolf").length
            : 0,
          villagerCount: Array.isArray(alivePlayers)
            ? alivePlayers.filter((p) => p.role !== "werewolf").length
            : 0,
          seerInvestigationsLeft: {},
        });

        if ((game.current_phase || game.phase) === "game_over") {
          setShowGameOverOverlay(true);
        }
      }
    } catch (error: any) {
      logError(error.message || "Failed to fetch game state", {
        details: error.stack || JSON.stringify(error),
        source: "network",
        functionName: "fetchGameState",
        stack: error.stack,
        gameCode: gameCode,
        playerId: playerId || undefined,
      });
      console.error("Error fetching game state:", error);
    }
  };

  // Phase timer checking - automatically transition phases when timer expires
  useEffect(() => {
    if (!gameState?.game?.gameCode || currentScreen !== "game") return;

    const currentPhase =
      gameState.game?.currentPhase || gameState.game?.phase || gameState.phase;
    const phaseEndTime = gameState.game?.phaseEndTime;

    // Only check for night and voting phases (these need automatic processing)
    if (
      currentPhase !== "night" &&
      currentPhase !== "voting" &&
      currentPhase !== "role_reveal"
    ) {
      return;
    }

    // If no phase_end_time, don't check
    if (!phaseEndTime) {
      return;
    }

    const checkPhaseTimer = async () => {
      const now = Date.now();
      const endTime = new Date(phaseEndTime).getTime();

      // If timer has expired, call appropriate process function
      if (now >= endTime) {
        try {
          if (currentPhase === "night") {
            // Process night actions
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-night`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                  }`,
                },
                body: JSON.stringify({
                  gameCode: gameState.game.gameCode,
                }),
              }
            );

            const data = await response.json();
            if (data.error) {
              console.error("Error processing night:", data.error);
              logError(data.error, {
                source: "edge-function",
                functionName: "process-night",
                gameCode: gameState.game.gameCode,
              });
            } else {
              // Refresh game state after processing
              await fetchGameState(gameState.game.gameCode);
            }
          } else if (currentPhase === "voting") {
            // Process votes
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-votes`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                  }`,
                },
                body: JSON.stringify({
                  gameCode: gameState.game.gameCode,
                }),
              }
            );

            const data = await response.json();
            if (data.error) {
              console.error("Error processing votes:", data.error);
              logError(data.error, {
                source: "edge-function",
                functionName: "process-votes",
                gameCode: gameState.game.gameCode,
              });
            } else {
              // Refresh game state after processing
              await fetchGameState(gameState.game.gameCode);
            }
          } else if (currentPhase === "role_reveal") {
            // Transition from role_reveal to night phase
            // Call process-night to transition (it will handle role_reveal → night)
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-night`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                  }`,
                },
                body: JSON.stringify({
                  gameCode: gameState.game.gameCode,
                }),
              }
            );

            const data = await response.json();
            if (data.error) {
              console.error(
                "Error transitioning from role_reveal:",
                data.error
              );
              logError(data.error, {
                source: "edge-function",
                functionName: "process-night",
                gameCode: gameState.game.gameCode,
              });
            } else {
              // Refresh game state after processing
              await fetchGameState(gameState.game.gameCode);
            }
          }
        } catch (error: any) {
          console.error("Error in phase timer check:", error);
          logError(error.message || "Failed to process phase transition", {
            details: error.stack || JSON.stringify(error),
            source: "client",
            functionName: "phase-timer-check",
            gameCode: gameState.game.gameCode,
          });
        }
      }
    };

    // Check immediately
    checkPhaseTimer();

    // Check every 5 seconds
    const interval = setInterval(checkPhaseTimer, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    gameState?.game?.gameCode,
    gameState?.game?.currentPhase,
    gameState?.game?.phaseEndTime,
    currentScreen,
    logError,
  ]);

  const createGame = useCallback(
    async (name: string, settings: GameSettings) => {
      try {
        setPlayerName(name);
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-game`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ playerName: name, settings }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setPlayerId(data.playerId);
        setCurrentScreen("lobby");
        await fetchGameState(data.gameCode);

        toast({
          title: "Game Created",
          description: `Game code: ${data.gameCode}`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const joinGame = useCallback(
    async (gameCode: string, name: string) => {
      try {
        setPlayerName(name);
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-game`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameCode.toUpperCase(),
              playerName: name,
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setPlayerId(data.playerId);
        setCurrentScreen("lobby");
        await fetchGameState(gameCode.toUpperCase());

        toast({
          title: "Joined Game",
          description: "Welcome to the game!",
        });
      } catch (error: any) {
        logError(error.message || "Failed to join game", {
          details: error.stack || JSON.stringify(error),
          source: "edge-function",
          functionName: "join-game",
          stack: error.stack,
          gameCode: gameCode,
          playerId: playerId || undefined,
        });
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [toast, logError]
  );

  const startGame = useCallback(async () => {
    if (!gameState || !playerId) {
      console.error("Cannot start game: missing gameState or playerId", {
        gameState: !!gameState,
        playerId,
      });
      return;
    }

    try {
      // Get current player for logging (don't include in dependency array to avoid circular dependency)
      const currentPlayer = Array.isArray(gameState?.players)
        ? gameState.players.find((p) => p.playerId === playerId)
        : null;
      console.log("Starting game with:", {
        gameCode: gameState.game.gameCode,
        playerId,
        currentPlayer: currentPlayer
          ? { name: currentPlayer.name, isHost: currentPlayer.isHost }
          : null,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            gameCode: gameState.game.gameCode,
            playerId: playerId,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Refresh game state after starting
      await fetchGameState(gameState.game.gameCode);

      setCurrentScreen("game");
      setShowRoleReveal(true);

      toast({
        title: "Game Started",
        description: "The game has begun!",
      });
    } catch (error: any) {
      logError(error.message || "Failed to start game", {
        details: error.stack || JSON.stringify(error),
        source: "edge-function",
        functionName: "start-game",
        stack: error.stack,
        gameCode: gameState?.game?.gameCode,
        playerId: playerId || undefined,
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [gameState, playerId, toast, fetchGameState, logError]);

  const sendChatMessage = useCallback(
    async (message: string, channel?: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              message,
              channel: channel || "all",
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);
      } catch (error: any) {
        logError(error.message || "Failed to send chat message", {
          details: error.stack || JSON.stringify(error),
          source: "edge-function",
          functionName: "send-chat",
          stack: error.stack,
          gameCode: gameState?.game?.gameCode,
          playerId: playerId || undefined,
        });
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast, logError]
  );

  const vote = useCallback(
    async (targetId: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              targetId,
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setShowVoteOverlay(false);
        setSelectedPlayer(null);

        toast({
          title: "Vote Recorded",
          description: "Your vote has been recorded",
        });
      } catch (error: any) {
        logError(error.message || "Failed to submit vote", {
          details: error.stack || JSON.stringify(error),
          source: "edge-function",
          functionName: "submit-vote",
          stack: error.stack,
          gameCode: gameState?.game?.gameCode,
          playerId: playerId || undefined,
        });
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast, logError]
  );

  const performNightAction = useCallback(
    async (targetId: string, action: string) => {
      if (!gameState || !playerId) return;

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_SUPABASE_URL
          }/functions/v1/submit-night-action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              gameCode: gameState.game.gameCode,
              playerId,
              targetId,
              action,
            }),
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setShowNightActionOverlay(false);
        setSelectedPlayer(null);
        setHasPerformedNightAction(true);

        toast({
          title: "Action Recorded",
          description: "Your night action has been recorded",
        });
      } catch (error: any) {
        logError(error.message || "Failed to perform night action", {
          details: error.stack || JSON.stringify(error),
          source: "edge-function",
          functionName: "submit-night-action",
          stack: error.stack,
          gameCode: gameState?.game?.gameCode,
          playerId: playerId || undefined,
        });
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [gameState, playerId, toast, logError]
  );

  const hasNightAction = (role: string) => {
    return ["werewolf", "seer", "doctor"].includes(role);
  };

  const getPlayerRole = () => {
    if (!gameState || !playerId || !Array.isArray(gameState.players))
      return null;
    const player = gameState.players.find((p) => p.playerId === playerId);
    return player?.role || null;
  };

  const getCurrentPlayer = (): Player | null => {
    if (!gameState || !playerId || !Array.isArray(gameState.players))
      return null;
    const player = gameState.players.find((p) => p.playerId === playerId);
    return player || null;
  };

  const isHost = (): boolean => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.isHost || false;
  };

  const leaveGame = useCallback(async () => {
    if (!gameState || !playerId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leave-game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            gameCode: gameState.game.gameCode,
            playerId,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Clean up state
      setGameState(null);
      setPlayerId(null);
      setCurrentScreen("initial");
      setShowRoleReveal(false);
      setShowVoteOverlay(false);
      setShowNightActionOverlay(false);
      setShowGameOverOverlay(false);
      setHasPerformedNightAction(false);

      toast({
        title: "Left Game",
        description: "You have left the game",
      });
    } catch (error: any) {
      logError(error.message || "Failed to leave game", {
        details: error.stack || JSON.stringify(error),
        source: "edge-function",
        functionName: "leave-game",
        stack: error.stack,
        gameCode: gameState?.game?.gameCode,
        playerId: playerId || undefined,
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [gameState, playerId, toast, logError]);

  const startVoting = useCallback(async () => {
    if (!gameState || !playerId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-voting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            gameCode: gameState.game.gameCode,
            playerId,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast({
        title: "Voting Started",
        description: "The voting phase has begun!",
      });
    } catch (error: any) {
      logError(error.message || "Failed to start voting", {
        details: error.stack || JSON.stringify(error),
        source: "edge-function",
        functionName: "start-voting",
        stack: error.stack,
        gameCode: gameState?.game?.gameCode,
        playerId: playerId || undefined,
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [gameState, playerId, toast, logError]);

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
    isConnected: true,
    createGame,
    joinGame,
    startGame,
    sendChatMessage,
    vote,
    performNightAction,
    setSelectedPlayer,
    setShowRoleReveal,
    setShowVoteOverlay,
    setShowNightActionOverlay,
    setShowGameOverOverlay,
    setCurrentScreen,
    setPlayerName,
    getPlayerRole,
    getCurrentPlayer,
    isHost,
    leaveGame,
    startVoting,
  };
}
