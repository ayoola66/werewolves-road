import { WebSocket } from "ws";
import { storage } from "../storage";
import {
  wsMessageSchema,
  type WSMessage,
  gameSettingsSchema,
  type Game,
  type Player,
  type GameSettings,
} from "../../shared/schema";

type ExtendedWebSocket = WebSocket & {
  playerId?: string;
  gameCode?: string;
  playerName?: string;
};

const gameConnections = new Map<string, Set<ExtendedWebSocket>>();

export function handleWebSocket(ws: WebSocket) {
  const extendedWs = ws as ExtendedWebSocket;
  console.log("WebSocket client connected");

  extendedWs.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;
      const validatedMessage = wsMessageSchema.parse(message);
      await handleWebSocketMessage(extendedWs, validatedMessage);
    } catch (error) {
      console.error("WebSocket message error:", error);
      extendedWs.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  extendedWs.on("close", () => {
    console.log("WebSocket client disconnected:", {
      playerId: extendedWs.playerId,
      playerName: extendedWs.playerName,
      gameCode: extendedWs.gameCode,
    });
    handlePlayerDisconnect(extendedWs);
  });
}

async function handleWebSocketMessage(
  ws: ExtendedWebSocket,
  message: WSMessage
) {
  switch (message.type) {
    case "create_game":
      await handleCreateGame(ws, message);
      break;
    case "join_game":
      await handleJoinGame(ws, message);
      break;
    case "start_game":
      await handleStartGame(ws, message);
      break;
    case "start_voting":
      await handleStartVoting(ws, message);
      break;
    case "chat_message":
      await handleChatMessage(ws, message);
      break;
    case "vote":
      await handleVote(ws, message);
      break;
    case "night_action":
      await handleNightAction(ws, message);
      break;
    case "leave_game":
      await handleLeaveGame(ws, message);
      break;
  }
}

async function handlePlayerDisconnect(ws: ExtendedWebSocket) {
  if (ws.gameCode && ws.playerId) {
    console.log("Handling player disconnect:", {
      playerId: ws.playerId,
      playerName: ws.playerName,
      gameCode: ws.gameCode,
    });
    const connections = gameConnections.get(ws.gameCode);
    if (connections) {
      console.log("Current connections:", {
        gameCode: ws.gameCode,
        totalConnections: connections.size,
      });
    }
    await handleLeaveGame(ws, { type: "leave_game", gameCode: ws.gameCode });
  }
}

async function handleCreateGame(
  ws: ExtendedWebSocket,
  message: { type: "create_game"; playerName: string; settings: any }
) {
  try {
    const playerId = generatePlayerId();
    const gameCode = generateGameCode();
    const validatedSettings = gameSettingsSchema.parse(message.settings);

    const game = await storage.createGame({
      gameCode: gameCode,
      hostId: playerId,
      settings: validatedSettings,
      status: "lobby",
    });

    await storage.createPlayer({
      gameId: game.gameCode,
      playerId,
      name: message.playerName,
      isHost: true,
      team: "village", // Default to village team
    });

    ws.playerId = playerId;
    ws.gameCode = gameCode;
    ws.playerName = message.playerName;

    if (!gameConnections.has(gameCode)) {
      gameConnections.set(gameCode, new Set());
    }
    const connections = gameConnections.get(gameCode)!;
    connections.add(ws);
    console.log("Added connection (create):", {
      gameCode,
      playerId: ws.playerId,
      playerName: ws.playerName,
      totalConnections: connections.size,
    });

    const gameState = await getGameState(gameCode);
    console.log("Initial game state:", gameState);
    ws.send(
      JSON.stringify({
        type: "game_created",
        gameCode,
        playerId,
        gameState,
      })
    );
  } catch (error) {
    console.error("Error creating game:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to create game",
      })
    );
  }
}

