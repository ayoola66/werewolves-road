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

      // Build update query parts
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if ('status' in data) {
        setClauses.push(`status = $${paramIndex}`);
        values.push(data.status);
        paramIndex++;
      }
      if ('settings' in data) {
        setClauses.push(`settings = $${paramIndex}`);
        values.push(data.settings);
        paramIndex++;
      }
      if ('currentPhase' in data) {
        setClauses.push(`current_phase = $${paramIndex}`);
        values.push(data.currentPhase);
        paramIndex++;
      }
      if ('phaseTimer' in data) {
        setClauses.push(`phase_timer = $${paramIndex}`);
        values.push(data.phaseTimer);
        paramIndex++;
      }

      // Add id to values
      values.push(id);

      const query = sql.raw(`
        UPDATE games
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `);

      const [game] = await db.execute(query, values);
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

      // Build update query parts
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if ('role' in data) {
        setClauses.push(`role = $${paramIndex}`);
        values.push(data.role);
        paramIndex++;
      }
      if ('team' in data) {
        setClauses.push(`team = $${paramIndex}`);
        values.push(data.team);
        paramIndex++;
      }
      if ('isAlive' in data) {
        setClauses.push(`is_alive = $${paramIndex}`);
        values.push(data.isAlive);
        paramIndex++;
      }
      if ('isHost' in data) {
        setClauses.push(`is_host = $${paramIndex}`);
        values.push(data.isHost);
        paramIndex++;
      }
      if ('isSheriff' in data) {
        setClauses.push(`is_sheriff = $${paramIndex}`);
        values.push(data.isSheriff);
        paramIndex++;
      }
      if ('hasShield' in data) {
        setClauses.push(`has_shield = $${paramIndex}`);
        values.push(data.hasShield);
        paramIndex++;
      }
      if ('actionUsed' in data) {
        setClauses.push(`action_used = $${paramIndex}`);
        values.push(data.actionUsed);
        paramIndex++;
      }

      // Add game_id and player_id to values
      values.push(gameId, playerId);

      const query = sql.raw(`
        UPDATE players
        SET ${setClauses.join(', ')}
        WHERE game_id = $${paramIndex} AND player_id = $${paramIndex + 1}
        RETURNING *
      `);

      const [player] = await db.execute(query, values);
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
