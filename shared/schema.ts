import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { type InferModel } from "drizzle-orm";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull(),
  hostId: text("host_id").notNull(),
  settings: json("settings").notNull(),
  status: text("status").default("lobby"),
  currentPhase: text("current_phase").default("lobby"),
  phaseTimer: text("phase_timer"),
  nightCount: text("night_count").default("0"),
  dayCount: text("day_count").default("0"),
  lastPhaseChange: timestamp("last_phase_change").defaultNow(),
  requiredActions: json("required_actions").default([]),
  completedActions: json("completed_actions").default([]),
  phaseEndTime: timestamp("phase_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  isAlive: boolean("is_alive").default(true),
  isHost: boolean("is_host").default(false),
  isSheriff: boolean("is_sheriff").default(false),
  hasShield: boolean("has_shield"),
  actionUsed: boolean("action_used"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id"),
  playerName: text("player_name").notNull(),
  message: text("message").notNull(),
  type: text("type").default("player"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  voterId: text("voter_id").notNull(),
  targetId: text("target_id").notNull(),
  phase: text("phase").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nightActions = pgTable("night_actions", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerId: text("player_id").notNull(),
  targetId: text("target_id"),
  actionType: text("action_type").notNull(),
  data: json("data"),
  phase: text("phase").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Game = InferModel<typeof games>;
export type Player = InferModel<typeof players>;
export type ChatMessage = InferModel<typeof chatMessages>;
export type Vote = InferModel<typeof votes>;
export type NightAction = InferModel<typeof nightActions>;

export type InsertGame = InferModel<typeof games, "insert">;
export type InsertPlayer = InferModel<typeof players, "insert">;
export type InsertChatMessage = InferModel<typeof chatMessages, "insert">;
export type InsertVote = InferModel<typeof votes, "insert">;
export type InsertNightAction = InferModel<typeof nightActions, "insert">;