async function handleJoinGame(
  ws: ExtendedWebSocket,
  message: { type: "join_game"; gameCode: string; playerName: string }
) {
  try {
    const playerId = generatePlayerId();
    const gameCode = message.gameCode.toUpperCase();
    const game = await storage.getGameByCode(gameCode);

    if (!game || game.status !== "lobby") {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Game not found or already started",
        })
      );
      return;
    }

    await storage.createPlayer({
      gameId: game.gameCode,
      playerId,
      name: message.playerName,
      isHost: false,
      team: "village", // Default to village team
    });

    ws.playerId = playerId;
    ws.gameCode = gameCode;
    ws.playerName = message.playerName;

    if (!gameConnections.has(gameCode)) {
      gameConnections.set(gameCode, new Set());
    }
    const connections = gameConnections.get(gameCode)!;
    connections.add(ws);
    console.log("Added connection (join):", {
      gameCode,
      playerId: ws.playerId,
      playerName: ws.playerName,
      totalConnections: connections.size,
    });

    const gameState = await getGameState(gameCode);
    console.log("Game state on join:", gameState);
    ws.send(
      JSON.stringify({
        type: "game_joined",
        gameCode,
        playerId,
        gameState,
      })
    );

    broadcastToGame(
      gameCode,
      {
        type: "player_joined",
        playerId,
        playerName: message.playerName,
      },
      ws
    );
    broadcastGameState(gameCode, gameState);
  } catch (error) {
    console.error("Error joining game:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to join game",
      })
    );
  }
}

const PHASE_TIMERS = {
  day: 180, // 3 minutes
  night: 120, // 2 minutes
  voting: 120, // 2 minutes
  roleReveal: 15, // 15 seconds
  votingResults: 15, // 15 seconds
};

// Track active phase timers
const activePhaseTimers = new Map<string, NodeJS.Timeout>();

// Event types for game announcements
interface GameEvent {
  type: "death" | "protection" | "elimination" | "investigation" | "game_over";
  message: string;
  playerId?: string;
  playerName?: string;
  role?: string;
}

// ============================================================================
// GAME ENGINE: Action Resolution and Phase Management
// ============================================================================

/**
 * Check win conditions and return winner if game is over
 */
async function checkWinCondition(
  gameCode: string
): Promise<{ gameOver: boolean; winner?: string; message?: string }> {
  const players = await storage.getPlayersByGameId(gameCode);
  const alivePlayers = players.filter((p) => p.isAlive);

  const aliveWerewolves = alivePlayers.filter((p) => p.role === "werewolf");
  const aliveVillagers = alivePlayers.filter((p) => p.team === "village");

  // Werewolves win if they equal or outnumber villagers
  if (
    aliveWerewolves.length >= aliveVillagers.length &&
    aliveWerewolves.length > 0
  ) {
    return {
      gameOver: true,
      winner: "werewolves",
      message: "🐺 The werewolves have overtaken the village! Werewolves win!",
    };
  }

  // Village wins if all werewolves are eliminated
  if (aliveWerewolves.length === 0) {
    return {
      gameOver: true,
      winner: "village",
      message: "🏘️ All werewolves have been eliminated! Village wins!",
    };
  }

  return { gameOver: false };
}

/**
 * Resolve night actions and determine who dies
 */
