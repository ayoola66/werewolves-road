import {
  games,
  players,
  chatMessages,
  votes,
  nightActions,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export interface DatabaseStorage {
  createGame: (data: any) => Promise<any>;
  getGameByCode: (code: string) => Promise<any>;
  updateGame: (id: number, data: any) => Promise<any>;
  getPlayersByGameId: (gameId: string) => Promise<any[]>;
  createPlayer: (data: any) => Promise<any>;
  updatePlayer: (gameId: string, playerId: string, data: any) => Promise<any>;
  getPlayer: (gameId: string, playerId: string) => Promise<any>;
  createChatMessage: (data: any) => Promise<any>;
  getChatMessagesByGame: (gameId: string) => Promise<any[]>;
  createVote: (data: any) => Promise<any>;
  getVotesByGameId: (gameId: string) => Promise<any[]>;
  createNightAction: (data: any) => Promise<any>;
  getNightActionsByGameId: (gameId: string) => Promise<any[]>;
}

export const storage: DatabaseStorage = {
  createGame: async (data) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("createGame data", data);
    }
    const [game] = await db.insert(games).values(data).returning();
    if (process.env.NODE_ENV !== "production") {
      console.log("inserted game", game);
    }
    return game;
  },

  getGameByCode: async (code) => {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.gameCode, code));
    return game;
  },

  updateGame: async (id, data) => {
    const [game] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return game;
  },

  getPlayersByGameId: async (gameId) => {
    return db.select().from(players).where(eq(players.gameId, gameId));
  },

  createPlayer: async (data) => {
    const [player] = await db.insert(players).values(data).returning();
    return player;
  },

  updatePlayer: async (gameId, playerId, data) => {
    // Get current player data
    const [currentPlayer] = await db
      .select()
      .from(players)
      .where(and(eq(players.gameId, gameId), eq(players.playerId, playerId)));

    if (!currentPlayer) {
      throw new Error('Player not found');
    }

    // Update only changed fields
    const updateData = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isAlive !== undefined) updateData.isAlive = data.isAlive;
    if (data.isHost !== undefined) updateData.isHost = data.isHost;
    if (data.isSheriff !== undefined) updateData.isSheriff = data.isSheriff;
    if (data.hasShield !== undefined) updateData.hasShield = data.hasShield;
    if (data.actionUsed !== undefined) updateData.actionUsed = data.actionUsed;

    // Only perform update if there are changes
    if (Object.keys(updateData).length > 0) {
      const [player] = await db
        .update(players)
        .set(updateData)
        .where(and(eq(players.gameId, gameId), eq(players.playerId, playerId)))
        .returning();
      return player;
    }

    return currentPlayer;
  },

  getPlayer: async (gameId, playerId) => {
    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.gameId, gameId), eq(players.playerId, playerId)));
    return player;
  },

  createChatMessage: async (data) => {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  },

  getChatMessagesByGame: async (gameId) => {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.gameId, gameId));
  },

  createVote: async (data) => {
    const [vote] = await db.insert(votes).values(data).returning();
    return vote;
  },

  getVotesByGameId: async (gameId) => {
    return db.select().from(votes).where(eq(votes.gameId, gameId));
  },

  createNightAction: async (data) => {
    const [action] = await db.insert(nightActions).values(data).returning();
    return action;
  },

  getNightActionsByGameId: async (gameId) => {
    return db
      .select()
      .from(nightActions)
      .where(eq(nightActions.gameId, gameId));
  },
};
