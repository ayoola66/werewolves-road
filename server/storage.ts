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
    try {
      // Create a properly typed update object
      const updateData: Partial<typeof games.$inferInsert> = {};
      
      // Only include fields that exist in the schema
      if ('status' in data) updateData.status = data.status;
      if ('settings' in data) updateData.settings = data.settings;
      if ('currentPhase' in data) updateData.currentPhase = data.currentPhase;
      if ('phaseTimer' in data) updateData.phaseTimer = data.phaseTimer;
      
      const [game] = await db
        .update(games)
        .set(updateData)
        .where(eq(games.id, id))
        .returning();
      return game;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  },

  getPlayersByGameId: async (gameId) => {
    return db.select().from(players).where(eq(players.gameId, gameId));
  },

  createPlayer: async (data) => {
    const [player] = await db.insert(players).values(data).returning();
    return player;
  },

  updatePlayer: async (gameId, playerId, data) => {
    try {
      // Get current player data
      const [currentPlayer] = await db
        .select()
        .from(players)
        .where(and(eq(players.gameId, gameId), eq(players.playerId, playerId)));

      if (!currentPlayer) {
        throw new Error('Player not found');
      }

      // Create a properly typed update object
      const updateData: Partial<typeof players.$inferInsert> = {};

      // Only include fields that exist in the schema
      if ('role' in data) updateData.role = data.role;
      if ('isAlive' in data) updateData.isAlive = data.isAlive;
      if ('isHost' in data) updateData.isHost = data.isHost;
      if ('isSheriff' in data) updateData.isSheriff = data.isSheriff;
      if ('hasShield' in data) updateData.hasShield = data.hasShield;
      if ('actionUsed' in data) updateData.actionUsed = data.actionUsed;

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
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
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