async function resolveNightActions(gameCode: string): Promise<GameEvent[]> {
  const events: GameEvent[] = [];
  const game = await storage.getGameByCode(gameCode);
  if (!game) return events;

  const players = await storage.getPlayersByGameId(gameCode);
  const nightActions = await storage.getNightActionsByGameId(gameCode);

  // Filter only actions from current phase
  const currentPhaseActions = nightActions.filter(
    (action) => action.phase === game.currentPhase
  );

  // Get werewolf kill votes
  const werewolfVotes = currentPhaseActions.filter(
    (action) => action.actionType === "werewolf"
  );

  let werewolfTarget: string | undefined;
  if (werewolfVotes.length > 0) {
    // Count votes for each target
    const voteCount = new Map<string, number>();
    werewolfVotes.forEach((vote) => {
      if (vote.targetId) {
        voteCount.set(vote.targetId, (voteCount.get(vote.targetId) || 0) + 1);
      }
    });

    // Get target with most votes
    let maxVotes = 0;
    voteCount.forEach((count, targetId) => {
      if (count > maxVotes) {
        maxVotes = count;
        werewolfTarget = targetId;
      }
    });
  }

  // Get doctor heals
  const doctorHeals = currentPhaseActions.filter(
    (action) => action.actionType === "doctor"
  );
  const healedPlayers = new Set(
    doctorHeals.map((action) => action.targetId).filter(Boolean) as string[]
  );

  // Get bodyguard protections
  const bodyguardProtections = currentPhaseActions.filter(
    (action) => action.actionType === "bodyguard"
  );
  const bodyguardMap = new Map<string, string>(); // targetId -> bodyguardId
  bodyguardProtections.forEach((action) => {
    if (action.targetId) {
      bodyguardMap.set(action.targetId, action.playerId);
    }
  });

  // Get players who used shields
  const shieldActions = currentPhaseActions.filter(
    (action) => action.actionType === "shield"
  );
  const shieldedPlayers = new Set(
    shieldActions.map((action) => action.playerId)
  );

  // Apply actions in order: Shield → Doctor → Bodyguard → Werewolf Kill
  if (werewolfTarget) {
    const target = players.find((p) => p.playerId === werewolfTarget);
    if (target) {
      let targetSurvived = false;
      let protectionType: string | undefined;

      // Check shield (highest priority)
      if (shieldedPlayers.has(werewolfTarget)) {
        targetSurvived = true;
        protectionType = "shield";
        // Mark shield as used
        await storage.updatePlayer(gameCode, werewolfTarget, {
          hasShield: false,
        });
      }
      // Check doctor heal
      else if (healedPlayers.has(werewolfTarget)) {
        targetSurvived = true;
        protectionType = "heal";
      }
      // Check bodyguard protection
      else if (bodyguardMap.has(werewolfTarget)) {
        const bodyguardId = bodyguardMap.get(werewolfTarget)!;
        const bodyguard = players.find((p) => p.playerId === bodyguardId);

        // Bodyguard dies protecting the target
        if (bodyguard) {
          await storage.updatePlayer(gameCode, bodyguardId, { isAlive: false });
          events.push({
            type: "death",
            message: `💀 ${bodyguard.name} died protecting someone during the night! They were a Bodyguard.`,
            playerId: bodyguardId,
            playerName: bodyguard.name,
            role: "bodyguard",
          });
        }

        targetSurvived = true;
        protectionType = "bodyguard";
      }

      if (targetSurvived) {
        events.push({
          type: "protection",
          message: `🛡️ Someone was attacked but survived the night!`,
        });
      } else {
        // Target dies
        await storage.updatePlayer(gameCode, werewolfTarget, {
          isAlive: false,
        });
        events.push({
          type: "death",
          message: `💀 ${
            target.name
          } was killed during the night! They were a ${getRoleDisplayName(
            target.role
          )}.`,
          playerId: werewolfTarget,
          playerName: target.name,
          role: target.role || "unknown",
        });
      }
    }
  } else if (nightActions.length > 0) {
    // No one was killed
    events.push({
      type: "protection",
      message: "✨ Everyone survived the night!",
    });
  }

  // Check if bodyguard was killed (special case)
  const killedBodyguards = events.filter(
    (e) => e.type === "death" && e.role === "bodyguard"
  );

  for (const bgEvent of killedBodyguards) {
    if (bgEvent.playerId) {
      // Check if this bodyguard was protecting someone
      const protection = bodyguardProtections.find(
        (action) => action.playerId === bgEvent.playerId
      );

      if (protection && protection.targetId) {
        const protectedPlayer = players.find(
          (p) => p.playerId === protection.targetId
        );

        if (protectedPlayer && protectedPlayer.isAlive) {
          // Check if protected player has shield or was healed
          const wasShielded = shieldedPlayers.has(protection.targetId);
          const wasHealed = healedPlayers.has(protection.targetId);

          if (!wasShielded && !wasHealed) {
            // Protected player also dies
            await storage.updatePlayer(gameCode, protection.targetId, {
              isAlive: false,
            });
            events.push({
              type: "death",
              message: `💀 ${
                protectedPlayer.name
              } also perished with their bodyguard! They were a ${getRoleDisplayName(
                protectedPlayer.role
              )}.`,
              playerId: protection.targetId,
              playerName: protectedPlayer.name,
              role: protectedPlayer.role || "unknown",
            });
          }
        }
      }
    }
  }

  return events;
}

