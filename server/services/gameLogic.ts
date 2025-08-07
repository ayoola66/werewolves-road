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
    console.log("WebSocket client disconnected");
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
    });

    ws.playerId = playerId;
    ws.gameCode = gameCode;
    ws.playerName = message.playerName;

    if (!gameConnections.has(gameCode)) {
      gameConnections.set(gameCode, new Set());
    }
    gameConnections.get(gameCode)!.add(ws);

    const gameState = await getGameState(gameCode);
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
    });

    ws.playerId = playerId;
    ws.gameCode = gameCode;
    ws.playerName = message.playerName;

    if (!gameConnections.has(gameCode)) {
      gameConnections.set(gameCode, new Set());
    }
    gameConnections.get(gameCode)!.add(ws);

    const gameState = await getGameState(gameCode);
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
  night: 60, // 1 minute
  roleReveal: 15 // 15 seconds
};

async function handleStartGame(
  ws: ExtendedWebSocket,
  message: { type: "start_game"; gameCode: string }
) {
  try {
    if (!ws.playerId) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const players = await storage.getPlayersByGameId(game.id);
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
      phaseTimer: PHASE_TIMERS.roleReveal
    });
    
    const roles = assignRoles(game, players);
    
    // Send role information to each player
    const connections = gameConnections.get(message.gameCode);
    if (connections) {
      for (const playerWs of connections) {
        const playerRole = roles.find(r => r.playerId === playerWs.playerId);
        if (playerRole) {
          const teamInfo = {
            werewolves: playerRole.role === 'werewolf' || playerRole.role === 'minion' 
              ? roles.filter(r => r.role === 'werewolf').map(r => r.playerId)
              : undefined,
            minion: playerRole.role === 'minion'
          };
          
          playerWs.send(JSON.stringify({
            type: "role_assigned",
            role: playerRole.role,
            teamInfo,
            timer: PHASE_TIMERS.roleReveal
          }));
        }
      }
    }
    
    // Start role reveal timer
    setTimeout(async () => {
      await storage.updateGame(game.id, { 
        status: "night",
        currentPhase: "night",
        phaseTimer: PHASE_TIMERS.night
      });
      
      broadcastToGame(message.gameCode, {
        type: "phase_change",
        phase: "night",
        timer: PHASE_TIMERS.night,
        events: []
      });
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

async function handleChatMessage(
  ws: ExtendedWebSocket,
  message: { type: "chat_message"; gameCode: string; message: string }
) {
  try {
    if (!ws.playerId || !ws.playerName) return;

    const game = await storage.getGameByCode(message.gameCode);
    if (!game) return;

    const player = await storage.getPlayer(game.id, ws.playerId);
    if (!player || !player.isAlive) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Dead players cannot speak",
        })
      );
      return;
    }

    if (game.status === "night") {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "You cannot speak during the night",
        })
      );
      return;
    }

    const chatMessage = await storage.createChatMessage({
      gameId: game.gameCode,
      playerId: ws.playerId,
      playerName: ws.playerName,
      message: message.message,
      type: "player",
    });

    broadcastToGame(message.gameCode, {
      type: "chat_message",
      message: chatMessage,
    });
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

    const player = await storage.getPlayer(game.id, ws.playerId);
    const target = await storage.getPlayer(game.id, message.targetId);

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

    const player = await storage.getPlayer(game.id, ws.playerId);
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

    await storage.updatePlayer(game.id, ws.playerId, { isAlive: false });

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
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  connections.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

async function broadcastGameState(gameCode: string, gameState: any) {
  const chatMessages = await storage.getChatMessagesByGame(gameState.game.id);
  broadcastToGame(gameCode, {
    type: "game_state_update",
    gameState: {
      ...gameState,
      chatMessages,
    },
  });
}

async function getGameState(gameCode: string) {
  const game = await storage.getGameByCode(gameCode);
  if (!game) return null;

  const players = await storage.getPlayersByGameId(game.id);
  const votes = await storage.getVotesByGameId(game.id);
  const nightActions = await storage.getNightActionsByGameId(game.id);

  return {
    game,
    players,
    votes,
    nightActions,
  };
}

function assignRoles(game: Game, players: Player[]) {
  const settings = game.settings as GameSettings;
  const roles: { playerId: string; role: string; team: string }[] = [];
  const playerIds = [...players.map(p => p.playerId)];
  
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
  playerIds.forEach(playerId => {
    roles.push({ playerId, role: "villager", team: "village" });
  });
  
  // Update database with roles
  roles.forEach(async ({ playerId, role, team }) => {
    await storage.updatePlayer(game.id, playerId, {
      role,
      team,
      hasShield: settings.shield,
    });
  });
  
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
