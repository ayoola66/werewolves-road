import {
  games,
  players,
  chatMessages,
  votes,
  nightActions,
} from "../shared/schema";
import { eq, and, sql, type SQL } from "drizzle-orm";
import { db } from "./db";

import type { InferModel } from "drizzle-orm";

type Game = InferModel<typeof games>;
type Player = InferModel<typeof players>;
type ChatMessage = InferModel<typeof chatMessages>;
type Vote = InferModel<typeof votes>;
type NightAction = InferModel<typeof nightActions>;

type GameInsert = InferModel<typeof games, "insert">;
type PlayerInsert = InferModel<typeof players, "insert">;
type ChatMessageInsert = InferModel<typeof chatMessages, "insert">;
type VoteInsert = InferModel<typeof votes, "insert">;
type NightActionInsert = InferModel<typeof nightActions, "insert">;

export interface DatabaseStorage {
  createGame: (data: GameInsert) => Promise<Game>;
  getGameByCode: (code: string) => Promise<Game | undefined>;
  updateGame: (id: number, data: Partial<GameInsert>) => Promise<Game>;
  getPlayersByGameId: (gameId: string) => Promise<Player[]>;
  createPlayer: (data: PlayerInsert) => Promise<Player>;
  updatePlayer: (gameId: string, playerId: string, data: Partial<PlayerInsert>) => Promise<Player>;
  getPlayer: (gameId: string, playerId: string) => Promise<Player | undefined>;
  createChatMessage: (data: ChatMessageInsert) => Promise<ChatMessage>;
  getChatMessagesByGame: (gameId: string) => Promise<ChatMessage[]>;
  createVote: (data: VoteInsert) => Promise<Vote>;
  getVotesByGameId: (gameId: string) => Promise<Vote[]>;
  createNightAction: (data: NightActionInsert) => Promise<NightAction>;
  getNightActionsByGameId: (gameId: string) => Promise<NightAction[]>;
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
    console.log('Getting game by code:', code);
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.gameCode, code));
    console.log('Found game:', game);
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

      // Build update query
      const updateFields: SQL[] = [];
      
      if ('status' in data) updateFields.push(sql`status = ${data.status}`);
      if ('settings' in data) updateFields.push(sql`settings = ${data.settings}`);
      if ('currentPhase' in data) updateFields.push(sql`current_phase = ${data.currentPhase}`);
      if ('phaseTimer' in data) updateFields.push(sql`phase_timer = ${data.phaseTimer}`);

      if (updateFields.length === 0) {
        return currentGame;
      }

      const query = sql`
        UPDATE games
        SET ${sql.join(updateFields, sql`, `)}
        WHERE id = ${id}
        RETURNING *
      `;

      const result = await db.execute(query);
      const [game] = result as unknown as Game[];
      return game;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  },

  getPlayersByGameId: async (gameId) => {
    console.log('Getting players for game:', gameId);
    const result = await db.select().from(players).where(eq(players.gameId, gameId));
    console.log('Found players:', result);
    return result;
  },

  createPlayer: async (data) => {
    console.log('Creating player:', data);
    const [player] = await db.insert(players).values(data).returning();
    console.log('Created player:', player);
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

      // Build update query
      const updateFields: SQL[] = [];
      
      if ('role' in data) updateFields.push(sql`role = ${data.role}`);
      if ('team' in data) updateFields.push(sql`team = ${data.team}`);
      if ('isAlive' in data) updateFields.push(sql`is_alive = ${data.isAlive}`);
      if ('isHost' in data) updateFields.push(sql`is_host = ${data.isHost}`);
      if ('isSheriff' in data) updateFields.push(sql`is_sheriff = ${data.isSheriff}`);
      if ('hasShield' in data) updateFields.push(sql`has_shield = ${data.hasShield}`);
      if ('actionUsed' in data) updateFields.push(sql`action_used = ${data.actionUsed}`);

      if (updateFields.length === 0) {
        return currentPlayer;
      }

      const query = sql`
        UPDATE players
        SET ${sql.join(updateFields, sql`, `)}
        WHERE game_id = ${gameId} AND player_id = ${playerId}
        RETURNING *
      `;

      const result = await db.execute(query);
      const [player] = result as unknown as Player[];
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