/**
 * Resolve voting and eliminate player with most votes
 */
async function resolveVoting(gameCode: string): Promise<GameEvent[]> {
  const events: GameEvent[] = [];
  const game = await storage.getGameByCode(gameCode);
  if (!game) return events;

  const players = await storage.getPlayersByGameId(gameCode);
  const votes = await storage.getVotesByGameId(gameCode);

  // Filter only votes from current phase
  const currentPhaseVotes = votes.filter(
    (vote) => vote.phase === game.currentPhase
  );

  if (currentPhaseVotes.length === 0) {
    events.push({
      type: "elimination",
      message: "⚖️ No one was voted out today.",
    });
    return events;
  }

  // Count votes for each target (Sheriff counts as 2)
  const voteCount = new Map<string, number>();
  currentPhaseVotes.forEach((vote) => {
    const voter = players.find((p) => p.playerId === vote.voterId);
    const voteWeight = voter?.isSheriff ? 2 : 1;
    voteCount.set(
      vote.targetId,
      (voteCount.get(vote.targetId) || 0) + voteWeight
    );
  });

  // Find player with most votes
  let maxVotes = 0;
  let eliminatedPlayerId: string | undefined;
  let tieCount = 0;

  voteCount.forEach((count, targetId) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedPlayerId = targetId;
      tieCount = 1;
    } else if (count === maxVotes) {
      tieCount++;
    }
  });

  // Handle tie - no elimination
  if (tieCount > 1) {
    events.push({
      type: "elimination",
      message: "⚖️ The vote was tied! No one was eliminated.",
    });
    return events;
  }

  // Eliminate player
  if (eliminatedPlayerId) {
    const eliminated = players.find((p) => p.playerId === eliminatedPlayerId);
    if (eliminated) {
      await storage.updatePlayer(gameCode, eliminatedPlayerId, {
        isAlive: false,
      });
      events.push({
        type: "elimination",
        message: `⚖️ ${
          eliminated.name
        } was voted out by the village! They were a ${getRoleDisplayName(
          eliminated.role
        )}.`,
        playerId: eliminatedPlayerId,
        playerName: eliminated.name,
        role: eliminated.role || "unknown",
      });
    }
  }

  return events;
}

/**
 * Check if all required actions for current phase are complete
 */
async function checkPhaseActionsComplete(gameCode: string): Promise<boolean> {
  const game = await storage.getGameByCode(gameCode);
  if (!game) return false;

  const players = await storage.getPlayersByGameId(gameCode);
  const alivePlayers = players.filter((p) => p.isAlive);

  if (game.currentPhase === "night") {
    const nightActions = await storage.getNightActionsByGameId(gameCode);
    const currentPhaseActions = nightActions.filter(
      (action) => action.phase === game.currentPhase
    );

    // Get players who need to act
    const werewolves = alivePlayers.filter((p) => p.role === "werewolf");
    const seer = alivePlayers.find((p) => p.role === "seer");
    const doctor = alivePlayers.find((p) => p.role === "doctor");
    const bodyguard = alivePlayers.find((p) => p.role === "bodyguard");

    let requiredActions = 0;
    let completedActions = 0;

    // Werewolves need to act (at least half)
    if (werewolves.length > 0) {
      requiredActions++;
      const werewolfActions = currentPhaseActions.filter(
        (action) =>
          action.actionType === "werewolf" &&
          werewolves.some((w) => w.playerId === action.playerId)
      );
      if (werewolfActions.length >= Math.ceil(werewolves.length / 2)) {
        completedActions++;
      }
    }

    // Seer can act (optional)
    if (seer) {
      const seerAction = currentPhaseActions.find(
        (action) => action.playerId === seer.playerId
      );
      // Seer action is optional, so we don't require it
    }

    // Doctor can act (optional)
    if (doctor) {
      const doctorAction = currentPhaseActions.find(
        (action) => action.playerId === doctor.playerId
      );
      // Doctor action is optional
    }

    // Bodyguard can act (optional)
    if (bodyguard) {
      const bodyguardAction = currentPhaseActions.find(
        (action) => action.playerId === bodyguard.playerId
      );
      // Bodyguard action is optional
    }

    // All required actions complete if at least 50% of roles acted
    return completedActions >= requiredActions;
  }

  if (game.currentPhase === "voting") {
    const votes = await storage.getVotesByGameId(gameCode);
    const currentPhaseVotes = votes.filter(
      (vote) => vote.phase === game.currentPhase
    );

    // Voting complete if ALL alive players have voted
    return currentPhaseVotes.length >= alivePlayers.length;
  }

  return false;
}

