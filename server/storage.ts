import { games, players, gameActions, chatMessages, type Game, type Player, type GameAction, type ChatMessage, type InsertGame, type InsertPlayer, type InsertGameAction, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGameByCode(gameCode: string): Promise<Game | undefined>;
  updateGame(gameCode: string, updates: Partial<Game>): Promise<Game | undefined>;
  deleteGame(gameCode: string): Promise<boolean>;

  // Players
  addPlayerToGame(player: InsertPlayer): Promise<Player>;
  getPlayersByGameId(gameId: number): Promise<Player[]>;
  getPlayerByGameAndPlayerId(gameId: number, playerId: string): Promise<Player | undefined>;
  updatePlayer(gameId: number, playerId: string, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayerFromGame(gameId: number, playerId: string): Promise<boolean>;

  // Game Actions
  addGameAction(action: InsertGameAction): Promise<GameAction>;
  getGameActionsByGame(gameId: number, phase?: string): Promise<GameAction[]>;
  getPlayerVote(gameId: number, playerId: string, phase: string): Promise<GameAction | undefined>;

  // Chat Messages
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByGame(gameId: number, limit?: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private players: Map<string, Player>; // key: `${gameId}-${playerId}`
  private gameActions: Map<number, GameAction[]>;
  private chatMessages: Map<number, ChatMessage[]>;
  private currentGameId: number;
  private currentPlayerId: number;
  private currentActionId: number;
  private currentChatId: number;

  constructor() {
    this.games = new Map();
    this.players = new Map();
    this.gameActions = new Map();
    this.chatMessages = new Map();
    this.currentGameId = 1;
    this.currentPlayerId = 1;
    this.currentActionId = 1;
    this.currentChatId = 1;
  }

  // Games
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      id,
      gameCode: insertGame.gameCode,
      hostId: insertGame.hostId,
      status: insertGame.status || 'waiting',
      settings: insertGame.settings,
      currentPhase: insertGame.currentPhase || 'waiting',
      phaseTimer: insertGame.phaseTimer || 0,
      createdAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  async getGameByCode(gameCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.gameCode === gameCode);
  }

  async updateGame(gameCode: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = await this.getGameByCode(gameCode);
    if (!game) return undefined;

    const updatedGame = { ...game, ...updates };
    this.games.set(game.id, updatedGame);
    return updatedGame;
  }

  async deleteGame(gameCode: string): Promise<boolean> {
    const game = await this.getGameByCode(gameCode);
    if (!game) return false;

    this.games.delete(game.id);
    // Clean up related data
    this.gameActions.delete(game.id);
    this.chatMessages.delete(game.id);
    
    // Remove players
    Array.from(this.players.keys()).forEach(key => {
      if (key.startsWith(`${game.id}-`)) {
        this.players.delete(key);
      }
    });

    return true;
  }

  // Players
  async addPlayerToGame(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = {
      id,
      gameId: insertPlayer.gameId,
      playerId: insertPlayer.playerId,
      name: insertPlayer.name,
      role: insertPlayer.role || null,
      isAlive: insertPlayer.isAlive !== undefined ? insertPlayer.isAlive : true,
      isHost: insertPlayer.isHost !== undefined ? insertPlayer.isHost : false,
      isSheriff: insertPlayer.isSheriff !== undefined ? insertPlayer.isSheriff : false,
      joinedAt: new Date(),
    };
    
    const key = `${insertPlayer.gameId}-${insertPlayer.playerId}`;
    this.players.set(key, player);
    return player;
  }

  async getPlayersByGameId(gameId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.gameId === gameId);
  }

  async getPlayerByGameAndPlayerId(gameId: number, playerId: string): Promise<Player | undefined> {
    const key = `${gameId}-${playerId}`;
    return this.players.get(key);
  }

  async updatePlayer(gameId: number, playerId: string, updates: Partial<Player>): Promise<Player | undefined> {
    const key = `${gameId}-${playerId}`;
    const player = this.players.get(key);
    if (!player) return undefined;

    const updatedPlayer = { ...player, ...updates };
    this.players.set(key, updatedPlayer);
    return updatedPlayer;
  }

  async removePlayerFromGame(gameId: number, playerId: string): Promise<boolean> {
    const key = `${gameId}-${playerId}`;
    return this.players.delete(key);
  }

  // Game Actions
  async addGameAction(insertAction: InsertGameAction): Promise<GameAction> {
    const id = this.currentActionId++;
    const action: GameAction = {
      id,
      gameId: insertAction.gameId,
      playerId: insertAction.playerId,
      actionType: insertAction.actionType,
      targetId: insertAction.targetId || null,
      data: insertAction.data || null,
      phase: insertAction.phase,
      createdAt: new Date(),
    };

    if (!this.gameActions.has(insertAction.gameId)) {
      this.gameActions.set(insertAction.gameId, []);
    }
    this.gameActions.get(insertAction.gameId)!.push(action);
    return action;
  }

  async getGameActionsByGame(gameId: number, phase?: string): Promise<GameAction[]> {
    const actions = this.gameActions.get(gameId) || [];
    if (phase) {
      return actions.filter(action => action.phase === phase);
    }
    return actions;
  }

  async getPlayerVote(gameId: number, playerId: string, phase: string): Promise<GameAction | undefined> {
    const actions = this.gameActions.get(gameId) || [];
    return actions.find(action => 
      action.playerId === playerId && 
      action.actionType === 'vote' && 
      action.phase === phase
    );
  }

  // Chat Messages
  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      id,
      gameId: insertMessage.gameId,
      playerId: insertMessage.playerId || null,
      playerName: insertMessage.playerName,
      message: insertMessage.message,
      type: insertMessage.type || 'player',
      createdAt: new Date(),
    };

    if (!this.chatMessages.has(insertMessage.gameId)) {
      this.chatMessages.set(insertMessage.gameId, []);
    }
    this.chatMessages.get(insertMessage.gameId)!.push(message);
    return message;
  }

  async getChatMessagesByGame(gameId: number, limit = 50): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(gameId) || [];
    return messages.slice(-limit);
  }
}

export const storage = new MemStorage();
