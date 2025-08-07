import {
  games,
  players,
  chatMessages,
  votes,
  nightActions,
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
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
      // Get current game data
      const [currentGame] = await db
        .select()
        .from(games)
        .where(eq(games.id, id));

      if (!currentGame) {
        throw new Error('Game not found');
      }

      // Create update object with only valid columns
      const updateData = {};
      if ('status' in data) updateData.status = data.status;
      if ('settings' in data) updateData.settings = data.settings;
      if ('currentPhase' in data) updateData.current_phase = data.currentPhase;
      if ('phaseTimer' in data) updateData.phase_timer = data.phaseTimer;

      // If no changes, return current game
      if (Object.keys(updateData).length === 0) {
        return currentGame;
      }

      // Use direct column references
      const [game] = await db.execute(
        sql`UPDATE games SET ${sql.join(
          Object.entries(updateData).map(
            ([col, val]) => sql`"${sql.raw(col)}" = ${val}`
          ),
          ','
        )} WHERE id = ${id} RETURNING *`
      );

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

      // Create update object with only valid columns
      const updateData = {};
      if ('role' in data) updateData.role = data.role;
      if ('isAlive' in data) updateData.is_alive = data.isAlive;
      if ('isHost' in data) updateData.is_host = data.isHost;
      if ('isSheriff' in data) updateData.is_sheriff = data.isSheriff;
      if ('hasShield' in data) updateData.has_shield = data.hasShield;
      if ('actionUsed' in data) updateData.action_used = data.actionUsed;

      // If no changes, return current player
      if (Object.keys(updateData).length === 0) {
        return currentPlayer;
      }

      // Use direct column references
      const [player] = await db.execute(
        sql`UPDATE players SET ${sql.join(
          Object.entries(updateData).map(
            ([col, val]) => sql`"${sql.raw(col)}" = ${val}`
          ),
          ','
        )} WHERE game_id = ${gameId} AND player_id = ${playerId} RETURNING *`
      );

      return player;
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