/**
 * Advance to next phase
 */
async function advancePhase(gameCode: string) {
  const game = await storage.getGameByCode(gameCode);
  if (!game) return;

  console.log(`Advancing phase for game ${gameCode} from ${game.currentPhase}`);

  let events: GameEvent[] = [];
  let nextPhase: string = game.currentPhase;
  let nightCount = game.nightCount || 0;
  let dayCount = game.dayCount || 0;

  switch (game.currentPhase) {
    case "role_reveal":
      nextPhase = "night";
      nightCount = 1;
      break;

    case "night":
      // Resolve night actions
      events = await resolveNightActions(gameCode);
      nextPhase = "day";
      dayCount++;
      break;

    case "day":
      nextPhase = "voting";
      break;

    case "voting":
      // Resolve votes
      events = await resolveVoting(gameCode);

      // Transition to voting results phase to show results
      nextPhase = "voting_results";
      break;

    case "voting_results":
      // Check win condition after showing results
      const winCheck = await checkWinCondition(gameCode);
      if (winCheck.gameOver) {
        await storage.updateGame(game.id, {
          status: "finished",
          currentPhase: "game_over",
        });

        broadcastToGame(gameCode, {
          type: "game_over",
          winner: winCheck.winner,
          message: winCheck.message,
        });
        return;
      }

      // Transition to night
      nextPhase = "night";
      nightCount++;
      break;
  }

  // Update game phase
  const phaseTimer =
    PHASE_TIMERS[nextPhase as keyof typeof PHASE_TIMERS] || 120;
  const phaseEndTime = new Date(Date.now() + phaseTimer * 1000);

  await storage.updateGame(game.id, {
    currentPhase: nextPhase,
    phaseTimer,
    nightCount,
    dayCount,
    lastPhaseChange: new Date(),
    phaseEndTime,
  });

  // Broadcast phase change
  broadcastToGame(gameCode, {
    type: "phase_change",
    phase: nextPhase,
    timer: phaseTimer,
    nightCount,
    dayCount,
    events,
  });

  // Broadcast updated game state
  const gameState = await getGameState(gameCode);
  broadcastGameState(gameCode, gameState);

  // Start next phase timer
  startPhaseTimer(gameCode);
}

/**
 * Start phase timer with early completion checking
 */
function startPhaseTimer(gameCode: string) {
  // Clear existing timer
  const existingTimer = activePhaseTimers.get(gameCode);
  if (existingTimer) {
    clearTimeout(existingTimer);
    clearInterval(existingTimer);
  }

  // Check for early completion every 5 seconds
  const checkInterval = setInterval(async () => {
    const game = await storage.getGameByCode(gameCode);
    if (!game || game.currentPhase === "game_over") {
      clearInterval(checkInterval);
      activePhaseTimers.delete(gameCode);
      return;
    }

    // Check if phase actions are complete (not for voting_results, let it run full timer)
    if (game.currentPhase === "night" || game.currentPhase === "voting") {
      const actionsComplete = await checkPhaseActionsComplete(gameCode);
      if (actionsComplete) {
        console.log(
          `Phase ${game.currentPhase} completed early for game ${gameCode}`
        );
        clearInterval(checkInterval);
        activePhaseTimers.delete(gameCode);
        await advancePhase(gameCode);
      }
    }
  }, 5000);

  // Set main timer
  const game = storage.getGameByCode(gameCode);
  game.then((g) => {
    if (g && g.phaseTimer) {
      const timer = setTimeout(async () => {
        clearInterval(checkInterval);
        activePhaseTimers.delete(gameCode);
        await advancePhase(gameCode);
      }, g.phaseTimer * 1000);

      activePhaseTimers.set(gameCode, timer as any);
    }
  });
}

/**
 * Get display name for role
 */
function getRoleDisplayName(role: string | null): string {
  if (!role) return "Unknown";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

async function handleStartGame(
  ws: ExtendedWebSocket,
  message: { type: "start_game"; gameCode: string }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const players = await storage.getPlayersByGameId(game.gameCode);
    if (game.hostId !== ws.playerId || players.length < 4) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Cannot start game - not host or insufficient players",
        })
      );
      return;
    }

    await storage.updateGame(game.id, {
      status: "role_reveal",
      currentPhase: "role_reveal",
      phaseTimer: PHASE_TIMERS.roleReveal,
    });

    const roles = await assignRoles(game, players);

    // Send role information to each player
    const connections = gameConnections.get(message.gameCode);
    if (connections) {
      for (const playerWs of connections) {
        const playerRole = roles.find((r) => r.playerId === playerWs.playerId);
        if (playerRole) {
          const teamInfo = {
            werewolves:
              playerRole.role === "werewolf" || playerRole.role === "minion"
                ? roles
                    .filter((r) => r.role === "werewolf")
                    .map((r) => r.playerId)
                : undefined,
            minion: playerRole.role === "minion",
          };

          playerWs.send(
            JSON.stringify({
              type: "role_assigned",
              role: playerRole.role,
              teamInfo,
              timer: PHASE_TIMERS.roleReveal,
            })
          );
        }
      }
    }

    // Start role reveal timer
    setTimeout(async () => {
      await advancePhase(message.gameCode);
    }, PHASE_TIMERS.roleReveal * 1000);

    broadcastToGame(message.gameCode, {
      type: "game_started",
    });

    const gameState = await getGameState(message.gameCode);
    broadcastGameState(message.gameCode, gameState);
  } catch (error) {
    console.error("Error starting game:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to start game",
      })
    );
  }
}

async function handleStartVoting(
  ws: ExtendedWebSocket,
  message: { type: "start_voting"; gameCode: string }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    // Check if game is in day phase
    if (game.currentPhase !== "day") {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Voting can only be started during the day phase",
        })
      );
      return;
    }

    // Check if player is alive
    const players = await storage.getPlayersByGameId(game.gameCode);
    const currentPlayer = players.find((p) => p.playerId === ws.playerId);
    if (!currentPlayer || !currentPlayer.isAlive) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Only alive players can start voting",
        })
      );
      return;
    }

    // Transition to voting phase
    await storage.updateGame(game.id, {
      currentPhase: "voting",
      phaseTimer: PHASE_TIMERS.voting,
      phaseEndTime: new Date(Date.now() + PHASE_TIMERS.voting * 1000),
    });

    // Broadcast phase change
    broadcastToGame(message.gameCode, {
      type: "phase_change",
      phase: "voting",
      timer: PHASE_TIMERS.voting,
      events: [
        {
          type: "phase_change",
          message: "Voting phase has begun! Cast your votes.",
        },
      ],
    });

    // Start voting timer
    setTimeout(async () => {
      await advancePhase(message.gameCode);
    }, PHASE_TIMERS.voting * 1000);

    const gameState = await getGameState(message.gameCode);
    broadcastGameState(message.gameCode, gameState);
  } catch (error) {
    console.error("Error starting voting:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to start voting",
      })
    );
  }
}

async function handleChatMessage(
  ws: ExtendedWebSocket,
  message: {
    type: "chat_message";
    gameCode: string;
    message: string;
    channel?: string;
  }
) {
  try {
    if (!ws.playerId || !ws.playerName) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const player = await storage.getPlayer(game.gameCode, ws.playerId);
    if (!player || !player.isAlive) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Dead players cannot speak",
        })
      );
      return;
    }

    // Determine if message should be scrambled
    const isNightPhase = game.currentPhase === "night";
    const isWerewolf = player.role === "werewolf" || player.role === "minion";
    const isWerewolfChat = message.channel === "werewolf";

    // Scramble message if:
    // 1. It's night phase AND
    // 2. Player is not a werewolf AND
    // 3. It's not werewolf-only chat
    const shouldScramble = isNightPhase && !isWerewolf && !isWerewolfChat;

    // Scramble the message if needed
    const scrambledMessage = shouldScramble
      ? message.message
          .split("")
          .map((char) => {
            if (char === " ") return " ";
            return Math.random() > 0.3 ? "█" : char;
          })
          .join("")
      : message.message;

    const chatMessage = await storage.createChatMessage({
      gameId: game.gameCode,
      playerId: ws.playerId,
      playerName: ws.playerName,
      message: scrambledMessage,
      type: message.channel || "player",
    });

    // Broadcast to appropriate players
    if (message.channel === "werewolf") {
      // Only send to werewolves and minions
      const connections = gameConnections.get(message.gameCode);
      if (connections) {
        for (const playerWs of connections) {
          const recipientPlayer = await storage.getPlayer(
            game.gameCode,
            playerWs.playerId || ""
          );
          if (
            recipientPlayer &&
            (recipientPlayer.role === "werewolf" ||
              recipientPlayer.role === "minion")
          ) {
            playerWs.send(
              JSON.stringify({
                type: "chat_message",
                message: chatMessage,
              })
            );
          }
        }
      }
    } else {
      // Broadcast to all players
      broadcastToGame(message.gameCode, {
        type: "chat_message",
        message: chatMessage,
      });
    }
  } catch (error) {
    console.error("Error handling chat message:", error);
  }
}

async function handleVote(
  ws: ExtendedWebSocket,
  message: { type: "vote"; gameCode: string; targetId: string }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const player = await storage.getPlayer(game.gameCode, ws.playerId);
    const target = await storage.getPlayer(game.gameCode, message.targetId);

    if (!player || !player.isAlive || !target || !target.isAlive) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid vote",
        })
      );
      return;
    }

    await storage.createVote({
      gameId: game.gameCode,
      voterId: ws.playerId,
      targetId: message.targetId,
      phase: game.currentPhase,
    });

    ws.send(
      JSON.stringify({
        type: "vote_recorded",
        targetId: message.targetId,
      })
    );

    const gameState = await getGameState(message.gameCode);
    broadcastGameState(message.gameCode, gameState);
  } catch (error) {
    console.error("Error handling vote:", error);
  }
}

async function handleNightAction(
  ws: ExtendedWebSocket,
  message: {
    type: "night_action";
    gameCode: string;
    targetId?: string;
    actionData?: any;
  }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const player = await storage.getPlayer(game.gameCode, ws.playerId);
    if (!player || !player.isAlive) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid night action",
        })
      );
      return;
    }

    await storage.createNightAction({
      gameId: game.gameCode,
      playerId: ws.playerId,
      targetId: message.targetId,
      actionType: player.role || "unknown",
      data: message.actionData,
      phase: game.currentPhase,
    });

    ws.send(
      JSON.stringify({
        type: "night_action_recorded",
        targetId: message.targetId,
      })
    );

    const gameState = await getGameState(message.gameCode);
    broadcastGameState(message.gameCode, gameState);
  } catch (error) {
    console.error("Error handling night action:", error);
  }
}

async function handleLeaveGame(
  ws: ExtendedWebSocket,
  message: { type: "leave_game"; gameCode: string }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    await storage.updatePlayer(game.gameCode, ws.playerId, { isAlive: false });

    const connections = gameConnections.get(message.gameCode);
    if (connections) {
      connections.delete(ws);
    }

    ws.send(
      JSON.stringify({
        type: "left_game",
      })
    );

    broadcastToGame(message.gameCode, {
      type: "player_left",
      playerId: ws.playerId,
      playerName: ws.playerName,
    });

    const gameState = await getGameState(message.gameCode);
    broadcastGameState(message.gameCode, gameState);
  } catch (error) {
    console.error("Error leaving game:", error);
  }
}

function broadcastToGame(
  gameCode: string,
  message: any,
  exclude?: ExtendedWebSocket
) {
  const connections = gameConnections.get(gameCode);
  if (!connections) {
    console.log("No connections found for game:", gameCode);
    return;
  }

  console.log("Broadcasting to game:", {
    gameCode,
    message,
    connections: connections.size,
  });
  const messageStr = JSON.stringify(message);
  connections.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      console.log("Sending message to client:", {
        playerId: ws.playerId,
        playerName: ws.playerName,
      });
      ws.send(messageStr);
    }
  });
}

async function broadcastGameState(gameCode: string, gameState: any) {
  console.log("Broadcasting game state:", { gameCode, gameState });
  const chatMessages = await storage.getChatMessagesByGame(
    gameState.game.gameCode
  );
  const updatedGameState = {
    ...gameState,
    chatMessages,
  };
  console.log("Updated game state:", updatedGameState);
  broadcastToGame(gameCode, {
    type: "game_state_update",
    gameState: updatedGameState,
  });
}

async function getGameState(gameCode: string) {
  console.log("Getting game state for:", gameCode);
  const game = await storage.getGameByCode(gameCode);
  if (!game) {
    console.log("No game found for code:", gameCode);
    return null;
  }

  console.log("Found game:", game);
  const players = await storage.getPlayersByGameId(game.gameCode);
  console.log("Found players:", players);
  const votes = await storage.getVotesByGameId(game.gameCode);
  const nightActions = await storage.getNightActionsByGameId(game.gameCode);

  // Compute alive and dead players
  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);

  // Count werewolves and villagers
  const werewolfCount = alivePlayers.filter(
    (p) => p.role === "werewolf"
  ).length;
  const villagerCount = alivePlayers.filter((p) => p.team === "village").length;

  const gameState = {
    game: {
      ...game,
      phase: game.currentPhase, // Add phase alias for backwards compatibility
    },
    players,
    alivePlayers,
    deadPlayers,
    votes,
    nightActions,
    phase: game.currentPhase,
    phaseTimer: game.phaseTimer,
    nightCount: game.nightCount || 0,
    dayCount: game.dayCount || 0,
    werewolfCount,
    villagerCount,
  };
  console.log("Returning game state:", gameState);
  return gameState;
}

async function assignRoles(game: Game, players: Player[]) {
  const settings = game.settings as GameSettings;
  const roles: { playerId: string; role: string; team: string }[] = [];
  const playerIds = [...players.map((p) => p.playerId)];

  // Assign werewolves
  for (let i = 0; i < settings.werewolves; i++) {
    const idx = Math.floor(Math.random() * playerIds.length);
    const playerId = playerIds.splice(idx, 1)[0];
    roles.push({ playerId, role: "werewolf", team: "werewolf" });
  }

  // Assign special roles
  if (settings.seer && playerIds.length > 0) {
    const idx = Math.floor(Math.random() * playerIds.length);
    const playerId = playerIds.splice(idx, 1)[0];
    roles.push({ playerId, role: "seer", team: "village" });
  }

  if (settings.doctor && playerIds.length > 0) {
    const idx = Math.floor(Math.random() * playerIds.length);
    const playerId = playerIds.splice(idx, 1)[0];
    roles.push({ playerId, role: "doctor", team: "village" });
  }

  if (settings.minion && playerIds.length > 0) {
    const idx = Math.floor(Math.random() * playerIds.length);
    const playerId = playerIds.splice(idx, 1)[0];
    roles.push({ playerId, role: "minion", team: "werewolf" });
  }

  // Assign remaining players as villagers
  playerIds.forEach((playerId) => {
    roles.push({ playerId, role: "villager", team: "village" });
  });

  // Update database with roles - AWAIT ALL updates before returning
  await Promise.all(
    roles.map(({ playerId, role, team }) =>
      storage.updatePlayer(game.gameCode, playerId, {
        role,
        team,
        hasShield: settings.shield,
      })
    )
  );

  return roles;
}

function generateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePlayerId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const gameLogic = {
  handleWebSocket,
  getGameState,
};
